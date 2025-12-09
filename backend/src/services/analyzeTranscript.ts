import {
  ProjectSummary,
  ProjectSummarySchema,
  createEmptyProjectSummary,
} from "../models/ProjectSummary";
import { messageRepository } from "../repositories/messageRepository";

/**
 * Ollama configuration
 * OLLAMA_HOST: URL of the Ollama server (default: http://localhost:11434)
 * OLLAMA_MODEL: Model to use (default: llama3.2)
 */
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

/**
 * System prompt for the AI to extract project information
 */
const SYSTEM_PROMPT = `Tu es un assistant expert en extraction d'informations de projets à partir de conversations informelles.

OBJECTIF: Analyser une transcription et extraire EXACTEMENT ces 4 informations:

## 1. TITLE (string) - Le NOM PROPRE du projet
ATTENTION: C'est le NOM du projet, PAS sa description !
- Cherche des expressions comme:
  - "s'appelle X", "appelé X", "nommé X"
  - "c'est X", "le nom c'est X", "nom provisoire c'est X"
  - "Projet X", "projet nommé X"
  - "On lance X", "on fait X"
- Le titre est généralement UN ou DEUX mots en CamelCase ou avec majuscule
- Exemples de BONS titres: "EcoRoute", "CleverClass", "RoomFlow", "Helios", "Iris School App"
- Exemples de MAUVAIS titres (descriptions): "qui gère les réservations", "une plateforme de cours"

## 2. START_DATE (string YYYY-MM-DD) - Date de DÉBUT
Convertir TOUTES les expressions en YYYY-MM-DD:
- "début mars 2025" → "2025-03-01"
- "mi-janvier 2025" → "2025-01-15"
- "vers mi-janvier" → "2025-01-15"
- "genre le 15" (dans le contexte d'un mois) → le 15 de ce mois
- "1er février 2025" → "2025-02-01"
- "début avril 2025" → "2025-04-01"
- "2024-11-10" → "2024-11-10"

## 3. END_DATE (string YYYY-MM-DD) - Date de FIN
Mêmes règles que start_date:
- "fin juin 2025" → "2025-06-30"
- "fin juin" (sans année) → "2025-06-30"
- "terminer avant l'été" → "2025-06-30"

## 4. BUDGET (number entier) - Budget en euros
- "78k" ou "78K" → 78000
- "12 500 €" → 12500
- "5 000 euros" → 5000
- "environ 2000" → 2000

## RÈGLES STRICTES
1. Réponds UNIQUEMENT avec du JSON valide, SANS markdown, SANS backticks, SANS explication
2. Si une info n'est pas mentionnée → null
3. Ne devine JAMAIS - utilise uniquement ce qui est dit explicitement
4. Pour les dates sans année, utilise 2025
5. Le TITRE doit être le NOM du projet (1-3 mots), PAS une description de ce qu'il fait

## EXEMPLES

Entrée: "Le projet s'appelle EcoRoute. On commence début mars 2025 et on finit fin juin. Le budget c'est 15 000 euros."
Sortie: {"title":"EcoRoute","start_date":"2025-03-01","end_date":"2025-06-30","budget":15000}

Entrée: "Alors le projet... on l'a appelé CleverClass. Ça doit démarrer vers mi-janvier 2025, genre le 15 je pense. On doit le terminer avant l'été, donc fin juin 2025. Le budget est de 12 500 € normalement."
Sortie: {"title":"CleverClass","start_date":"2025-01-15","end_date":"2025-06-30","budget":12500}

Entrée: "Bon du coup on veut faire une plateforme qui gère les réservations de salles. Le nom provisoire c'est RoomFlow. On a discuté pour commencer début avril 2025. Fin on sait pas encore. Budget : je crois qu'on a 5 000 euros pour la première version"
Sortie: {"title":"RoomFlow","start_date":"2025-04-01","end_date":null,"budget":5000}

Entrée: "On lance un projet nommé Iris School App. Début prévu le 1er février 2025, pas encore de date de fin. Budget environ 2000 euros."
Sortie: {"title":"Iris School App","start_date":"2025-02-01","end_date":null,"budget":2000}

Entrée: "Projet Helios. Start 2024-11-10, fin prévue 2025-04-20. Budget : 78k"
Sortie: {"title":"Helios","start_date":"2024-11-10","end_date":"2025-04-20","budget":78000}`;

/**
 * Calls Ollama API to generate a response
 */
async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.8,
        num_predict: 512,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.response || "";
}

/**
 * Checks if Ollama is available and the model is loaded
 */
export async function checkOllamaStatus(): Promise<{
  available: boolean;
  modelLoaded: boolean;
  error?: string;
}> {
  try {
    // Check if Ollama is running
    const tagsResponse = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!tagsResponse.ok) {
      return {
        available: false,
        modelLoaded: false,
        error: "Ollama not reachable",
      };
    }

    const tags = await tagsResponse.json();
    const models = tags.models || [];
    const modelLoaded = models.some((m: { name: string }) =>
      m.name.includes(OLLAMA_MODEL.split(":")[0])
    );

    return { available: true, modelLoaded };
  } catch (error) {
    return {
      available: false,
      modelLoaded: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Analyzes the transcript of a conversation and extracts project information
 * using Ollama (local LLM)
 *
 * @param conversationId - The ID of the conversation to analyze
 * @returns ProjectSummary with extracted information
 */
export async function analyzeTranscript(conversationId: string): Promise<{
  summary: ProjectSummary;
  aiMessage: string;
}> {
  // Get conversation history
  const transcriptText = await messageRepository.getConversationHistory(
    conversationId
  );

  if (!transcriptText.trim()) {
    return {
      summary: createEmptyProjectSummary(),
      aiMessage:
        "Je n'ai pas encore reçu d'informations sur votre projet. Dites-moi en plus !",
    };
  }

  try {
    // Create the prompt
    const prompt = `${SYSTEM_PROMPT}

MAINTENANT, analyse cette transcription et retourne UNIQUEMENT le JSON (sans aucun texte avant ou après):

"""
${transcriptText}
"""

JSON:`;

    // Call Ollama API
    const content = await callOllama(prompt);

    if (!content) {
      throw new Error("Empty response from Ollama");
    }

    console.log("[Ollama] Raw response:", content);

    // Clean the response (remove potential markdown code blocks)
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    console.log("[Ollama] Cleaned content:", cleanedContent);

    // Parse and validate the response
    const parsedResponse = JSON.parse(cleanedContent);

    // Ensure budget is a number, not a string
    if (parsedResponse.budget && typeof parsedResponse.budget === "string") {
      parsedResponse.budget = parseInt(
        parsedResponse.budget.replace(/\s/g, ""),
        10
      );
    }

    const validatedSummary = ProjectSummarySchema.parse(parsedResponse);

    // Generate a friendly AI message based on what was extracted
    const aiMessage = generateAiMessage(validatedSummary);

    return {
      summary: validatedSummary,
      aiMessage,
    };
  } catch (error) {
    console.error("[AnalyzeTranscript] Error:", error);

    // Fallback to mock if Ollama fails
    console.log("[AnalyzeTranscript] Falling back to mock extraction");
    return analyzeTranscriptMock(conversationId);
  }
}

/**
 * Generates a friendly AI message based on the extracted summary
 */
function generateAiMessage(summary: ProjectSummary): string {
  const parts: string[] = [];

  if (summary.title) {
    parts.push(`J'ai noté le nom du projet : "${summary.title}"`);
  }
  if (summary.start_date) {
    parts.push(`Date de début : ${formatDate(summary.start_date)}`);
  }
  if (summary.end_date) {
    parts.push(`Date de fin : ${formatDate(summary.end_date)}`);
  }
  if (summary.budget) {
    parts.push(`Budget : ${summary.budget.toLocaleString("fr-FR")} €`);
  }

  if (parts.length === 0) {
    return "Je vous écoute, continuez à me parler de votre projet.";
  }

  return `Bien noté ! ${parts.join(". ")}.`;
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Mock implementation for testing without Ollama
 * Extracts basic information using regex patterns
 */
export async function analyzeTranscriptMock(conversationId: string): Promise<{
  summary: ProjectSummary;
  aiMessage: string;
}> {
  const transcriptText = await messageRepository.getConversationHistory(
    conversationId
  );

  console.log("[Mock] Analyzing transcript:", transcriptText);

  const summary: ProjectSummary = {
    title: extractTitle(transcriptText),
    start_date: extractDate(transcriptText, "start"),
    end_date: extractDate(transcriptText, "end"),
    budget: extractBudget(transcriptText),
  };

  console.log("[Mock] Extracted summary:", summary);

  const aiMessage = generateAiMessage(summary);

  return { summary, aiMessage };
}

// ============================================
// Helper regex extractors for mock mode
// ============================================

function extractTitle(text: string): string | null {
  const patterns = [
    // "Le nom (provisoire) c'est X" - highest priority
    /(?:le\s+)?nom\s+(?:provisoire\s+)?(?:c'est|est)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s]{0,30}?)(?:\.|,|$|\s+(?:on|le|la|pour|avec|budget|début|fin|start|end))/i,
    // "on l'a appelé X" / "on l'appelle X"
    /on\s+l'?a?\s*(?:appelé|appelle|nommé)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s]{0,30}?)(?:\.|,|$|\s+(?:ça|on|le|la|pour|avec|budget|début|fin))/i,
    // "s'appelle X"
    /s'appelle\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s]{0,30}?)(?:\.|,|$|\s+(?:on|le|la|pour|avec|budget|début|fin|start|end))/i,
    // "Projet X" at the beginning
    /^(?:le\s+)?projet\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s]{0,25}?)(?:\.|,|\s+(?:start|début|fin|budget|on))/i,
    // "projet nommé/appelé X"
    /projet\s+(?:nommé|appelé|intitulé)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s]{0,30}?)(?:\.|,|$|\s+(?:début|fin|budget))/i,
    // "On lance X" / "On lance un projet nommé X"
    /on\s+lance\s+(?:un\s+projet\s+(?:nommé\s+)?)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s]{0,30}?)(?:\.|,|$|\s+(?:début|fin|budget))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let title = match[1].trim();

      // Remove trailing common words
      title = title
        .replace(
          /\s+(on|le|la|les|un|une|des|du|de|et|ou|pour|qui|que|ça|ca)$/i,
          ""
        )
        .trim();

      // Validate: must be more than 1 char and not just common words or descriptions
      const invalidWords =
        /^(le|la|les|un|une|des|du|de|et|ou|on|pour|qui|que|ça|ca|une\s+plateforme|qui\s+gère|faire)$/i;
      const isDescription = /^(qui|une|faire|créer|développer|construire)/i;

      if (
        title.length > 1 &&
        !invalidWords.test(title) &&
        !isDescription.test(title)
      ) {
        // Capitalize first letter of each word for proper noun
        return title
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
  }
  return null;
}

function extractDate(text: string, type: "start" | "end"): string | null {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Month mapping
  const months: { [key: string]: string } = {
    janvier: "01",
    février: "02",
    fevrier: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    août: "08",
    aout: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    décembre: "12",
    decembre: "12",
  };

  // Patterns for start dates
  const startPatterns = [
    /(?:start|début|démarre|commence)\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /(?:commence|démarre|début|start|démarrer)\s*(?:le|en|:)?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
    /(?:commence|démarre|début|start|démarrer)\s*(?:le\s+)?(?:prévu\s+)?(?:le\s+)?(\d{1,2})(?:er|ème|e)?\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
    /(?:commence|démarre|début|start|démarrer|vers)\s*(?:le\s+)?(mi)[- ]?(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
    /(?:commence|démarre|début|start|démarrer)\s*(?:prévu\s+)?(?:le\s+)?(?:vers\s+)?(début|mi|fin|milieu)?\s*[- ]?(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
    /(?:à partir d[eu]|dès)\s*(?:le\s+)?(\d{1,2})?(?:er|ème|e)?\s*(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
  ];

  // Patterns for end dates
  const endPatterns = [
    /(?:fin\s*prévue?|end|deadline|termine|fini)\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /(?:termine|fini|fin|end|deadline)\s*(?:le|en|:)?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
    /(?:termine|fini|fin|end|deadline)\s*(?:le\s+)?(?:prévue?\s+)?(?:le\s+)?(\d{1,2})(?:er|ème|e)?\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
    /(?:termine|fini|finit|fin|end|donc\s+fin)\s*(?:prévue?\s+)?(?:le\s+)?(début|mi|fin|milieu)?\s*(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
    /terminer\s+avant\s+l'été/i,
    /(?:livraison|livré)\s*(?:le\s+|pour\s+)?(?:le\s+)?(\d{1,2})?(?:er|ème|e)?\s*(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(\d{4})?/i,
  ];

  const patterns = type === "start" ? startPatterns : endPatterns;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Special case: "terminer avant l'été"
      if (pattern.source.includes("avant l'été")) {
        return `${nextYear}-06-30`;
      }

      // Direct YYYY-MM-DD format
      if (match[1] && /^\d{4}-\d{2}-\d{2}$/.test(match[1])) {
        return match[1];
      }

      // DD/MM/YYYY format
      if (
        match[1] &&
        match[2] &&
        match[3] &&
        /^\d{1,2}$/.test(match[1]) &&
        /^\d{1,2}$/.test(match[2])
      ) {
        let year = match[3];
        if (year.length === 2) year = "20" + year;
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        return `${year}-${month}-${day}`;
      }

      // "DD mois YYYY" format (1er février 2025)
      if (
        match[1] &&
        /^\d{1,2}$/.test(match[1]) &&
        match[2] &&
        months[match[2].toLowerCase()]
      ) {
        const day = match[1].padStart(2, "0");
        const month = months[match[2].toLowerCase()];
        const year = match[3] || nextYear.toString();
        return `${year}-${month}-${day}`;
      }

      // "mi-janvier" format (with hyphen)
      if (match[1] === "mi" && match[2] && months[match[2].toLowerCase()]) {
        const month = months[match[2].toLowerCase()];
        const year = match[3] || nextYear.toString();
        return `${year}-${month}-15`;
      }

      // "début/mi/fin mois YYYY" format
      if (match[2] && months[match[2].toLowerCase()]) {
        const position =
          match[1]?.toLowerCase() || (type === "end" ? "fin" : "début");
        const month = months[match[2].toLowerCase()];
        const year = match[3] || nextYear.toString();

        let day = "01";
        if (position === "mi" || position === "milieu") {
          day = "15";
        } else if (position === "fin") {
          const lastDay = new Date(
            parseInt(year),
            parseInt(month),
            0
          ).getDate();
          day = lastDay.toString().padStart(2, "0");
        }

        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

function extractBudget(text: string): number | null {
  const patterns = [
    /budget\s*(?:de|:)?\s*(?:environ\s+)?(?:je\s+crois\s+qu'on\s+a\s+)?(\d+)\s*[kK]\s*€?/i,
    /on\s+a\s+(\d[\d\s]*)\s*(?:€|euros?)/i,
    /(\d+)\s*[kK]\s*(?:€|euros?|EUR)?/i,
    /budget\s*(?:de|:)?\s*(?:environ\s+)?(?:je\s+crois\s+qu'on\s+a\s+)?(\d[\d\s]*)\s*(?:€|euros?|EUR)/i,
    /(\d[\d\s]+)\s*(?:€|euros?|EUR)/i,
    /budget\s*(?:de|:)?\s*(?:environ\s+)?(\d[\d\s]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let value = match[1].replace(/\s/g, "");
      let num = parseInt(value, 10);

      if (match[0].toLowerCase().includes("k")) {
        num *= 1000;
      }

      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  return null;
}
