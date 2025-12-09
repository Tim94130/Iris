/**
 * Project summary extracted by AI from conversation
 */
export interface ProjectSummary {
  title: string | null;
  start_date: string | null;  // Format: YYYY-MM-DD
  end_date: string | null;    // Format: YYYY-MM-DD
  budget: number | null;
}

/**
 * Creates an empty project summary
 */
export function createEmptyProjectSummary(): ProjectSummary {
  return {
    title: null,
    start_date: null,
    end_date: null,
    budget: null,
  };
}

/**
 * Checks if a summary has any data
 */
export function hasSummaryData(summary: ProjectSummary): boolean {
  return (
    summary.title !== null ||
    summary.start_date !== null ||
    summary.end_date !== null ||
    summary.budget !== null
  );
}

/**
 * Message in a conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * API response from POST /api/messages
 */
export interface SendMessageResponse {
  aiMessage: string;
  summary: ProjectSummary;
}

/**
 * API response from GET /api/projects/:id/summary
 */
export interface GetSummaryResponse {
  conversationId: string;
  summary: ProjectSummary;
  exists: boolean;
}

