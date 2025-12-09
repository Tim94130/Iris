import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Loader2, CheckCircle2 } from 'lucide-react';

interface LiveStatusIndicatorProps {
  status: 'idle' | 'listening' | 'processing' | 'updated';
}

const statusConfig = {
  idle: {
    label: 'En attente',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500',
    icon: Radio,
  },
  listening: {
    label: 'Écoute active',
    color: 'text-neon-cyan',
    bgColor: 'bg-neon-cyan',
    icon: Radio,
  },
  processing: {
    label: 'Analyse en cours',
    color: 'text-neon-violet',
    bgColor: 'bg-neon-violet',
    icon: Loader2,
  },
  updated: {
    label: 'Mis à jour',
    color: 'text-green-400',
    bgColor: 'bg-green-400',
    icon: CheckCircle2,
  },
};

/**
 * Live status indicator showing the current state of the AI processing
 */
export function LiveStatusIndicator({ status }: LiveStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      {/* Pulsing dot */}
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${config.bgColor}`} />
        <AnimatePresence>
          {(status === 'listening' || status === 'processing') && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`absolute inset-0 rounded-full ${config.bgColor}`}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <div className={`flex items-center gap-1.5 text-xs ${config.color}`}>
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </div>
    </motion.div>
  );
}

