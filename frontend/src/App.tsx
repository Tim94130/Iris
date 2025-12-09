import { useCallback, useEffect } from "react";
import { ChatPanel } from "./components/chat/ChatPanel";
import { AppLayout } from "./components/layout/AppLayout";
import { SummaryPanel } from "./components/summary/SummaryPanel";
import { useConversation } from "./hooks/useConversation";
import { useTranscriptStream } from "./hooks/useTranscriptStream";

/**
 * Main Application Component
 *
 * Architecture:
 * - Left panel: Chat/Conversation interface
 * - Right panel: AI-extracted project summary
 *
 * Real-time flow:
 * 1. User speaks → STT captures audio
 * 2. When phrase is finalized → sent to backend
 * 3. Backend calls Ollama → extracts info
 * 4. Summary panel updates in real-time
 */
function App() {
  const {
    messages,
    summary,
    isLoading,
    lastUpdatedField,
    sendMessage,
    clearConversation,
  } = useConversation();

  const {
    interimText,
    isListening,
    error: sttError,
    stopListening,
    toggleListening,
    clearTranscript,
    setOnFinalizedCallback,
  } = useTranscriptStream();

  /**
   * When a phrase is finalized by STT, automatically send it to the backend
   */
  const handleFinalizedSpeech = useCallback(
    (text: string) => {
      console.log("[App] Finalized speech:", text);
      sendMessage(text);
    },
    [sendMessage]
  );

  // Set up the callback when the component mounts
  useEffect(() => {
    setOnFinalizedCallback(handleFinalizedSpeech);
  }, [setOnFinalizedCallback, handleFinalizedSpeech]);

  /**
   * Handle manual text input (from keyboard)
   */
  const handleSendMessage = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  /**
   * Toggle listening state
   */
  const handleToggleListening = useCallback(() => {
    toggleListening();
  }, [toggleListening]);

  /**
   * Clear conversation and transcript
   */
  const handleClear = useCallback(async () => {
    await clearConversation();
    clearTranscript();
    if (isListening) {
      stopListening();
    }
  }, [clearConversation, clearTranscript, isListening, stopListening]);

  return (
    <AppLayout
      leftPanel={
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          isListening={isListening}
          interimText={interimText}
          sttError={sttError}
          onSendMessage={handleSendMessage}
          onToggleListening={handleToggleListening}
        />
      }
      rightPanel={
        <SummaryPanel
          summary={summary}
          isLoading={isLoading}
          isListening={isListening}
          lastUpdatedField={lastUpdatedField}
          onClear={handleClear}
        />
      }
    />
  );
}

export default App;
