import { Request, Response, Router } from "express";
import { z } from "zod";
import { messageRepository } from "../repositories/messageRepository";
import { projectSummaryRepository } from "../repositories/projectSummaryRepository";
import { analyzeTranscript } from "../services/analyzeTranscript";
import { getChanges, mergeSummaries } from "../services/summaryMerge";

const router = Router();

/**
 * Request body schema for POST /api/messages
 */
const PostMessageSchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().min(1),
});

/**
 * POST /api/messages
 *
 * Receives a new message from the user (transcript chunk),
 * analyzes it with AI, updates the project summary.
 *
 * Body: { conversationId: string, text: string }
 * Response: { aiMessage: string, summary: ProjectSummary }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = PostMessageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: validation.error.errors,
      });
    }

    const { conversationId, text } = validation.data;

    console.log(
      `[Messages] Received message for conversation: ${conversationId}`
    );
    console.log(
      `[Messages] Text: "${text.substring(0, 100)}${
        text.length > 100 ? "..." : ""
      }"`
    );

    // 1. Add the user message to the conversation history
    await messageRepository.addMessage(conversationId, "user", text);

    // 2. Analyze the transcript with AI (Ollama)
    const { summary: newSummary, aiMessage } = await analyzeTranscript(
      conversationId
    );

    // 3. Get the existing summary and merge with new data
    const existingSummary = await projectSummaryRepository.getProjectSummary(
      conversationId
    );
    const mergedSummary = mergeSummaries(existingSummary, newSummary);

    // Log changes for debugging
    const changes = getChanges(existingSummary, newSummary);
    if (changes.length > 0) {
      console.log(`[Messages] Changes detected:`, changes);
    }

    // 4. Save the merged summary
    await projectSummaryRepository.saveProjectSummary(
      conversationId,
      mergedSummary
    );

    // 5. Add the AI response to the conversation
    await messageRepository.addMessage(conversationId, "assistant", aiMessage);

    // 6. Return the response
    return res.json({
      aiMessage,
      summary: mergedSummary,
    });
  } catch (error) {
    console.error("[Messages] Error processing message:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/messages/:conversationId
 *
 * Returns the message history for a conversation
 */
router.get("/:conversationId", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const messages = await messageRepository.getMessages(conversationId);

    return res.json({
      conversationId,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("[Messages] Error getting messages:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * DELETE /api/messages/:conversationId
 *
 * Clears the conversation history (for debugging/testing)
 */
router.delete("/:conversationId", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    await messageRepository.clearConversation(conversationId);
    await projectSummaryRepository.deleteProjectSummary(conversationId);

    return res.json({
      success: true,
      message: `Conversation ${conversationId} cleared`,
    });
  } catch (error) {
    console.error("[Messages] Error clearing conversation:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
