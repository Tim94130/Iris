import { useState, useEffect, useRef } from "react";
import SpeechToText from "speech-to-text";

const MyComponent = () => {
  const [interimText, setInterimText] = useState("Begin speaking...");
  const [finalisedText, setFinalisedText] = useState([]);
  const [listening, setListening] = useState(false);

  const [error, setError] = useState(null);
  const listenerRef = useRef(null);
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

    const prompt = `Tu es un assistant qui analyse des transcriptions de réunions. 
Analyse la transcription suivante et extrais les informations au format JSON strict (titre, budget, date_debut, date_fin, resume).
Si une information n'est pas mentionnée, suppose la ou mentionne null.

Transcription:
"${transcription}"

Réponds UNIQUEMENT avec un JSON valide dans ce format exact, sans texte avant ou après:
{
  "titre_projet": "string ou null",
  "budget": "string ou null",
  "date_debut": "string ou null",
  "date_fin": "string ou null",
  "resume": "string ou null"
}`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-oss:20b",
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

  // const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

  // async function askToGemini(question) {
  //   const response = await ai.models.generateContent({
  //     model: "gemini-2.5-flash",
  //     contents: question,
  //   });
  //   setGeminiResponse(response.text);
  // }

  // // Garder la ref synchronisée avec l'état
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    // Vérifier si le navigateur supporte la reconnaissance vocale
    if (
      !("SpeechRecognition" in window) &&
      !("webkitSpeechRecognition" in window)
    ) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const onAnythingSaid = (text) => {
      setInterimText(text);
    };

    const onEndEvent = () => {
      // TOUJOURS relancer l'écoute si on est en mode listening
      if (listeningRef.current && listenerRef.current) {
        // Petit délai pour éviter les problèmes
        setTimeout(() => {
          if (listeningRef.current) {
            try {
              listenerRef.current?.startListening();
            } catch (e) {
              console.log("Relance du micro...");
            }
          }
        }, 100);
      }
    };

    const onFinalised = (text) => {
      setFinalisedText((prev) => {
        const newTexts = [text, ...prev];
        // Mettre à jour la ref et déclencher l'analyse
        accumulatedTextRef.current = newTexts;
        // Analyser en temps réel avec le nouveau texte
        analyzeWithOllamaRef.current(newTexts);
        return newTexts;
      });
      setInterimText("");
    };

    try {
      const speechListener = new SpeechToText(
        onFinalised,
        onEndEvent,
        onAnythingSaid,
        "fr-FR"
      );
      listenerRef.current = speechListener;
    } catch (err) {
      setError(err.message);
    }

    // Cleanup function
    return () => {
      listenerRef.current?.stopListening();
    };
  }, []); // Pas de dépendances - le listener est créé une seule fois

  const toggleListening = () => {
    if (listening) {
      listenerRef.current?.stopListening();
    } else {
      listenerRef.current?.startListening();
    }
    setListening(!listening);
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

        {extractedInfo && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-purple-500">
              <h3 className="font-bold text-purple-700 mb-2">
                📋 Titre du Projet
              </h3>
              <p className="text-gray-700">
                {extractedInfo.titre_projet || "Non mentionné"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-green-500">
              <h3 className="font-bold text-green-700 mb-2">💰 Budget</h3>
              <p className="text-gray-700">
                {extractedInfo.budget || "Non mentionné"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-700 mb-2">📅 Date de Début</h3>
              <p className="text-gray-700">
                {extractedInfo.date_debut || "Non mentionnée"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-orange-500">
              <h3 className="font-bold text-orange-700 mb-2">📅 Date de Fin</h3>
              <p className="text-gray-700">
                {extractedInfo.date_fin || "Non mentionnée"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow border-l-4 border-indigo-500">
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
