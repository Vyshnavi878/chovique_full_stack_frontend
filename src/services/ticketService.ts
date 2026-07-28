/**
 * Support Ticket Service — create and fetch customer support tickets.
 * All calls go directly to the FastAPI backend. No demo fallbacks.
 *
 * FastAPI endpoints:
 *   GET  /support/tickets                  → SupportTicket[]
 *   POST /support/tickets                  → SupportTicket
 *   GET  /support/tickets/{id}             → SupportTicket
 *   POST /support/tickets/{id}/feedback    → SupportTicket
 */

import { apiGet, apiPost } from '../lib/api';
import type { SupportTicket, CreateTicketPayload, TicketFeedbackPayload } from '../types';

export const ticketService = {
  /** Fetch all support tickets for the authenticated user */
  getTickets: (): Promise<SupportTicket[]> =>
    apiGet<SupportTicket[]>('/support/tickets'),

  /** Submit a new support ticket */
  createTicket: (payload: CreateTicketPayload): Promise<SupportTicket> =>
    apiPost<SupportTicket>('/support/tickets', payload),

  /** Submit customer feedback on a resolved ticket */
  submitFeedback: (ticketId: string, payload: TicketFeedbackPayload): Promise<SupportTicket> =>
    apiPost<SupportTicket>(`/support/tickets/${ticketId}/feedback`, payload),
};
