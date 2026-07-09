import { useState, useCallback } from 'react';
import { chatService } from '../services/chatService';
import type { ChatMessage } from '../types';

/**
 * Hook for managing chat state and interactions.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const data = await chatService.sendMessage(content.trim());
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setError(message);
      // Add error message as assistant response
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await chatService.getChatHistory();
      const historyMessages: ChatMessage[] = [];
      for (const entry of data.history) {
        historyMessages.push({
          id: `hist-${entry.chatId}-q`,
          role: 'user',
          content: entry.question,
          timestamp: entry.createdAt,
        });
        historyMessages.push({
          id: `hist-${entry.chatId}-a`,
          role: 'assistant',
          content: entry.response,
          timestamp: entry.createdAt,
        });
      }
      setMessages(historyMessages);
    } catch {
      // Silent fail for history
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, loadHistory, clearMessages };
}
