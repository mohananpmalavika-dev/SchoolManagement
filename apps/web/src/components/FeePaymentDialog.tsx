'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { money, messageFor } from '@/lib/workspace';
import { Button } from './ui';

type PaymentOptions = { razorpay: boolean; upi: boolean; merchantName: string };
type Order = {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId?: string;
  upiIntentUri?: string;
};
type Receipt = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type Checkout = { open(): void; close(): void; on(event: string, handler: () => void): void };
type Razorpay = new (options: Record<string, unknown>) => Checkout;
const provider = () => (window as Window & { Razorpay?: Razorpay }).Razorpay;
let checkoutScript: Promise<void> | undefined;
function loadCheckout() {
  if (provider()) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timeout = window.setTimeout(() => {
      script.remove();
      checkoutScript = undefined;
      reject(new Error('Payment checkout timed out. Please retry.'));
    }, 15000);
    script.onload = () => {
      clearTimeout(timeout);
      if (provider()) resolve();
      else {
        checkoutScript = undefined;
        reject(new Error('Payment checkout could not load.'));
      }
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      checkoutScript = undefined;
      reject(new Error('Payment checkout could not load. Check your connection and retry.'));
    };
    document.head.appendChild(script);
  });
  return checkoutScript;
}

export function FeePaymentDialog({
  invoice,
  onClose,
  onConfirmed,
}: {
  invoice: { id: string; invoiceNumber: string; balanceAmount: number };
  onClose(): void;
  onConfirmed(message: string): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const checkout = useRef<Checkout | null>(null);
  const alive = useRef(true);
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [gateway, setGateway] = useState('RAZORPAY');
  const [amount, setAmount] = useState(String(invoice.balanceAmount / 100));
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [qr, setQr] = useState('');
  const [status, setStatus] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    alive.current = true;
    dialog.current?.showModal();
    return () => {
      alive.current = false;
      checkout.current?.close();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setOptions(null);
    apiClient
      .get<PaymentOptions>('/payments-gateway/options', { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setOptions(data);
        setGateway(data.razorpay ? 'RAZORPAY' : 'UPI');
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [retry]);

  async function verify(receipt: Receipt) {
    setBusy(true);
    setError('');
    try {
      const { data } = await apiClient.post('/payments-gateway/verify', {
        razorpayOrderId: receipt.razorpay_order_id,
        razorpayPaymentId: receipt.razorpay_payment_id,
        razorpaySignature: receipt.razorpay_signature,
      });
      if (!alive.current) return;
      if (data.status === 'UNMATCHED')
        setStatus(
          'Payment received by the provider. Your school must reconcile it before the invoice balance changes. Keep your payment reference.'
        );
      else if (data.status === 'COMPLETED')
        onConfirmed('Payment confirmed. Your receipt and updated balance are available.');
      else await checkStatus(receipt.razorpay_order_id);
    } catch (err) {
      if (alive.current) {
        setError(messageFor(err));
        setStatus('Confirmation is pending. Check payment status before starting another payment.');
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function checkStatus(orderId = order?.gatewayOrderId) {
    if (!orderId) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await apiClient.post('/payments-gateway/status', {
        gatewayOrderId: orderId,
      });
      if (!alive.current) return;
      if (data.status === 'COMPLETED' && data.isReconciled)
        onConfirmed('Payment confirmed. Your receipt and updated balance are available.');
      else if (data.status === 'FAILED')
        setStatus(
          'The provider reported a failed payment. Contact the school if money was debited.'
        );
      else if (data.status === 'COMPLETED')
        setStatus('Payment received by the provider and awaiting school reconciliation.');
      else
        setStatus(
          'Payment is pending confirmation. Direct UPI transfers appear after the school checks its bank statement.'
        );
    } catch (err) {
      if (alive.current) setError(messageFor(err));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function pay(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const paise = Math.round(Number(amount) * 100);
      if (!Number.isSafeInteger(paise) || paise < 100 || paise > invoice.balanceAmount)
        throw new Error('Enter an amount between ₹1 and the invoice balance.');
      let normalized = phone.replace(/[\s+()-]/g, '');
      if (normalized.startsWith('0')) normalized = '91' + normalized.slice(1);
      else if (/^[6-9]\d{9}$/.test(normalized)) normalized = '91' + normalized;
      if (!/^91[6-9]\d{9}$/.test(normalized))
        throw new Error('Enter a valid 10-digit Indian mobile number.');
      if (gateway === 'RAZORPAY') await loadCheckout();
      const { data: created } = await apiClient.post<Order>('/workspace/pay', {
        invoiceId: invoice.id,
        amount: paise,
        phoneNumber: normalized,
        gateway,
      });
      if (!alive.current) return;
      setOrder(created);
      if (gateway === 'UPI') {
        if (!created.upiIntentUri?.startsWith('upi://pay?'))
          throw new Error('School UPI details are unavailable. Contact the office.');
        const QRCode = await import('qrcode');
        const image = await QRCode.toDataURL(created.upiIntentUri, { width: 256, margin: 2 });
        if (alive.current) {
          setQr(image);
          setStatus(
            'Scan this code with a UPI app, or open your UPI app on this phone. Your balance changes after the school confirms receipt.'
          );
        }
      } else {
        const Constructor = provider();
        if (!Constructor || !created.razorpayKeyId)
          throw new Error('Payment checkout is unavailable. Contact the school.');
        // A native modal dialog would make the provider's checkout iframe inert.
        dialog.current?.close();
        const instance = new Constructor({
          key: created.razorpayKeyId,
          amount: created.amount,
          currency: created.currency,
          order_id: created.gatewayOrderId,
          name: options?.merchantName || 'School fees',
          description: invoice.invoiceNumber,
          prefill: { contact: normalized },
          handler: (receipt: Receipt) => {
            if (alive.current) {
              dialog.current?.showModal();
              void verify(receipt);
            }
          },
          modal: {
            ondismiss: () => {
              if (alive.current) {
                dialog.current?.showModal();
                setBusy(false);
                setStatus('Checkout closed. Check payment status if an amount was debited.');
              }
            },
          },
        });
        instance.on('payment.failed', () => {
          if (alive.current)
            setStatus('The provider reported a failed payment. You can retry inside checkout.');
        });
        checkout.current = instance;
        instance.open();
      }
    } catch (err) {
      if (alive.current) {
        setError(messageFor(err));
        if (!dialog.current?.open) dialog.current?.showModal();
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="submission-dialog"
      aria-labelledby="pay-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="modal-header">
        <h2 id="pay-title">Pay school fees</h2>
        <button
          disabled={busy}
          className="icon-button"
          aria-label="Close payment dialog"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="space-y-5 p-6">
        <p className="muted text-sm">
          {invoice.invoiceNumber} · Balance {money(invoice.balanceAmount)}
        </p>
        {error && (
          <div role="alert" className="state-box">
            {error}
          </div>
        )}
        {status && (
          <p
            role="status"
            className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"
          >
            {status}
          </p>
        )}
        {!options ? (
          <>
            {!error && <p aria-busy="true">Loading payment methods…</p>}
            {error && (
              <Button onClick={() => setRetry((value) => value + 1)}>Retry payment methods</Button>
            )}
          </>
        ) : !options.razorpay && !options.upi ? (
          <p className="state-box">
            Online payments are not configured. Contact the school office to arrange payment.
          </p>
        ) : !order ? (
          <form onSubmit={pay} className="space-y-5">
            <div className="field">
              <label htmlFor="gateway">Payment method</label>
              <select
                id="gateway"
                value={gateway}
                disabled={busy}
                onChange={(e) => setGateway(e.target.value)}
              >
                {options.razorpay && (
                  <option value="RAZORPAY">Razorpay — UPI, cards & net banking</option>
                )}
                {options.upi && <option value="UPI">Direct UPI to school</option>}
              </select>
            </div>
            <div className="field">
              <label htmlFor="phone">Mobile number (+91)</label>
              <input
                id="phone"
                type="tel"
                required
                autoFocus
                disabled={busy}
                placeholder="98470 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="amount">Amount (INR ₹)</label>
              <input
                id="amount"
                type="number"
                required
                disabled={busy}
                min="1"
                max={invoice.balanceAmount / 100}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="muted text-xs">
              {gateway === 'RAZORPAY'
                ? 'Complete payment in secure Razorpay Checkout. Your receipt appears after confirmation.'
                : 'A QR code opens for payment to the school. The school confirms direct UPI receipts.'}
            </p>
            <Button type="submit" fullWidth isLoading={busy}>
              {gateway === 'RAZORPAY' ? 'Continue to checkout' : 'Show UPI payment code'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {qr && (
              <>
                <Image
                  unoptimized
                  src={qr}
                  alt="School UPI payment QR code"
                  width={256}
                  height={256}
                  className="mx-auto"
                />
                <a className="underline block text-center" href={order.upiIntentUri}>
                  Open UPI app
                </a>
              </>
            )}
            <p className="text-sm break-all">Payment reference: {order.gatewayOrderId}</p>
            <Button fullWidth variant="outline" isLoading={busy} onClick={() => void checkStatus()}>
              Check payment status
            </Button>
            <Button fullWidth variant="ghost" disabled={busy} onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
