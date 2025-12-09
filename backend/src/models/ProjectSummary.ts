import { z } from 'zod';

/**
 * Schema for project summary validation
 * Used to validate LLM responses and API inputs
 */
export const ProjectSummarySchema = z.object({
  title: z.string().nullable(),
  start_date: z.string().nullable(), // Format: YYYY-MM-DD
  end_date: z.string().nullable(),   // Format: YYYY-MM-DD
  budget: z.number().nullable(),
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

/**
 * Creates an empty project summary with all fields set to null
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
 * Validates if a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

