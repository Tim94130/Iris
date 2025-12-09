import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Message } from "../../types/ProjectSummary";
import { MessageList } from "./MessageList";
import { TextInput } from "./TextInput";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  isListening?: boolean;
  interimText?: string;
  sttError?: string | null;
  onSendMessage: (text: string) => void;
  onToggleListening?: () => void;
}

/**
 * Complete chat panel with message list and input
 */
export function ChatPanel({
  messages,
  isLoading,
  isListening,
  interimText,
  sttError,
  onSendMessage,
  onToggleListening,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-glass-border">
        <h2 className="text-lg font-semibold text-white">Conversation</h2>
        <p className="text-xs text-gray-500">
          Décrivez votre projet à l'oral ou par écrit
        </p>
      </div>

      {/* STT Error Banner */}
      <AnimatePresence>
        {sttError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border-b border-red-500/30 px-6 py-3"
          >
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{sttError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim Text (what's being said right now) */}
      <AnimatePresence>
        {isListening && interimText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 py-3 bg-neon-cyan/5 border-b border-neon-cyan/20"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-neon-cyan text-sm italic">
                "{interimText}"
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <TextInput
        onSend={onSendMessage}
        isLoading={isLoading}
        isListening={isListening}
        onToggleListening={onToggleListening}
      />
    </div>
  );
}
