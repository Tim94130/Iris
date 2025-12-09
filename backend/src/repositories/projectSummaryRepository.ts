import { ProjectSummary, createEmptyProjectSummary } from '../models/ProjectSummary';

/**
 * In-memory store for project summaries
 * 
 * TODO: Remplacer par une vraie implémentation MongoDB par l'associé BDD
 * 
 * Cette implémentation utilise une Map JavaScript pour stocker les données
 * en mémoire. Les données seront perdues au redémarrage du serveur.
 */
const summaryStore = new Map<string, ProjectSummary>();

/**
 * Repository interface for project summaries
 * Defines the contract for data access layer
 */
export interface IProjectSummaryRepository {
  saveProjectSummary(conversationId: string, summary: ProjectSummary): Promise<void>;
  getProjectSummary(conversationId: string): Promise<ProjectSummary | null>;
  deleteProjectSummary(conversationId: string): Promise<boolean>;
}

/**
 * In-memory implementation of the project summary repository
 * 
 * TODO: Remplacer par une vraie implémentation MongoDB par l'associé BDD
 * 
 * Exemple de future implémentation MongoDB:
 * ```
 * import { MongoClient, Db } from 'mongodb';
 * 
 * export class MongoProjectSummaryRepository implements IProjectSummaryRepository {
 *   private db: Db;
 *   
 *   constructor(client: MongoClient) {
 *     this.db = client.db('iris');
 *   }
 *   
 *   async saveProjectSummary(conversationId: string, summary: ProjectSummary): Promise<void> {
 *     await this.db.collection('project_summaries').updateOne(
 *       { conversationId },
 *       { $set: { ...summary, updatedAt: new Date() } },
 *       { upsert: true }
 *     );
 *   }
 *   
 *   async getProjectSummary(conversationId: string): Promise<ProjectSummary | null> {
 *     return await this.db.collection('project_summaries').findOne({ conversationId });
 *   }
 * }
 * ```
 */
export class InMemoryProjectSummaryRepository implements IProjectSummaryRepository {
  async saveProjectSummary(conversationId: string, summary: ProjectSummary): Promise<void> {
    summaryStore.set(conversationId, { ...summary });
    console.log(`[Repository] Saved summary for conversation: ${conversationId}`);
  }

  async getProjectSummary(conversationId: string): Promise<ProjectSummary | null> {
    const summary = summaryStore.get(conversationId);
    return summary ? { ...summary } : null;
  }

  async deleteProjectSummary(conversationId: string): Promise<boolean> {
    return summaryStore.delete(conversationId);
  }

  /**
   * Debug method to get all stored summaries
   */
  getAllSummaries(): Map<string, ProjectSummary> {
    return new Map(summaryStore);
  }

  /**
   * Debug method to clear all stored data
   */
  clearAll(): void {
    summaryStore.clear();
    console.log('[Repository] Cleared all summaries');
  }
}

// Export singleton instance
export const projectSummaryRepository = new InMemoryProjectSummaryRepository();

