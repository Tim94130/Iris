import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  isHighlighted?: boolean;
  isEmpty?: boolean;
}

/**
 * Animated card component for summary fields
 */
export function SummaryCard({
  title,
  icon,
  children,
  isHighlighted = false,
  isEmpty = false,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative"
    >
      {/* Highlight glow effect */}
      <AnimatePresence>
        {isHighlighted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/30 to-neon-violet/30 rounded-2xl blur-lg"
          />
        )}
      </AnimatePresence>

      {/* Card content */}
      <motion.div
        animate={isHighlighted ? {
          borderColor: ['rgba(0, 245, 255, 0.3)', 'rgba(168, 85, 247, 0.3)', 'rgba(0, 245, 255, 0.3)'],
        } : {}}
        transition={isHighlighted ? { duration: 2, repeat: 1 } : {}}
        className={`
          relative p-4 rounded-xl
          bg-iris-800/50 backdrop-blur-sm
          border transition-colors duration-300
          ${isHighlighted ? 'border-neon-cyan/50' : 'border-glass-border'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`${isEmpty ? 'text-gray-600' : 'text-neon-cyan'}`}>
            {icon}
          </span>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-8 skeleton rounded-lg"
            />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

