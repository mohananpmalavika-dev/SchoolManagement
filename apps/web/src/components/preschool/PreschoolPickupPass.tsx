'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Copy, QrCode, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  friendly,
  pickupMethodLabel,
  timeLabel,
  type PreschoolPickupPassStatus,
} from '@/lib/preschool';
import { messageFor } from '@/lib/workspace';
import { QRCodeSVG } from '../attendance/QRCodeSVG';
import { Button } from '../ui';
import { Panel, StatusPill } from '../WorkspaceUI';
import { Field } from './PreschoolFields';

function channelLabel(channel: string) {
  if (channel === 'PORTAL') return 'Parent portal';
  if (channel === 'WHATSAPP') return 'WhatsApp';
  if (channel === 'EMAIL') return 'Email';
  return friendly(channel);
}

function formatOtp(otp: string) {
  return otp.length === 6 ? `${otp.slice(0, 3)} ${otp.slice(3)}` : otp;
}

function countdownLabel(expiresAt: string, nowMs: number) {
  const remainingSec = Math.floor((new Date(expiresAt).getTime() - nowMs) / 1000);
  if (remainingSec <= 0) return 'Expired';
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s left`;
}

export function PreschoolParentPickupPass({
  studentId,
  studentName,
  timezone,
  refresh,
}: {
  studentId: string;
  studentName: string;
  timezone: string;
  refresh: number;
}) {
  const [status, setStatus] = useState<PreschoolPickupPassStatus | null>(null);
  const [guardianId, setGuardianId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'otp' | 'qr' | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    apiClient
      .get<PreschoolPickupPassStatus>('/preschool/students/' + studentId + '/pickup-pass', {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!data || typeof data !== 'object' || !('checkedIn' in data)) return;
        setStatus(data);
        setGuardianId((current) => {
          if (current && data.authorizedGuardians?.some((g) => g.guardianId === current)) {
            return current;
          }
          return (
            data.activePass?.guardianId ||
            data.selfGuardianId ||
            data.authorizedGuardians?.[0]?.guardianId ||
            ''
          );
        });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [studentId, refresh]);

  useEffect(() => {
    if (!status?.activePass?.expiresAt) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status?.activePass?.expiresAt]);

  async function generatePass() {
    setBusy(true);
    setError('');
    try {
      const { data } = await apiClient.post('/preschool/students/' + studentId + '/pickup-pass', {
        ...(guardianId ? { guardianId } : {}),
      });
      setStatus((prev) => (prev ? { ...prev, activePass: data } : prev));
      setNowMs(Date.now());
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function revokePass() {
    setBusy(true);
    setError('');
    try {
      await apiClient.post('/preschool/students/' + studentId + '/pickup-pass/revoke');
      setStatus((prev) => (prev ? { ...prev, activePass: null } : prev));
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, kind: 'otp' | 'qr') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (!status || (!status.checkedIn && !status.checkedOut)) {
    return null;
  }

  if (status.checkedOut) {
    const methodText = pickupMethodLabel(status.pickupVerificationMethod);
    return (
      <Panel
        title="Safe pickup recorded"
        subtitle={`Today’s checkout for ${studentName} is complete.`}
      >
        <div className="panel-body space-y-2">
          <p className="text-sm flex flex-wrap items-center gap-2">
            <ShieldCheck size={16} />
            <span>
              Collected at <strong>{timeLabel(status.checkOutAt, timezone)}</strong>
              {status.collectedBy ? ` by ${status.collectedBy}` : ''}.
            </span>
            {methodText && <StatusPill value={methodText} />}
          </p>
        </div>
      </Panel>
    );
  }

  const active = status.activePass;
  const expired = active ? new Date(active.expiresAt).getTime() <= nowMs : false;
  const guardians = status.authorizedGuardians || [];

  return (
    <Panel
      title="Safe pickup pass (OTP & QR)"
      subtitle={
        status.pickupVerification === 'REQUIRED'
          ? 'Required by your school at checkout. Show this QR pass or 6-digit OTP to staff.'
          : 'Optional extra security for pickup. Generate a single-use OTP and QR pass to show at the gate.'
      }
    >
      <div className="panel-body space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusPill
            value={
              status.pickupVerification === 'REQUIRED' ? 'Required at pickup' : 'Optional pass'
            }
          />
          <span className="text-sm muted">
            Checked in at {timeLabel(status.checkInAt, timezone)}
          </span>
        </div>

        {error && (
          <p role="alert" className="state-box">
            {error}
          </p>
        )}

        {guardians.length > 0 ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Field label="Who is collecting today?">
                {(id) => (
                  <select
                    id={id}
                    value={guardianId}
                    disabled={busy}
                    onChange={(e) => setGuardianId(e.target.value)}
                  >
                    {guardians.map((g) => (
                      <option key={g.guardianId} value={g.guardianId}>
                        {g.name} · {friendly(g.relationship)}
                        {g.isSelf ? ' (You)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <Button
              type="button"
              isLoading={busy}
              leftIcon={active && !expired ? <RefreshCw size={15} /> : <QrCode size={15} />}
              onClick={() => void generatePass()}
            >
              {active && !expired ? 'Generate new pass' : 'Generate pickup pass'}
            </Button>
            {active && !expired && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void revokePass()}
              >
                Revoke pass
              </Button>
            )}
          </div>
        ) : (
          <p className="muted text-sm">
            No guardian currently has pickup permission on file. Please contact the school office.
          </p>
        )}

        {active && !expired && (
          <div className="border rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                Authorized collector: {active.guardianName}
                {active.relationship ? ` (${friendly(active.relationship)})` : ''}
              </p>
              <span className="text-sm muted">{countdownLabel(active.expiresAt, nowMs)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {active.qrPayload && (
                <div className="flex flex-col items-center gap-2">
                  <QRCodeSVG value={active.qrPayload} size={172} />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={copied === 'qr' ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => void copyText(active.qrPayload!, 'qr')}
                  >
                    {copied === 'qr' ? 'QR pass copied' : 'Copy QR code'}
                  </Button>
                </div>
              )}

              {active.otp && (
                <div className="space-y-3 flex-1 min-w-[200px]">
                  <div>
                    <p className="text-xs uppercase tracking-wide muted">6-digit pickup OTP</p>
                    <p
                      className="text-3xl font-bold tracking-widest mt-1"
                      aria-label="Pickup OTP code"
                    >
                      {formatOtp(active.otp)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={copied === 'otp' ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => void copyText(active.otp!, 'otp')}
                  >
                    {copied === 'otp' ? 'OTP copied' : 'Copy OTP'}
                  </Button>
                  <p className="text-xs muted">
                    Single-use · expires at {timeLabel(active.expiresAt, timezone)}
                  </p>
                  {active.deliveryChannels?.length > 0 && (
                    <p className="text-xs muted">
                      Available via: {active.deliveryChannels.map(channelLabel).join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs muted">
              Share this single-use code or QR pass only with the authorized person collecting{' '}
              {studentName}.
            </p>
          </div>
        )}

        {active && expired && (
          <p className="state-box">
            The previous pickup pass has expired. Tap “Generate pickup pass” to create a fresh one.
          </p>
        )}
      </div>
    </Panel>
  );
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
};

export function PreschoolQrScanner({
  onDetected,
  onClose,
}: {
  onDetected: (value: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [statusText, setStatusText] = useState('Starting camera…');

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function start() {
      const DetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
        }
      ).BarcodeDetector;

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Camera access is unavailable in this browser. Use a USB QR scanner or paste the parent’s QR pass code below.'
        );
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        if (!DetectorCtor) {
          setCameraError(
            'Automatic QR decoding is not supported by this browser. Use Chrome/Edge on mobile, a USB scanner, or paste the QR code / 6-digit OTP.'
          );
          return;
        }

        setStatusText('Point the camera at the parent’s QR pickup pass…');
        const detector = new DetectorCtor({ formats: ['qr_code'] });
        timer = setInterval(async () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const match = codes.find((c) => c.rawValue?.trim().startsWith('KRYPTON-PICKUP-'));
            if (match?.rawValue) {
              onDetected(match.rawValue.trim());
            }
          } catch {
            // Ignore transient frame decode errors while focusing
          }
        }, 350);
      } catch {
        if (!cancelled) {
          setCameraError(
            'Could not open camera permission. You can still paste the parent’s QR pass code or enter the 6-digit OTP.'
          );
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm flex items-center gap-2">
          <Camera size={16} />
          Scan parent QR pickup pass
        </p>
        <Button type="button" size="sm" variant="ghost" leftIcon={<X size={14} />} onClick={onClose}>
          Close scanner
        </Button>
      </div>
      {cameraError ? (
        <p className="text-sm muted">{cameraError}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full max-h-64 rounded-lg bg-black object-cover"
          />
          <p className="text-xs muted">{statusText}</p>
        </>
      )}
    </div>
  );
}
