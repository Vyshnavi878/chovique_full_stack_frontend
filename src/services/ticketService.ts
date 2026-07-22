/**
 * Support Ticket Service — create and fetch customer support tickets.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints expected:
 *   GET  /support/tickets              → SupportTicket[]
 *   POST /support/tickets              → SupportTicket
 *   GET  /support/tickets/{id}         → SupportTicket
 *   POST /support/tickets/{id}/feedback → SupportTicket
 */

import { apiGet, apiPost } from '../lib/api';
import { withDemoFallback } from '../lib/demoMode';
import { demoGetTickets, demoCreateTicket, demoSubmitFeedback } from '../lib/demoStore';
import type { SupportTicket, CreateTicketPayload, TicketFeedbackPayload } from '../types';

export const ticketService = {
  /** Fetch all support tickets for the authenticated user */
  getTickets: (): Promise<SupportTicket[]> =>
    withDemoFallback(
      () => apiGet<SupportTicket[]>('/support/tickets'),
      () => demoGetTickets()
    ),

  /** Submit a new support ticket */
  createTicket: (payload: CreateTicketPayload): Promise<SupportTicket> =>
    withDemoFallback(
      () => apiPost<SupportTicket>('/support/tickets', payload),
      () => demoCreateTicket(payload)
    ),

  /** Submit customer feedback on a resolved ticket */
  submitFeedback: (ticketId: string, payload: TicketFeedbackPayload): Promise<SupportTicket> =>
    withDemoFallback(
      () => apiPost<SupportTicket>(`/support/tickets/${ticketId}/feedback`, payload),
      () => demoSubmitFeedback(ticketId, payload)
    ),
};
