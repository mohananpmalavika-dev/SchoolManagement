'use client';
/* Private signed photo links bypass the shared Next.js image-optimizer cache. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { QrCode, Send, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  developmentDomains,
  friendly,
  pickupMethodLabel,
  timeLabel,
  type PreschoolAction,
  type PreschoolChild,
  type PreschoolChildView,
  type PreschoolPickupPassSummary,
} from '@/lib/preschool';
import { messageFor, dateLabel } from '@/lib/workspace';
import { Button } from '../ui';
import { EmptyState, Panel, StatusPill } from '../WorkspaceUI';
import { Field, PreschoolArea, PreschoolText } from './PreschoolFields';
import { PreschoolQrScanner } from './PreschoolPickupPass';

export function PreschoolCareForm({
  child,
  busy,
  action,
  pickupVerification = 'OPTIONAL',
  timezone = 'Asia/Kolkata',
}: {
  child: PreschoolChild;
  busy: boolean;
  action: PreschoolAction;
  pickupVerification?: 'OPTIONAL' | 'REQUIRED';
  timezone?: string;
}) {
  const day = child.day;
  const [meals, setMeals] = useState(day?.meals || ''),
    [sleep, setSleep] = useState(day?.sleepMinutes == null ? '' : String(day.sleepMinutes)),
    [toileting, setToileting] = useState(day?.toileting || 'NOT_RECORDED'),
    [mood, setMood] = useState(day?.mood || 'NOT_RECORDED'),
    [notes, setNotes] = useState(day?.notes || ''),
    [share, setShare] = useState(!!day?.sharedAt),
    [guardian, setGuardian] = useState(child.activePickupPass?.guardianId || ''),
    [verified, setVerified] = useState(false),
    [otp, setOtp] = useState(''),
    [qrToken, setQrToken] = useState(''),
    [showScanner, setShowScanner] = useState(false),
    [activePass, setActivePass] = useState<PreschoolPickupPassSummary | null>(
      child.activePickupPass || null
    ),
    [passBusy, setPassBusy] = useState(false),
    [passNotice, setPassNotice] = useState(''),
    [passError, setPassError] = useState('');

  async function requestParentOtp() {
    if (!guardian) return;
    setPassBusy(true);
    setPassError('');
    setPassNotice('');
    try {
      const { data } = await apiClient.post<PreschoolPickupPassSummary>(
        '/preschool/students/' + child.id + '/pickup-pass',
        { guardianId: guardian }
      );
      setActivePass(data);
      const channels = (data.deliveryChannels || ['PORTAL'])
        .map((c) => (c === 'PORTAL' ? 'Parent portal' : friendly(c)))
        .join(', ');
      setPassNotice(
        `Pickup OTP & QR pass sent to ${data.guardianName} (${channels}). Ask the parent to share the 6-digit code or show the QR pass.`
      );
    } catch (err) {
      setPassError(messageFor(err));
    } finally {
      setPassBusy(false);
    }
  }

  async function revokeParentPass() {
    setPassBusy(true);
    setPassError('');
    setPassNotice('');
    try {
      await apiClient.post('/preschool/students/' + child.id + '/pickup-pass/revoke');
      setActivePass(null);
      setOtp('');
      setQrToken('');
      setPassNotice('Previous pickup pass revoked.');
    } catch (err) {
      setPassError(messageFor(err));
    } finally {
      setPassBusy(false);
    }
  }

  const trimmedOtp = otp.trim();
  const trimmedQr = qrToken.trim();
  const hasValidOtp = /^\d{6}$/.test(trimmedOtp);
  const hasQr = trimmedQr.length >= 16;
  const missingRequiredPass = pickupVerification === 'REQUIRED' && !hasValidOtp && !hasQr;
  const canSubmitCheckout = verified && (!!guardian || hasQr) && !missingRequiredPass;
  function save(e: FormEvent) {
    e.preventDefault();
    void action('/students/' + child.id + '/care', {
      version: day?.version || 0,
      meals,
      sleepMinutes: sleep !== '' ? Number(sleep) : null,
      toileting,
      mood,
      notes,
      shareWithParents: share,
    });
  }
  return (
    <div className="content-stack">
      <Panel
        title={'Daily care · ' + child.firstName + ' ' + child.lastName}
        subtitle="Share reviewed care notes with the family."
      >
        <form className="panel-body space-y-4" onSubmit={save}>
          <div className="form-grid">
            <PreschoolArea
              label="Meals / snacks"
              value={meals}
              onChange={setMeals}
              maxLength={2000}
            />
            <PreschoolText
              label="Rest / sleep (minutes)"
              type="number"
              value={sleep}
              onChange={setSleep}
              min={0}
              max={720}
              required={false}
            />
            <Field label="Toileting">
              {(id) => (
                <select id={id} value={toileting} onChange={(e) => setToileting(e.target.value)}>
                  {['NOT_RECORDED', 'INDEPENDENT', 'ASSISTED', 'CHANGED'].map((v) => (
                    <option key={v} value={v}>
                      {friendly(v)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Mood">
              {(id) => (
                <select id={id} value={mood} onChange={(e) => setMood(e.target.value)}>
                  {['NOT_RECORDED', 'HAPPY', 'SETTLED', 'TIRED', 'UPSET'].map((v) => (
                    <option key={v} value={v}>
                      {friendly(v)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <PreschoolArea label="Classroom notes" value={notes} onChange={setNotes} />
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
            Share these care notes with the linked parents
          </label>
          <Button type="submit" isLoading={busy}>
            Save daily care
          </Button>
        </form>
      </Panel>
      {day?.checkInAt && !day.checkOutAt && (
        <Panel
          title="Authorized pickup"
          subtitle={
            pickupVerification === 'REQUIRED'
              ? 'Verify the collecting guardian using the parent’s 6-digit OTP or QR pickup pass.'
              : 'Confirm the collecting person’s identity before recording checkout. Optional parent OTP or QR pass verification is also available.'
          }
        >
          <form
            className="panel-body space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void action('/students/' + child.id + '/check-out', {
                ...(guardian ? { guardianId: guardian } : {}),
                identityVerified: verified,
                ...(trimmedOtp ? { pickupOtp: trimmedOtp } : {}),
                ...(trimmedQr ? { pickupQrToken: trimmedQr } : {}),
              });
            }}
          >
            <Field label="Collecting guardian">
              {(id) => (
                <select
                  id={id}
                  required={!hasQr}
                  value={guardian}
                  onChange={(e) => {
                    setGuardian(e.target.value);
                    setVerified(false);
                  }}
                >
                  <option value="">Choose authorized guardian</option>
                  {child.guardianLinks
                    .filter((link) => link.canPickup !== false)
                    .map((link) => (
                      <option key={link.guardianId} value={link.guardianId}>
                        {link.guardian.firstName} {link.guardian.lastName} ·{' '}
                        {friendly(link.relationship)}
                      </option>
                    ))}
                </select>
              )}
            </Field>
            {!child.guardianLinks.some((link) => link.canPickup !== false) && (
              <p className="muted text-sm">
                The office must add a guardian with pickup permission before this child can be
                checked out.
              </p>
            )}
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Safe pickup OTP / QR verification
                </p>
                <StatusPill
                  value={
                    pickupVerification === 'REQUIRED' ? 'Required by school' : 'Optional'
                  }
                />
              </div>

              {passError && (
                <p role="alert" className="state-box">
                  {passError}
                </p>
              )}
              {passNotice && (
                <p role="status" className="state-box success">
                  {passNotice}
                </p>
              )}

              {activePass && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm muted">
                  <span>
                    Active pass for <strong>{activePass.guardianName}</strong> · expires at{' '}
                    {timeLabel(activePass.expiresAt, timezone)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy || passBusy}
                    onClick={() => void revokeParentPass()}
                  >
                    Revoke pass
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Send size={14} />}
                  disabled={!guardian || busy || passBusy}
                  isLoading={passBusy}
                  onClick={() => void requestParentOtp()}
                >
                  Send pickup OTP to parent
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<QrCode size={14} />}
                  disabled={busy}
                  onClick={() => setShowScanner((v) => !v)}
                >
                  {showScanner ? 'Hide QR scanner' : 'Scan parent QR pass'}
                </Button>
              </div>

              {showScanner && (
                <PreschoolQrScanner
                  onDetected={(value) => {
                    setQrToken(value);
                    setShowScanner(false);
                    setPassNotice('Parent QR pickup pass scanned. Confirm checkout to complete.');
                  }}
                  onClose={() => setShowScanner(false)}
                />
              )}

              <div className="form-grid">
                <Field
                  label={
                    pickupVerification === 'REQUIRED'
                      ? 'Parent pickup OTP (6 digits)'
                      : 'Parent pickup OTP (optional)'
                  }
                >
                  {(id) => (
                    <input
                      id={id}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="6-digit OTP from parent phone"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    />
                  )}
                </Field>
                <Field
                  label={
                    pickupVerification === 'REQUIRED'
                      ? 'Parent QR pass code'
                      : 'Parent QR pass code (optional)'
                  }
                >
                  {(id) => (
                    <input
                      id={id}
                      type="text"
                      placeholder="Scan or paste KRYPTON-PICKUP-1:…"
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                    />
                  )}
                </Field>
              </div>
              {missingRequiredPass && (
                <p className="text-xs muted">
                  Enter the 6-digit OTP from the parent’s phone or scan their QR pickup pass to
                  enable checkout.
                </p>
              )}
            </div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              I verified this person’s identity and pickup authorization
            </label>
            <Button type="submit" disabled={!canSubmitCheckout} isLoading={busy}>
              Confirm checkout
            </Button>
          </form>
        </Panel>
      )}
    </div>
  );
}

export function PreschoolObservationForm({
  studentId,
  today,
  busy,
  action,
}: {
  studentId: string;
  today: string;
  busy: boolean;
  action: PreschoolAction;
}) {
  const [domain, setDomain] = useState('LANGUAGE'),
    [level, setLevel] = useState('EMERGING'),
    [skill, setSkill] = useState(''),
    [observation, setObservation] = useState(''),
    [date, setDate] = useState(today),
    [shared, setShared] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (
      await action('/observations', {
        studentId,
        domain,
        level,
        skill,
        observation,
        observedOn: date,
        shared,
      })
    ) {
      setSkill('');
      setObservation('');
    }
  }
  return (
    <Panel
      title="Record a development observation"
      subtitle="Describe what you saw during play. Leave unobserved skills unrecorded."
    >
      <form className="panel-body space-y-4" onSubmit={save}>
        <div className="form-grid">
          <Field label="Development area">
            {(id) => (
              <select id={id} value={domain} onChange={(e) => setDomain(e.target.value)}>
                {developmentDomains.map((d) => (
                  <option key={d} value={d}>
                    {friendly(d)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Observed level">
            {(id) => (
              <select id={id} value={level} onChange={(e) => setLevel(e.target.value)}>
                {['EMERGING', 'DEVELOPING', 'CONSISTENT'].map((l) => (
                  <option key={l} value={l}>
                    {friendly(l)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <PreschoolText label="Skill observed" value={skill} onChange={setSkill} />
          <Field label="Observation date">
            {(id) => (
              <input
                id={id}
                type="date"
                value={date}
                max={today}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </Field>
        </div>
        <PreschoolArea
          label="What happened? Include context and support offered"
          value={observation}
          onChange={setObservation}
          required
        />
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
          Share this observation with parents
        </label>
        <Button type="submit" isLoading={busy}>
          Save observation
        </Button>
      </form>
    </Panel>
  );
}

export function PreschoolChildHistory({
  view,
  timezone,
}: {
  view: PreschoolChildView;
  timezone: string;
}) {
  return (
    <div className="content-stack">
      <Panel title="Care & attendance history">
        <div className="panel-body space-y-4">
          {!view.days.length ? (
            <EmptyState title="No daily records in this period" />
          ) : (
            view.days.map((day) => (
              <article className="border rounded-xl p-4 space-y-2" key={day.id}>
                <h3 className="font-semibold">{dateLabel(day.date)}</h3>
                <p className="text-sm flex flex-wrap items-center gap-2">
                  <span>
                    Check-in {timeLabel(day.checkInAt, timezone)} · Checkout{' '}
                    {timeLabel(day.checkOutAt, timezone)}
                  </span>
                  {day.checkOutAt && pickupMethodLabel(day.pickupVerificationMethod) && (
                    <StatusPill value={pickupMethodLabel(day.pickupVerificationMethod)!} />
                  )}
                </p>
                {day.sharedAt ? (
                  <>
                    <p>Meals: {day.meals || 'Not recorded'}</p>
                    <p>
                      Rest:{' '}
                      {day.sleepMinutes != null ? day.sleepMinutes + ' minutes' : 'Not recorded'} ·
                      Mood: {friendly(day.mood || 'NOT_RECORDED')} · Toileting:{' '}
                      {friendly(day.toileting || 'NOT_RECORDED')}
                    </p>
                    <p className="whitespace-pre-wrap">{day.notes}</p>
                  </>
                ) : (
                  <p className="muted text-sm">Care notes have not been shared for this day.</p>
                )}
              </article>
            ))
          )}
        </div>
      </Panel>
      <Panel
        title="Development observations"
        subtitle="These are classroom observations, not diagnoses or comparisons between children."
      >
        <div className="panel-body space-y-4">
          {!view.observations.length ? (
            <EmptyState title="No observations in this period" />
          ) : (
            view.observations.map((o) => (
              <article className="border rounded-xl p-4 space-y-2" key={o.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold">{o.skill}</h3>
                  <StatusPill value={o.level} />
                </div>
                <p className="muted text-sm">
                  {friendly(o.domain)} · {dateLabel(o.observedOn)}
                  {!o.shared && ' · Staff only'}
                </p>
                <p className="whitespace-pre-wrap">{o.observation}</p>
              </article>
            ))
          )}
          {view.hasMoreObservations && (
            <p className="state-box">
              More observations are available. Choose a shorter date range to see the rest.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}

export function PreschoolPhotos({
  studentId,
  family,
  refresh,
  busy,
  notify,
}: {
  studentId: string;
  family: boolean;
  refresh: number;
  busy: boolean;
  notify: () => void;
}) {
  const [items, setItems] = useState<{ id: string; caption: string; createdAt: string }[]>([]),
    [offset, setOffset] = useState(0),
    [more, setMore] = useState(false),
    [caption, setCaption] = useState(''),
    [error, setError] = useState(''),
    [uploading, setUploading] = useState(false),
    [preview, setPreview] = useState<{ url: string; caption: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setError('');
    apiClient
      .get('/preschool/students/' + studentId + '/photos', {
        params: { offset },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setItems(data.items);
        setMore(data.hasMore);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [studentId, offset, refresh]);
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => setPreview(null), 115000);
    return () => clearTimeout(timer);
  }, [preview]);
  async function upload(e: FormEvent) {
    e.preventDefault();
    const photo = input.current?.files?.[0];
    if (!photo) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.set('file', photo);
      data.set('caption', caption);
      await apiClient.post('/preschool/students/' + studentId + '/photos', data, {
        headers: { 'Content-Type': undefined },
      });
      setCaption('');
      if (input.current) input.current.value = '';
      notify();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setUploading(false);
    }
  }
  async function view(id: string, caption: string) {
    setError('');
    try {
      const { data } = await apiClient.get(
        '/preschool/students/' + studentId + '/photos/' + id + '/view'
      );
      setPreview({ url: data.url, caption });
    } catch (err) {
      setError(messageFor(err));
    }
  }
  return (
    <Panel
      title="Classroom photos"
      subtitle="Photos are shared with this child’s linked family using private, expiring access."
    >
      <div className="panel-body space-y-4">
        {error && (
          <p role="alert" className="state-box">
            {error}
          </p>
        )}
        {!family && (
          <form className="space-y-4" onSubmit={upload}>
            <Field label="Photo (JPEG or PNG, up to 5 MB)">
              {(id) => (
                <input ref={input} id={id} type="file" accept="image/jpeg,image/png" required />
              )}
            </Field>
            <PreschoolText
              label="Photo caption"
              value={caption}
              onChange={setCaption}
              maxLength={1000}
              required={false}
            />
            <Button type="submit" disabled={busy} isLoading={uploading}>
              Share photo with family
            </Button>
          </form>
        )}
        {!items.length ? (
          <p className="muted">No shared photos yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border rounded-xl p-4 gap-3"
            >
              <p>
                {item.caption || 'Classroom photo'}
                <span className="block text-sm muted">{dateLabel(item.createdAt)}</span>
              </p>
              <Button size="sm" variant="outline" onClick={() => void view(item.id, item.caption)}>
                View photo
              </Button>
            </div>
          ))
        )}
        {preview && (
          <div>
            <img
              src={preview.url}
              alt={preview.caption || 'Photo shared by the class teacher'}
              className="max-h-96 rounded-xl object-contain"
            />
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Close photo
            </Button>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={!offset}
            onClick={() => setOffset((v) => Math.max(0, v - 20))}
          >
            Previous photos
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!more}
            onClick={() => setOffset((v) => v + 20)}
          >
            More photos
          </Button>
        </div>
      </div>
    </Panel>
  );
}
