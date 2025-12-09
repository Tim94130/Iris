import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { Message, ProjectSummary, createEmptyProjectSummary } from '../types/ProjectSummary';

/**
 * Generate a unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for managing a conversation and its project summary
 */
export function useConversation() {
  const [conversationId] = useState<string>(() => generateConversationId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<ProjectSummary>(createEmptyProjectSummary());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedField, setLastUpdatedField] = useState<string | null>(null);

  /**
   * Send a message and get AI analysis
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to backend
      const response = await api.sendMessage(conversationId, text);

      // Add AI response message
      const aiMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.aiMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Track which fields changed
      const oldSummary = summary;
      const newSummary = response.summary;
      
      // Find which field was updated
      if (newSummary.title !== oldSummary.title) setLastUpdatedField('title');
      else if (newSummary.start_date !== oldSummary.start_date) setLastUpdatedField('start_date');
      else if (newSummary.end_date !== oldSummary.end_date) setLastUpdatedField('end_date');
      else if (newSummary.budget !== oldSummary.budget) setLastUpdatedField('budget');
      
      // Clear the highlight after 2 seconds
      setTimeout(() => setLastUpdatedField(null), 2000);

      // Update summary
      setSummary(newSummary);
    } catch (err) {
      console.error('[Conversation] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      
      // Add error message
      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'system',
        content: "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, summary]);

  /**
   * Clear the conversation
   */
  const clearConversation = useCallback(async () => {
    try {
      await api.clearConversation(conversationId);
      setMessages([]);
      setSummary(createEmptyProjectSummary());
      setError(null);
    } catch (err) {
      console.error('[Conversation] Error clearing:', err);
    }
  }, [conversationId]);

  /**
   * Refresh summary from server
   */
  const refreshSummary = useCallback(async () => {
    try {
      const response = await api.getProjectSummary(conversationId);
      setSummary(response.summary);
    } catch (err) {
      console.error('[Conversation] Error refreshing summary:', err);
    }
  }, [conversationId]);

  return {
    conversationId,
    messages,
    summary,
    isLoading,
    error,
    lastUpdatedField,
    sendMessage,
    clearConversation,
    refreshSummary,
  };
}

