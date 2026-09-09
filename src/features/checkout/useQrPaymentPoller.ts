import { useEffect, useRef } from 'react';
import { apiGet } from '../../lib/api';

interface QrStatusResponse {
  status: 'created' | 'captured' | 'failed' | 'unknown';
  razorpay_order_id: string | null;
  error_message?: string;
}

interface UseQrPaymentPollerProps {
  qrCodeId: string | null;
  closeBy: number | null; // Unix timestamp
  onSuccess: (orderId: string) => void;
  onExpired: () => void;
  onError: (message: string) => void;
}

export function useQrPaymentPoller({
  qrCodeId,
  closeBy,
  onSuccess,
  onExpired,
  onError,
}: UseQrPaymentPollerProps) {
  const isPollingRef = useRef(false);
  const successCalledRef = useRef(false);

  useEffect(() => {
    // Reset flags if qrCodeId changes
    isPollingRef.current = false;
    successCalledRef.current = false;
  }, [qrCodeId]);

  useEffect(() => {
    if (!qrCodeId || !closeBy) return;
    if (successCalledRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const pollStatus = async () => {
      // 1. Check local expiry first
      const now = Math.floor(Date.now() / 1000);
      if (now >= closeBy) {
        onExpired();
        return; // Stop polling
      }

      if (isPollingRef.current) return; // Prevent concurrent polls
      isPollingRef.current = true;

      try {
        const response = await apiGet<QrStatusResponse>(`/payments/qr-status/${qrCodeId}`);

        if (response.status === 'captured' && response.razorpay_order_id) {
          successCalledRef.current = true;
          onSuccess(response.razorpay_order_id);
          return; // Stop polling
        } else if (response.status === 'failed') {
          onError(response.error_message || 'Payment failed. Please try again.');
          return; // Stop polling
        }
        // If status is 'created' or 'unknown', continue polling
      } catch (err) {
        console.error('QR Polling Error:', err);
        // Do not stop polling on transient network errors unless expired
      } finally {
        isPollingRef.current = false;
      }

      // Schedule next poll in 3 seconds
      if (!successCalledRef.current) {
        timeoutId = setTimeout(pollStatus, 3000);
      }
    };

    // Initial poll schedule
    timeoutId = setTimeout(pollStatus, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [qrCodeId, closeBy, onSuccess, onExpired, onError]);
}
