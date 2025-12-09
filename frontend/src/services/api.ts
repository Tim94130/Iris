import { ProjectSummary, SendMessageResponse, GetSummaryResponse } from '../types/ProjectSummary';

const API_BASE = '/api';

/**
 * API client for communicating with the backend
 */
export const api = {
  /**
   * Send a message to the backend for AI analysis
   * 
   * @param conversationId - Unique ID for this conversation
   * @param text - The transcript text to analyze
   * @returns The AI response and updated project summary
   */
  async sendMessage(conversationId: string, text: string): Promise<SendMessageResponse> {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, text }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get the current project summary for a conversation
   * 
   * @param conversationId - The conversation ID
   * @returns The project summary
   */
  async getProjectSummary(conversationId: string): Promise<GetSummaryResponse> {
    const response = await fetch(`${API_BASE}/projects/${conversationId}/summary`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  },

  /**
   * Clear a conversation and its summary
   * 
   * @param conversationId - The conversation ID
   */
  async clearConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/messages/${conversationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }
  },

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; hasOpenAIKey: boolean }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },
};

