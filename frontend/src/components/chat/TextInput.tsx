import { useState, FormEvent, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface TextInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  isListening?: boolean;
  onToggleListening?: () => void;
}

/**
 * Text input component for sending messages
 * Includes a send button and optional mic toggle
 */
export function TextInput({
  onSend,
  isLoading,
  isListening = false,
  onToggleListening,
}: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-glass-border">
      <div className="flex items-end gap-3">
        {/* Mic toggle button (for future STT integration) */}
        {onToggleListening && (
          <motion.button
            type="button"
            onClick={onToggleListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-3 rounded-xl transition-all duration-300
              ${isListening
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-glow-cyan'
                : 'bg-iris-700 text-gray-400 border border-glass-border hover:text-white'
              }
            `}
            title={isListening ? 'Arrêter l\'écoute' : 'Commencer l\'écoute'}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </motion.button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre projet... (Entrée pour envoyer)"
            disabled={isLoading}
            rows={1}
            className="
              w-full px-4 py-3 pr-12
              bg-iris-700/50 border border-glass-border rounded-xl
              text-white placeholder-gray-500
              resize-none
              focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30
              transition-all duration-300
              disabled:opacity-50
            "
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          {/* Send button */}
          <motion.button
            type="submit"
            disabled={!text.trim() || isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="
              absolute right-2 bottom-2
              p-2 rounded-lg
              bg-gradient-to-r from-neon-cyan to-neon-blue
              text-white
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-opacity duration-300
            "
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs text-neon-cyan"
        >
          <div className="flex gap-1">
            <span className="w-1 h-3 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-3 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-3 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Écoute en cours... Parlez maintenant</span>
        </motion.div>
      )}
    </form>
  );
}

