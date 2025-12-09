import { useState, useEffect, useRef } from "react";

const MyComponent = () => {
  const [interimText, setInterimText] = useState("Begin speaking...");
  const [finalisedText, setFinalisedText] = useState([]);
  const [listening, setListening] = useState(false);

  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  // État pour les informations extraites par Ollama
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isAnalyzingRef = useRef(false);

  // Ref pour stocker le texte accumulé (pour l'analyse en temps réel)
  const accumulatedTextRef = useRef([]);

  // Fonction pour appeler Ollama et extraire les informations (stockée dans une ref)
  const analyzeWithOllamaRef = useRef(async (textArray) => {
    if (textArray.length === 0 || isAnalyzingRef.current) return;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    const transcription = textArray.join(" ");

    const prompt = `Tu es un expert en extraction de données structurées. Ta tâche est d'analyser la transcription d'une réunion de lancement de projet et d'extraire les informations clés au format JSON strict.

Contexte temporel :
- Date actuelle (aujourd'hui) : ${new Date().toISOString().split("T")[0]}
- Utilise cette date pour résoudre les références relatives (ex: "lundi prochain", "dans 3 mois", "asap").

Instructions pour les champs :
1. "titre_projet" : Un nom court et précis. Si non mentionné, déduis-le du contexte.
2. "budget" : Le montant mentionné avec sa devise (ex: "5000 EUR"). Si aucun montant précis n'est dit, renvoie null. N'INVENTE PAS de budget.
3. "date_debut" : Format ISO 8601 (YYYY-MM-DD).
   - Si "asap" ou "dès que possible" est mentionné, utilise la date actuelle.
   - Si non mentionné, renvoie null.
4. "date_fin" : Format ISO 8601 (YYYY-MM-DD).
   - Si une durée est donnée (ex: "projet de 3 mois"), calcule la date de fin à partir de la date de début.
   - Si non mentionné, renvoie null.
5. "resume" : Une synthèse professionnelle de 2 phrases maximum décrivant l'objectif du projet.

Règles impératives :
- NE PAS inventer d'informations factuelles (budget, dates spécifiques) si elles ne sont pas dans le texte. Utilise null.
- Réponds UNIQUEMENT avec le JSON brut. Pas de markdown, pas de phrase d'intro, pas de conclusion.
- Assure-toi que le JSON est valide (pas de virgule traînante).
- Corrige les données si je refouris des informations supplémentaires plus tard.




Transcription à analyser :
"""
${transcription}
"""

Format de sortie attendu :
{
  "titre_projet": string | null,
  "budget": string | null,
  "date_debut": "YYYY-MM-DD" | null,
  "date_fin": "YYYY-MM-DD" | null,
  "resume": string | null
}`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma3:4b",
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur de connexion à Ollama");
      }

      const data = await response.json();

      // Parser la réponse JSON d'Ollama
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedInfo = JSON.parse(jsonMatch[0]);
          setExtractedInfo(parsedInfo);
        } else {
          throw new Error("Format de réponse invalide");
        }
      } catch (parseError) {
        console.error("Erreur parsing:", data.response);
      }
    } catch (err) {
      console.error(`Erreur Ollama: ${err.message}`);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  });

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    // Vérifier si le navigateur supporte la reconnaissance vocale
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // NE JAMAIS S'ARRÊTER
    recognition.interimResults = true; // Résultats en temps réel
    recognition.lang = "fr-FR";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      if (finalTranscript) {
        setFinalisedText((prev) => {
          const newTexts = [finalTranscript, ...prev];
          accumulatedTextRef.current = newTexts;
          analyzeWithOllamaRef.current(newTexts);
          return newTexts;
        });
        setInterimText("");
      }
    };

    recognition.onerror = (event) => {
      console.log("Erreur reconnaissance vocale:", event.error);
      // Ne pas afficher l'erreur "no-speech" car c'est normal
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Erreur: ${event.error}`);
      }
      // Relancer immédiatement si on est toujours en mode écoute
      if (listeningRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Ignorer si déjà démarré
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      // TOUJOURS relancer si on est en mode écoute
      if (listeningRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Ignorer si déjà démarré
          }
        }, 50); // Délai très court pour éviter de perdre des mots
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch (e) {
        console.log("Erreur démarrage:", e);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel */}
      <div className="w-1/2 bg-white p-8 shadow-lg overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Speech to Text
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={toggleListening}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white mb-6 transition ${
            listening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {listening ? "Stop Listening" : "Start Listening"}
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Current:</h2>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-300 min-h-20">
            <p className="text-gray-600 italic">{interimText}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Transcriptions:
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {finalisedText.map((text, idx) => (
              <div
                key={idx}
                className="p-3 bg-blue-50 rounded border border-blue-200"
              >
                <p className="text-gray-800">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 bg-gray-50 p-8 shadow-inner overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Analyse IA</h2>
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">Analyse en cours...</span>
            </div>
          )}
        </div>

        {/* Skeleton Loaders pendant l'analyse */}
        {isAnalyzing && !extractedInfo && (
          <div className="space-y-4 animate-pulse">
            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-purple-300">
              <div className="h-4 bg-purple-200 rounded w-32 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-green-300">
              <div className="h-4 bg-green-200 rounded w-24 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-300">
              <div className="h-4 bg-blue-200 rounded w-28 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-orange-300">
              <div className="h-4 bg-orange-200 rounded w-24 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-indigo-300">
              <div className="h-4 bg-indigo-200 rounded w-20 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        )}

        {/* Skeleton Loaders pendant la mise à jour (quand on a déjà des données) */}
        {isAnalyzing && extractedInfo && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-purple-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
              <h3 className="font-bold text-purple-700 mb-2">
                📋 Titre du Projet
              </h3>
              <p className="text-gray-700">
                {extractedInfo.titre_projet || "Non mentionné"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-green-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
              <h3 className="font-bold text-green-700 mb-2">💰 Budget</h3>
              <p className="text-gray-700">
                {extractedInfo.budget || "Non mentionné"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
              <h3 className="font-bold text-blue-700 mb-2">📅 Date de Début</h3>
              <p className="text-gray-700">
                {extractedInfo.date_debut || "Non mentionnée"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-orange-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
              <h3 className="font-bold text-orange-700 mb-2">📅 Date de Fin</h3>
              <p className="text-gray-700">
                {extractedInfo.date_fin || "Non mentionnée"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-indigo-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
              <h3 className="font-bold text-indigo-700 mb-2">📝 Résumé</h3>
              <p className="text-gray-700">
                {extractedInfo.resume || "Non disponible"}
              </p>
            </div>
          </div>
        )}

        {extractedInfo && !isAnalyzing && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-purple-500 transition-all duration-300">
              <h3 className="font-bold text-purple-700 mb-2">
                📋 Titre du Projet
              </h3>
              <p className="text-gray-700">
                {extractedInfo.titre_projet || "Non mentionné"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-green-500 transition-all duration-300">
              <h3 className="font-bold text-green-700 mb-2">💰 Budget</h3>
              <p className="text-gray-700">
                {extractedInfo.budget || "Non mentionné"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500 transition-all duration-300">
              <h3 className="font-bold text-blue-700 mb-2">📅 Date de Début</h3>
              <p className="text-gray-700">
                {extractedInfo.date_debut || "Non mentionnée"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-orange-500 transition-all duration-300">
              <h3 className="font-bold text-orange-700 mb-2">📅 Date de Fin</h3>
              <p className="text-gray-700">
                {extractedInfo.date_fin || "Non mentionnée"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-indigo-500 transition-all duration-300">
              <h3 className="font-bold text-indigo-700 mb-2">📝 Résumé</h3>
              <p className="text-gray-700">
                {extractedInfo.resume || "Non disponible"}
              </p>
            </div>
          </div>
        )}

        {!extractedInfo && !isAnalyzing && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">🎤 Commencez à parler</p>
            <p className="text-sm mt-2">
              L'analyse se fera automatiquement en temps réel
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComponent;
