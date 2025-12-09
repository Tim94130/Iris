import { useCallback, useEffect, useRef, useState } from "react";
// @ts-ignore - speech-to-text doesn't have types
import SpeechToText from "speech-to-text";

/**
 * Hook for managing real-time speech-to-text transcription
 *
 * Uses the Web Speech API through the speech-to-text package
 * to capture audio and convert it to text in real-time.
 */
export function useTranscriptStream() {
  const [interimText, setInterimText] = useState<string>("");
  const [finalisedText, setFinalisedText] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<any>(null);
  const onFinalizedCallbackRef = useRef<((text: string) => void) | null>(null);

  /**
   * Set a callback to be called when a phrase is finalized
   * This allows the parent component to send the text to the backend
   */
  const setOnFinalizedCallback = useCallback(
    (callback: (text: string) => void) => {
      onFinalizedCallbackRef.current = callback;
    },
    []
  );

  /**
   * Initialize the speech-to-text listener
   */
  const initializeListener = useCallback(() => {
    // Called when interim results are available (while speaking)
    const onAnythingSaid = (text: string) => {
      setInterimText(text);
    };

    // Called when the recognition session ends
    const onEndEvent = () => {
      // Restart if we're still supposed to be listening
      if (listenerRef.current && isListening) {
        try {
          listenerRef.current.startListening();
        } catch (e) {
          console.log("[STT] Could not restart:", e);
        }
      }
    };

    // Called when a phrase is finalized
    const onFinalised = (text: string) => {
      if (text.trim()) {
        setFinalisedText((prev) => [...prev, text]);
        setInterimText("");

        // Call the callback if set (to send to backend)
        if (onFinalizedCallbackRef.current) {
          onFinalizedCallbackRef.current(text);
        }
      }
    };

    try {
      const speechListener = new SpeechToText(
        onFinalised,
        onEndEvent,
        onAnythingSaid,
        "fr-FR" // French language
      );
      listenerRef.current = speechListener;
      setError(null);
      return speechListener;
    } catch (err: any) {
      const errorMessage = err.message || "Speech recognition not supported";
      setError(errorMessage);
      console.error("[STT] Initialization error:", errorMessage);
      return null;
    }
  }, [isListening]);

  /**
   * Start listening to speech
   */
  const startListening = useCallback(() => {
    setError(null);

    // Initialize if not already done
    if (!listenerRef.current) {
      const listener = initializeListener();
      if (!listener) return;
    }

    try {
      listenerRef.current.startListening();
      setIsListening(true);
      console.log("[STT] Started listening");
    } catch (err: any) {
      setError(err.message || "Failed to start listening");
      console.error("[STT] Start error:", err);
    }
  }, [initializeListener]);

  /**
   * Stop listening to speech
   */
  const stopListening = useCallback(() => {
    if (listenerRef.current) {
      try {
        listenerRef.current.stopListening();
      } catch (e) {
        console.log("[STT] Stop error:", e);
      }
    }
    setIsListening(false);
    setInterimText("");
    console.log("[STT] Stopped listening");
  }, []);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * Clear all transcript history
   */
  const clearTranscript = useCallback(() => {
    setFinalisedText([]);
    setInterimText("");
  }, []);

  /**
   * Get the full transcript as a single string
   */
  const getFullTranscript = useCallback(() => {
    return finalisedText.join(" ");
  }, [finalisedText]);

  /**
   * Add a fake chunk (for testing without microphone)
   */
  const addFakeChunk = useCallback((text: string) => {
    if (text.trim()) {
      setFinalisedText((prev) => [...prev, text]);
      if (onFinalizedCallbackRef.current) {
        onFinalizedCallbackRef.current(text);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        try {
          listenerRef.current.stopListening();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return {
    // State
    interimText, // Text currently being spoken (not finalized)
    finalisedText, // Array of finalized phrases
    transcript: getFullTranscript(), // Full transcript as string
    isListening, // Whether we're currently listening
    error, // Error message if any

    // Actions
    startListening, // Start listening
    stopListening, // Stop listening
    toggleListening, // Toggle listening state
    clearTranscript, // Clear all transcript
    addFakeChunk, // Add text manually (for testing)
    setOnFinalizedCallback, // Set callback for when phrases are finalized
  };
}
