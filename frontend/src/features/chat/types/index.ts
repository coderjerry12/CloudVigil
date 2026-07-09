/**
 * AI Chatbot types for CloudVigil — Phase 8
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistoryEntry {
  chatId: string;
  userId: string;
  role: string;
  question: string;
  response: string;
  createdAt: string;
}

export interface ChatResponse {
  response: string;
}

export interface ChatHistoryResponse {
  history: ChatHistoryEntry[];
  total: number;
}
