/**
 * Represents a message in a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Creates a new message with auto-generated ID and timestamp
 */
export function createMessage(
  conversationId: string,
  role: Message['role'],
  content: string
): Message {
  return {
    id: generateMessageId(),
    conversationId,
    role,
    content,
    timestamp: new Date(),
  };
}

/**
 * Generates a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

