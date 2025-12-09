import { Message, createMessage } from '../models/Message';

/**
 * In-memory store for conversation messages
 * 
 * TODO: Remplacer par une vraie implémentation MongoDB par l'associé BDD
 */
const messageStore = new Map<string, Message[]>();

/**
 * Repository interface for messages
 */
export interface IMessageRepository {
  addMessage(conversationId: string, role: Message['role'], content: string): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  getConversationHistory(conversationId: string, limit?: number): Promise<string>;
  clearConversation(conversationId: string): Promise<void>;
}

/**
 * In-memory implementation of the message repository
 * 
 * TODO: Remplacer par une vraie implémentation MongoDB par l'associé BDD
 */
export class InMemoryMessageRepository implements IMessageRepository {
  async addMessage(
    conversationId: string,
    role: Message['role'],
    content: string
  ): Promise<Message> {
    const message = createMessage(conversationId, role, content);
    
    if (!messageStore.has(conversationId)) {
      messageStore.set(conversationId, []);
    }
    
    messageStore.get(conversationId)!.push(message);
    console.log(`[MessageRepo] Added ${role} message to conversation: ${conversationId}`);
    
    return message;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return messageStore.get(conversationId) || [];
  }

  async getConversationHistory(conversationId: string, limit?: number): Promise<string> {
    const messages = await this.getMessages(conversationId);
    const relevantMessages = limit ? messages.slice(-limit) : messages;
    
    return relevantMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
  }

  async clearConversation(conversationId: string): Promise<void> {
    messageStore.delete(conversationId);
    console.log(`[MessageRepo] Cleared conversation: ${conversationId}`);
  }

  /**
   * Debug method to get all conversations
   */
  getAllConversations(): string[] {
    return Array.from(messageStore.keys());
  }
}

// Export singleton instance
export const messageRepository = new InMemoryMessageRepository();

