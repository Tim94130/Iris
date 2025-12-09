import { Router, Request, Response } from 'express';
import { projectSummaryRepository } from '../repositories/projectSummaryRepository';
import { createEmptyProjectSummary } from '../models/ProjectSummary';

const router = Router();

/**
 * GET /api/projects/:conversationId/summary
 * 
 * Returns the current project summary for a conversation
 */
router.get('/:conversationId/summary', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    const summary = await projectSummaryRepository.getProjectSummary(conversationId);
    
    if (!summary) {
      // Return empty summary if none exists yet
      return res.json({
        conversationId,
        summary: createEmptyProjectSummary(),
        exists: false,
      });
    }
    
    return res.json({
      conversationId,
      summary,
      exists: true,
    });
  } catch (error) {
    console.error('[Projects] Error getting summary:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/projects/:conversationId/summary
 * 
 * Deletes the project summary for a conversation
 */
router.delete('/:conversationId/summary', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    const deleted = await projectSummaryRepository.deleteProjectSummary(conversationId);
    
    return res.json({
      success: true,
      deleted,
    });
  } catch (error) {
    console.error('[Projects] Error deleting summary:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;

