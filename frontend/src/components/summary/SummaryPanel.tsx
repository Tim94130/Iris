import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  CalendarCheck,
  Wallet,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { ProjectSummary, hasSummaryData } from '../../types/ProjectSummary';
import { SummaryCard } from './SummaryCard';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface SummaryPanelProps {
  summary: ProjectSummary;
  isLoading: boolean;
  isListening?: boolean;
  lastUpdatedField: string | null;
  onClear?: () => void;
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a budget number for display
 */
function formatBudget(budget: number | null): string {
  if (budget === null) return '';
  return budget.toLocaleString('fr-FR') + ' €';
}

/**
 * Panel displaying the project summary extracted by AI
 */
export function SummaryPanel({
  summary,
  isLoading,
  isListening,
  lastUpdatedField,
  onClear,
}: SummaryPanelProps) {
  const hasData = hasSummaryData(summary);
  
  // Determine current status
  const status = isLoading
    ? 'processing'
    : isListening
      ? 'listening'
      : lastUpdatedField
        ? 'updated'
        : 'idle';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Résumé du projet</h2>
              <p className="text-xs text-gray-500">Extrait automatiquement par l'IA</p>
            </div>
          </div>
          
          <LiveStatusIndicator status={status} />
        </div>
      </div>

      {/* Summary content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Project Title */}
        <SummaryCard
          title="Nom du projet"
          icon={<FileText className="w-4 h-4" />}
          isHighlighted={lastUpdatedField === 'title'}
          isEmpty={summary.title === null}
        >
          <h3 className="text-xl font-bold text-white text-glow-cyan">
            {summary.title}
          </h3>
        </SummaryCard>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <SummaryCard
            title="Date de début"
            icon={<Calendar className="w-4 h-4" />}
            isHighlighted={lastUpdatedField === 'start_date'}
            isEmpty={summary.start_date === null}
          >
            <p className="text-lg font-semibold text-white">
              {formatDate(summary.start_date)}
            </p>
          </SummaryCard>

          {/* End Date */}
          <SummaryCard
            title="Date de fin"
            icon={<CalendarCheck className="w-4 h-4" />}
            isHighlighted={lastUpdatedField === 'end_date'}
            isEmpty={summary.end_date === null}
          >
            <p className="text-lg font-semibold text-white">
              {formatDate(summary.end_date)}
            </p>
          </SummaryCard>
        </div>

        {/* Budget */}
        <SummaryCard
          title="Budget"
          icon={<Wallet className="w-4 h-4" />}
          isHighlighted={lastUpdatedField === 'budget'}
          isEmpty={summary.budget === null}
        >
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-violet">
            {formatBudget(summary.budget)}
          </p>
        </SummaryCard>

        {/* Progress indicator */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-iris-800/30 border border-glass-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Complétude du résumé</span>
              <span className="text-xs text-neon-cyan">
                {[summary.title, summary.start_date, summary.end_date, summary.budget].filter(Boolean).length}/4
              </span>
            </div>
            <div className="h-1.5 bg-iris-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${([summary.title, summary.start_date, summary.end_date, summary.budget].filter(Boolean).length / 4) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!hasData && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-iris-700/50 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-neon-cyan/30" />
            </div>
            <p className="text-sm text-gray-500">
              En attente d'informations...
              <br />
              <span className="text-gray-600">
                Les données apparaîtront ici au fur et à mesure.
              </span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer with clear button */}
      {hasData && onClear && (
        <div className="px-6 py-4 border-t border-glass-border">
          <motion.button
            onClick={onClear}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              w-full py-2.5 px-4
              flex items-center justify-center gap-2
              rounded-lg
              bg-iris-700/50 border border-glass-border
              text-gray-400 hover:text-white
              text-sm font-medium
              transition-colors duration-300
            "
          >
            <RotateCcw className="w-4 h-4" />
            Nouvelle conversation
          </motion.button>
        </div>
      )}
    </div>
  );
}

