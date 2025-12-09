import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

/**
 * Main application layout with two columns
 * Left panel (60%): Chat/Conversation
 * Right panel (40%): Project Summary
 */
export function AppLayout({ leftPanel, rightPanel }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-4 border-b border-glass-border bg-iris-900/80 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet opacity-50 blur-md -z-10" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                <span className="text-white">IRIS</span>
              </h1>
              <p className="text-xs text-gray-400">AI Project Summary</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span>Système actif</span>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left panel - Chat */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-[60%] border-r border-glass-border flex flex-col"
        >
          {leftPanel}
        </motion.div>

        {/* Right panel - Summary */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-[40%] flex flex-col bg-iris-800/30"
        >
          {rightPanel}
        </motion.div>
      </main>
    </div>
  );
}

