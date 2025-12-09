import { ProjectSummary } from '../models/ProjectSummary';

/**
 * Merges two project summaries together
 * 
 * Rules:
 * - A non-null value in newSummary replaces the old value
 * - If newSummary has null, the old value is preserved
 * - This allows incremental updates as more information is gathered
 * 
 * @param existingSummary - The current saved summary (or null if none exists)
 * @param newSummary - The new summary extracted from the latest transcript
 * @returns The merged summary
 */
export function mergeSummaries(
  existingSummary: ProjectSummary | null,
  newSummary: ProjectSummary
): ProjectSummary {
  // If no existing summary, return the new one
  if (!existingSummary) {
    return { ...newSummary };
  }

  return {
    title: newSummary.title ?? existingSummary.title,
    start_date: newSummary.start_date ?? existingSummary.start_date,
    end_date: newSummary.end_date ?? existingSummary.end_date,
    budget: newSummary.budget ?? existingSummary.budget,
  };
}

/**
 * Checks if a summary has any filled fields
 */
export function hasSummaryContent(summary: ProjectSummary): boolean {
  return (
    summary.title !== null ||
    summary.start_date !== null ||
    summary.end_date !== null ||
    summary.budget !== null
  );
}

/**
 * Counts the number of filled fields in a summary
 */
export function countFilledFields(summary: ProjectSummary): number {
  let count = 0;
  if (summary.title !== null) count++;
  if (summary.start_date !== null) count++;
  if (summary.end_date !== null) count++;
  if (summary.budget !== null) count++;
  return count;
}

/**
 * Gets a human-readable description of what changed between two summaries
 */
export function getChanges(
  oldSummary: ProjectSummary | null,
  newSummary: ProjectSummary
): string[] {
  const changes: string[] = [];

  if (!oldSummary) {
    if (newSummary.title) changes.push(`Titre défini: "${newSummary.title}"`);
    if (newSummary.start_date) changes.push(`Date de début: ${newSummary.start_date}`);
    if (newSummary.end_date) changes.push(`Date de fin: ${newSummary.end_date}`);
    if (newSummary.budget) changes.push(`Budget: ${newSummary.budget}€`);
    return changes;
  }

  if (newSummary.title && newSummary.title !== oldSummary.title) {
    changes.push(`Titre ${oldSummary.title ? 'mis à jour' : 'défini'}: "${newSummary.title}"`);
  }
  if (newSummary.start_date && newSummary.start_date !== oldSummary.start_date) {
    changes.push(`Date de début ${oldSummary.start_date ? 'mise à jour' : 'définie'}: ${newSummary.start_date}`);
  }
  if (newSummary.end_date && newSummary.end_date !== oldSummary.end_date) {
    changes.push(`Date de fin ${oldSummary.end_date ? 'mise à jour' : 'définie'}: ${newSummary.end_date}`);
  }
  if (newSummary.budget && newSummary.budget !== oldSummary.budget) {
    changes.push(`Budget ${oldSummary.budget ? 'mis à jour' : 'défini'}: ${newSummary.budget}€`);
  }

  return changes;
}

