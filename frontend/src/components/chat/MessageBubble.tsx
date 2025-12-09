import { motion } from 'framer-motion';
import { User, Bot, AlertCircle } from 'lucide-react';
import { Message } from '../../types/ProjectSummary';

interface MessageBubbleProps {
  message: Message;
  index: number;
}

/**
 * Individual message bubble component
 * Styled differently based on the message role (user/assistant/system)
 */
export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
          ${isUser
            ? 'bg-gradient-to-br from-neon-violet to-neon-pink'
            : isSystem
              ? 'bg-gradient-to-br from-orange-500 to-red-500'
              : 'bg-gradient-to-br from-neon-cyan to-neon-blue'
          }
        `}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : isSystem ? (
          <AlertCircle className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message content */}
      <div
        className={`
          max-w-[80%] px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-gradient-to-br from-neon-violet/20 to-neon-pink/10 border border-neon-violet/30 rounded-tr-md'
            : isSystem
              ? 'bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30'
              : 'bg-iris-700/50 border border-glass-border rounded-tl-md'
          }
        `}
      >
        <p className="text-sm leading-relaxed text-gray-100">{message.content}</p>
        <span className="text-[10px] text-gray-500 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
}

