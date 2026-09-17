/**
 * Chat Service — Chovique AI Assistant (Coco)
 *
 * Calls POST /api/v1/chat via the existing apiPost utility.
 * - The Gemini API key is NEVER exposed here; it stays on the server.
 * - CSRF and auth headers are handled automatically by apiPost.
 * - Conversation history is sent client-side so Gemini understands follow-ups.
 */

import { apiPost } from '../lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  customer_name?: string;
  role?: string;
}

export interface ChatAction {
  label: string;
  url: string;
  icon?: string;
}

export interface ChatResponse {
  reply: string;
  actions?: ChatAction[];
}

export const chatService = {
  /**
   * Send a message to the Chovique AI assistant.
   *
   * @param message       - The user's latest message text
   * @param history       - Previous conversation turns (oldest first)
   * @param customerName  - Optional authenticated user's name for personalized greeting
   * @param role          - Optional user role: 'customer' | 'admin' | 'superadmin' | 'guest'
   * @returns             - The assistant's reply
   */
  sendMessage: async (
    message: string,
    history: ChatMessage[] = [],
    customerName?: string,
    role?: string
  ): Promise<ChatResponse> => {
    return apiPost<ChatResponse>('/chat', {
      message: message.trim(),
      history,
      customer_name: customerName,
      role,
    });
  },
};
