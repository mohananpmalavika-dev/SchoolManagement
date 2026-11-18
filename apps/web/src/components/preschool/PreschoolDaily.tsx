'use client';
/* Private signed photo links bypass the shared Next.js image-optimizer cache. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  Pencil,
  QrCode,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  developmentDomains,
  friendly,
  pickupMethodLabel,
  timeInputValue,
  timeLabel,
  type PreschoolAction,
  type PreschoolChild,
  type PreschoolChildView,
  type PreschoolObservation,
  type PreschoolPhotoItem,
  type PreschoolPickupPassSummary,
} from '@/lib/preschool';
import { messageFor, dateLabel } from '@/lib/workspace';
import { Button } from '../ui';
import { EmptyState, Panel, StatusPill } from '../WorkspaceUI';
import { Field, PreschoolArea, PreschoolText } from './PreschoolFields';
import { PreschoolQrScanner } from './PreschoolPickupPass';

const bulkMealPresets = [
  'Finished meal well',
  'Ate half portion',
  'Had snacks & water',
  'Refused meal',
] as const;

const bulkMoodOptions = ['HAPPY', 'SETTLED', 'TIRED', 'UPSET', 'NOT_RECORDED'] as const;
const bulkSleepPresets = [30, 60, 90] as const;

export function PreschoolBulkCareForm({
  classId,
  roster,
  total,
  selectedIds,
  date,
  isToday = true,
  busy,
  action,
  onClearSelection,
}: {
  classId: string;
  roster: PreschoolChild[];
  total: number;
  selectedIds: string[];
  date?: string;
  isToday?: boolean;
  busy: boolean;
  action: PreschoolAction;
  onClearSelection?: () => void;
}) {
  const checkedInCount = roster.filter((s) => !!s.day?.checkInAt).length;
  const [scope, setScope] = useState<'CHECKED_IN' | 'ALL' | 'SELECTED'>(() =>
    selectedIds.length > 0 ? 'SELECTED' : checkedInCount > 0 ? 'CHECKED_IN' : 'ALL'
  );
  const [meals, setMeals] = useState('');
  const [sleep, setSleep] = useState('');
  const [toileting, setToileting] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [share, setShare] = useState(true);
  const prevSelectedCount = useRef(selectedIds.length);

  useEffect(() => {
    if (selectedIds.length > 0 && prevSelectedCount.current === 0) {
      setScope('SELECTED');
    } else if (selectedIds.length === 0 && scope === 'SELECTED') {
      setScope(checkedInCount > 0 ? 'CHECKED_IN' : 'ALL');
    }
    prevSelectedCount.current = selectedIds.length;
  }, [selectedIds.length, scope, checkedInCount]);

  const hasCareField = Boolean(
    meals.trim() || sleep !== '' || toileting || mood || notes.trim()
  );
  const canApplyChanges = hasCareField || share;
  const isPaginated = total > roster.length;
  const targetUnavailable =
    (scope === 'SELECTED' && selectedIds.length === 0) ||
    (scope === 'CHECKED_IN' && !isPaginated && checkedInCount === 0) ||
    (scope === 'ALL' && total === 0);

  const targetSummary =
    scope === 'SELECTED'
      ? `${selectedIds.length} selected ${selectedIds.length === 1 ? 'child' : 'children'}`
      : scope === 'CHECKED_IN'
        ? isPaginated
          ? 'all checked-in children'
          : `${checkedInCount} checked-in ${checkedInCount === 1 ? 'child' : 'children'}`
        : `all ${total} ${total === 1 ? 'child' : 'children'} in class`;

  async function submitBulkCare(e: FormEvent) {
    e.preventDefault();
    if (!canApplyChanges || targetUnavailable) return;
    const payload: Record<string, unknown> = {
      shareWithParents: share,
      ...(date ? { date } : {}),
    };
    if (scope === 'SELECTED') payload.studentIds = selectedIds;
    if (scope === 'CHECKED_IN') payload.checkedInOnly = true;
    if (meals.trim()) payload.meals = meals.trim();
    if (sleep !== '') payload.sleepMinutes = Number(sleep);
    if (toileting) payload.toileting = toileting;
    if (mood) payload.mood = mood;
    if (notes.trim()) payload.notes = notes.trim();
    const ok = await action('/classes/' + classId + '/care/bulk', payload);
    if (ok) {
      setMeals('');
      setSleep('');
      setToileting('');
      setMood('');
      setNotes('');
      if (scope === 'SELECTED') onClearSelection?.();
    }
  }

  return (
    <Panel
      title={isToday ? 'Bulk daily care update' : `Bulk daily care backfill · ${date}`}
      subtitle={
        isToday
          ? 'Update meals, nap, mood or notes for the whole class in one click. Blank fields keep each child’s existing record.'
          : `Backfill or correct meals, nap, mood or notes for ${date}. Blank fields keep each child’s existing record.`
      }
    >
      <form className="panel-body space-y-4" onSubmit={submitBulkCare}>
        <div className="space-y-2">
          <span className="text-sm font-medium block">Apply to</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={scope === 'CHECKED_IN' ? 'primary' : 'outline'}
              aria-pressed={scope === 'CHECKED_IN'}
              disabled={busy || (!isPaginated && checkedInCount === 0)}
              onClick={() => setScope('CHECKED_IN')}
            >
              {isToday ? 'Checked-in today' : `Checked-in on ${date}`} ({checkedInCount}
              {isPaginated ? '+' : ''})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scope === 'ALL' ? 'primary' : 'outline'}
              aria-pressed={scope === 'ALL'}
              disabled={busy || total === 0}
              onClick={() => setScope('ALL')}
            >
              Whole class ({total})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scope === 'SELECTED' ? 'primary' : 'outline'}
              aria-pressed={scope === 'SELECTED'}
              disabled={busy || selectedIds.length === 0}
              onClick={() => setScope('SELECTED')}
            >
              Selected children ({selectedIds.length})
            </Button>
          </div>
          {!isPaginated && checkedInCount === 0 && scope !== 'ALL' && (
            <p className="text-xs muted">
              No children are checked in yet. Use Bulk Check-in above or switch to Whole class.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium block">Quick mood</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mood === '' ? 'primary' : 'outline'}
              aria-pressed={mood === ''}
              disabled={busy}
              onClick={() => setMood('')}
            >
              Keep existing
            </Button>
            {bulkMoodOptions.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={mood === option ? 'primary' : 'outline'}
                aria-pressed={mood === option}
                disabled={busy}
                onClick={() => setMood(option)}
              >
                {friendly(option)}
              </Button>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="space-y-2">
            <PreschoolArea
              label="Meals / snacks (optional)"
              value={meals}
              onChange={setMeals}
              maxLength={2000}
              rows={2}
              placeholder="Leave blank to keep each child’s existing meal note"
            />
            <div className="flex flex-wrap gap-2">
              {bulkMealPresets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={meals === preset ? 'primary' : 'outline'}
                  disabled={busy}
                  onClick={() => setMeals((current) => (current === preset ? '' : preset))}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <PreschoolText
              label="Rest / sleep (minutes, optional)"
              type="number"
              value={sleep}
              onChange={setSleep}
              min={0}
              max={720}
              required={false}
              placeholder="Leave blank to keep existing"
            />
            <div className="flex flex-wrap gap-2">
              {bulkSleepPresets.map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  size="sm"
                  variant={sleep === String(mins) ? 'primary' : 'outline'}
                  disabled={busy}
                  onClick={() =>
                    setSleep((current) => (current === String(mins) ? '' : String(mins)))
                  }
                >
                  {mins} min
                </Button>
              ))}
            </div>
          </div>

          <Field label="Toileting (optional)">
            {(id) => (
              <select
                id={id}
                value={toileting}
                disabled={busy}
                onChange={(e) => setToileting(e.target.value)}
              >
                <option value="">Keep existing (no change)</option>
                {['INDEPENDENT', 'ASSISTED', 'CHANGED', 'NOT_RECORDED'].map((v) => (
                  <option key={v} value={v}>
                    {friendly(v)}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <PreschoolArea
            label="Shared classroom note (optional)"
            value={notes}
            onChange={setNotes}
            rows={2}
            placeholder="Leave blank to keep each child’s existing notes"
          />
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={share}
            disabled={busy}
            onChange={(e) => setShare(e.target.checked)}
          />
          Share these care updates with linked parents immediately
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            leftIcon={<CheckCheck size={16} />}
            disabled={busy || !canApplyChanges || targetUnavailable}
            isLoading={busy}
          >
            Update care for {targetSummary}
          </Button>
          {!canApplyChanges && (
            <span className="text-xs muted">
              Pick a meal, mood, sleep, toileting, note, or enable parent sharing to submit.
            </span>
          )}
        </div>
      </form>
    </Panel>
  );
}

export function PreschoolCareForm({
  child,
  date,
  isToday = true,
  busy,
  action,
  pickupVerification = 'OPTIONAL',
  timezone = 'Asia/Kolkata',
}: {
  child: PreschoolChild;
  date?: string;
  isToday?: boolean;
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
    [checkoutTime, setCheckoutTime] = useState(isToday ? '' : '15:00'),
    [otp, setOtp] = useState(''),
    [qrToken, setQrToken] = useState(''),
    [showScanner, setShowScanner] = useState(false),
    [activePass, setActivePass] = useState<PreschoolPickupPassSummary | null>(
      child.activePickupPass || null
    ),
    [passBusy, setPassBusy] = useState(false),
    [passNotice, setPassNotice] = useState(''),
    [passError, setPassError] = useState(''),
    [editCheckInTime, setEditCheckInTime] = useState(timeInputValue(day?.checkInAt, timezone)),
    [editCheckOutTime, setEditCheckOutTime] = useState(timeInputValue(day?.checkOutAt, timezone)),
    [editGuardianId, setEditGuardianId] = useState(day?.pickupGuardianId || ''),
    [confirmUndo, setConfirmUndo] = useState<'' | 'check-in' | 'check-out' | 'absent'>('');

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
  const missingRequiredPass =
    isToday && pickupVerification === 'REQUIRED' && !hasValidOtp && !hasQr;
  const canSubmitCheckout =
    verified && (!!guardian || (isToday && hasQr)) && !missingRequiredPass;
  const originalCheckInTime = timeInputValue(day?.checkInAt, timezone);
  const originalCheckOutTime = timeInputValue(day?.checkOutAt, timezone);
  const hasTimeCorrection = Boolean(
    (day?.checkInAt && editCheckInTime && editCheckInTime !== originalCheckInTime) ||
      (day?.checkOutAt && editCheckOutTime && editCheckOutTime !== originalCheckOutTime) ||
      (day?.checkOutAt && editGuardianId && editGuardianId !== (day?.pickupGuardianId || ''))
  );
  function save(e: FormEvent) {
    e.preventDefault();
    void action('/students/' + child.id + '/care', {
      version: day?.version || 0,
      ...(date ? { date } : {}),
      meals,
      sleepMinutes: sleep !== '' ? Number(sleep) : null,
      toileting,
      mood,
      notes,
      shareWithParents: share,
    });
  }
  function saveCorrection(e: FormEvent) {
    e.preventDefault();
    if (!day || !hasTimeCorrection) return;
    const payload: Record<string, unknown> = {
      version: day.version || 0,
      ...(date ? { date } : {}),
    };
    if (day.checkInAt && editCheckInTime && editCheckInTime !== originalCheckInTime) {
      payload.checkInTime = editCheckInTime;
    }
    if (day.checkOutAt && editCheckOutTime && editCheckOutTime !== originalCheckOutTime) {
      payload.checkOutTime = editCheckOutTime;
    }
    if (day.checkOutAt && editGuardianId && editGuardianId !== (day.pickupGuardianId || '')) {
      payload.pickupGuardianId = editGuardianId;
    }
    void action('/students/' + child.id + '/attendance-times', payload, 'patch');
  }
  const dateTag = isToday ? 'today' : date || 'this date';
  return (
    <div className="content-stack">
      <Panel
        title={
          (isToday ? 'Daily care · ' : `Daily care backfill (${date}) · `) +
          child.firstName +
          ' ' +
          child.lastName
        }
        subtitle={
          isToday
            ? 'Share reviewed care notes with the family.'
            : `Record or update missed care notes for ${date}.`
        }
      >
        <form className="panel-body space-y-4" onSubmit={save}>
          {!day?.checkInAt && child.attendance?.status === 'ABSENT' && (
            <div className="state-box flex flex-wrap items-center gap-2" role="status">
              <StatusPill value="ABSENT" />
              <span>
                {child.firstName} is marked absent for {dateTag}. Use Check in above if they
                attended, or Undo absence below.
              </span>
            </div>
          )}
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
          title={isToday ? 'Authorized pickup' : `Backfill missed checkout · ${date}`}
          subtitle={
            !isToday
              ? `Record a missed checkout for ${date}. Choose the authorized collecting guardian and pickup time.`
              : pickupVerification === 'REQUIRED'
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
                ...(date ? { date } : {}),
                ...(checkoutTime ? { time: checkoutTime } : {}),
                ...(isToday && trimmedOtp ? { pickupOtp: trimmedOtp } : {}),
                ...(isToday && trimmedQr ? { pickupQrToken: trimmedQr } : {}),
              });
            }}
          >
            <div className="form-grid">
              <Field label="Collecting guardian">
                {(id) => (
                  <select
                    id={id}
                    required={!isToday || !hasQr}
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
              <Field
                label={
                  isToday
                    ? 'Checkout time (optional — defaults to now)'
                    : `Checkout time on ${date}`
                }
              >
                {(id) => (
                  <input
                    id={id}
                    type="time"
                    required={!isToday}
                    value={checkoutTime}
                    onChange={(e) => setCheckoutTime(e.target.value)}
                  />
                )}
              </Field>
            </div>
            {!child.guardianLinks.some((link) => link.canPickup !== false) && (
              <p className="muted text-sm">
                The office must add a guardian with pickup permission before this child can be
                checked out.
              </p>
            )}
            {isToday && (
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
                      setPassNotice(
                        'Parent QR pickup pass scanned. Confirm checkout to complete.'
                      );
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
            )}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              {isToday
                ? 'I verified this person’s identity and pickup authorization'
                : `I confirm this authorized guardian collected ${child.firstName} on ${date}`}
            </label>
            <Button type="submit" disabled={!canSubmitCheckout} isLoading={busy}>
              {isToday ? 'Confirm checkout' : `Record checkout for ${date}`}
            </Button>
          </form>
        </Panel>
      )}
      {(day?.checkInAt || child.attendance?.status === 'ABSENT') && (
        <Panel
          title={`Attendance corrections & undo · ${child.firstName}`}
          subtitle="Adjust recorded check-in/checkout times or undo an accidental entry. Every change is audited."
        >
          <div className="panel-body space-y-4">
            {day?.checkInAt && (
              <form className="space-y-4" onSubmit={saveCorrection}>
                <div className="form-grid">
                  <Field label="Check-in time">
                    {(id) => (
                      <input
                        id={id}
                        type="time"
                        value={editCheckInTime}
                        disabled={busy}
                        onChange={(e) => setEditCheckInTime(e.target.value)}
                      />
                    )}
                  </Field>
                  {day.checkOutAt && (
                    <>
                      <Field label="Checkout time">
                        {(id) => (
                          <input
                            id={id}
                            type="time"
                            value={editCheckOutTime}
                            disabled={busy}
                            onChange={(e) => setEditCheckOutTime(e.target.value)}
                          />
                        )}
                      </Field>
                      <Field label="Collecting guardian">
                        {(id) => (
                          <select
                            id={id}
                            value={editGuardianId}
                            disabled={busy}
                            onChange={(e) => setEditGuardianId(e.target.value)}
                          >
                            <option value="">Keep recorded guardian</option>
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
                    </>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  leftIcon={<Clock size={14} />}
                  disabled={busy || !hasTimeCorrection}
                  isLoading={busy}
                >
                  Save attendance correction
                </Button>
              </form>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              {day?.checkOutAt &&
                (confirmUndo === 'check-out' ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await action('/students/' + child.id + '/check-out/undo', {
                            ...(date ? { date } : {}),
                          })
                        )
                          setConfirmUndo('');
                      }}
                    >
                      Confirm undo checkout
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirmUndo('')}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<RotateCcw size={14} />}
                    disabled={busy}
                    onClick={() => setConfirmUndo('check-out')}
                  >
                    Undo checkout
                  </Button>
                ))}
              {day?.checkInAt &&
                !day.checkOutAt &&
                (confirmUndo === 'check-in' ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await action('/students/' + child.id + '/check-in/undo', {
                            ...(date ? { date } : {}),
                          })
                        )
                          setConfirmUndo('');
                      }}
                    >
                      Confirm undo check-in
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirmUndo('')}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<RotateCcw size={14} />}
                    disabled={busy}
                    onClick={() => setConfirmUndo('check-in')}
                  >
                    Undo check-in
                  </Button>
                ))}
              {!day?.checkInAt &&
                child.attendance?.status === 'ABSENT' &&
                (confirmUndo === 'absent' ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await action('/students/' + child.id + '/mark-absent/undo', {
                            ...(date ? { date } : {}),
                          })
                        )
                          setConfirmUndo('');
                      }}
                    >
                      Confirm undo absence
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirmUndo('')}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<RotateCcw size={14} />}
                    disabled={busy}
                    onClick={() => setConfirmUndo('absent')}
                  >
                    Undo absence
                  </Button>
                ))}
            </div>
          </div>
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
  editing,
  onCancelEdit,
}: {
  studentId: string;
  today: string;
  busy: boolean;
  action: PreschoolAction;
  editing?: PreschoolObservation | null;
  onCancelEdit?: () => void;
}) {
  const [domain, setDomain] = useState('LANGUAGE'),
    [level, setLevel] = useState('EMERGING'),
    [skill, setSkill] = useState(''),
    [observation, setObservation] = useState(''),
    [date, setDate] = useState(today),
    [shared, setShared] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (editing) {
      setDomain(editing.domain);
      setLevel(editing.level);
      setSkill(editing.skill);
      setObservation(editing.observation);
      setDate(editing.observedOn.slice(0, 10));
      setShared(Boolean(editing.shared));
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setDomain('LANGUAGE');
      setLevel('EMERGING');
      setSkill('');
      setObservation('');
      setDate(today);
      setShared(false);
    }
  }, [editing, today]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = editing
      ? await action(
          '/observations/' + editing.id,
          {
            domain,
            level,
            skill,
            observation,
            observedOn: date,
            shared,
          },
          'patch'
        )
      : await action('/observations', {
          studentId,
          domain,
          level,
          skill,
          observation,
          observedOn: date,
          shared,
        });
    if (ok) {
      setSkill('');
      setObservation('');
      if (editing) onCancelEdit?.();
    }
  }
  return (
    <Panel
      title={editing ? 'Edit development observation' : 'Record a development observation'}
      subtitle="Describe what you saw during play. Leave unobserved skills unrecorded."
    >
      <form ref={formRef} className="panel-body space-y-4" onSubmit={save}>
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
        <div className="flex flex-wrap gap-3">
          <Button type="submit" isLoading={busy}>
            {editing ? 'Update observation' : 'Save observation'}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => onCancelEdit?.()}
            >
              Cancel editing
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}

export function PreschoolChildHistory({
  view,
  timezone,
  canManageObservations = false,
  busy = false,
  onEditObservation,
  onDeleteObservation,
}: {
  view: PreschoolChildView;
  timezone: string;
  canManageObservations?: boolean;
  busy?: boolean;
  onEditObservation?: (observation: PreschoolObservation) => void;
  onDeleteObservation?: (id: string) => Promise<boolean>;
}) {
  const [confirmDeleteObsId, setConfirmDeleteObsId] = useState('');
  return (
    <div className="content-stack">
      <Panel title="Care & attendance history">
        <div className="panel-body space-y-4">
          {!view.days.length ? (
            <EmptyState title="No daily records in this period" />
          ) : (
            view.days.map((day) => (
              <article className="border rounded-xl p-4 space-y-2" key={day.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{dateLabel(day.date)}</h3>
                  {day.attendanceStatus === 'ABSENT' && <StatusPill value="ABSENT" />}
                </div>
                {day.attendanceStatus === 'ABSENT' && !day.checkInAt ? (
                  <p className="text-sm muted">
                    Marked absent
                    {day.attendanceRemarks ? ` · ${day.attendanceRemarks}` : ''}
                  </p>
                ) : (
                  <>
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
                  </>
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
                {canManageObservations && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {onEditObservation && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Pencil size={14} />}
                        disabled={busy}
                        onClick={() => onEditObservation(o)}
                      >
                        Edit
                      </Button>
                    )}
                    {onDeleteObservation &&
                      (confirmDeleteObsId === o.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busy}
                            onClick={async () => {
                              if (await onDeleteObservation(o.id)) setConfirmDeleteObsId('');
                            }}
                          >
                            Confirm delete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setConfirmDeleteObsId('')}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 size={14} />}
                          disabled={busy}
                          onClick={() => setConfirmDeleteObsId(o.id)}
                        >
                          Delete
                        </Button>
                      ))}
                  </div>
                )}
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

const MAX_PHOTOS_PER_UPLOAD = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

interface PendingPhotoFile {
  id: string;
  file: File;
  previewUrl: string;
}

export function PreschoolPhotos({
  classId,
  className,
  totalInClass,
  studentId,
  studentName,
  family,
  refresh,
  busy,
  notify,
  action,
}: {
  classId?: string;
  className?: string;
  totalInClass?: number;
  studentId?: string;
  studentName?: string;
  family: boolean;
  refresh: number;
  busy: boolean;
  notify: (message?: string) => void;
  action?: PreschoolAction;
}) {
  const [items, setItems] = useState<PreschoolPhotoItem[]>([]),
    [offset, setOffset] = useState(0),
    [more, setMore] = useState(false),
    [caption, setCaption] = useState(''),
    [error, setError] = useState(''),
    [uploading, setUploading] = useState(false),
    [confirmDeleteId, setConfirmDeleteId] = useState(''),
    [preview, setPreview] = useState<{
      id: string;
      url: string;
      caption: string;
      scope?: 'CLASS' | 'CHILD';
    } | null>(null),
    [uploadTarget, setUploadTarget] = useState<'CLASS' | 'CHILD'>(() =>
      !family && classId ? 'CLASS' : 'CHILD'
    ),
    [galleryFilter, setGalleryFilter] = useState<'ALL' | 'CLASS' | 'CHILD'>('ALL'),
    [pendingFiles, setPendingFiles] = useState<PendingPhotoFile[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingPhotoFile[]>([]);

  useEffect(() => {
    pendingRef.current = pendingFiles;
  }, [pendingFiles]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!family && !studentId && classId) {
      setUploadTarget('CLASS');
    }
  }, [family, studentId, classId]);

  const useClassAlbumEndpoint = !family && (!studentId || galleryFilter === 'CLASS') && Boolean(classId);

  useEffect(() => {
    setOffset(0);
  }, [studentId, classId, useClassAlbumEndpoint]);

  useEffect(() => {
    const endpoint = useClassAlbumEndpoint
      ? '/preschool/classes/' + classId + '/photos'
      : studentId
        ? '/preschool/students/' + studentId + '/photos'
        : '';
    if (!endpoint) {
      setItems([]);
      setMore(false);
      return;
    }
    const controller = new AbortController();
    setItems([]);
    setError('');
    setConfirmDeleteId('');
    apiClient
      .get(endpoint, {
        params: { offset },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setItems(data.items || []);
        setMore(Boolean(data.hasMore));
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [classId, studentId, useClassAlbumEndpoint, offset, refresh]);

  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => setPreview(null), 115000);
    return () => clearTimeout(timer);
  }, [preview]);

  function handleSelectFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setError('');
    const incoming = Array.from(fileList);
    const errors: string[] = [];
    const next: PendingPhotoFile[] = [];
    const remainingSlots = MAX_PHOTOS_PER_UPLOAD - pendingFiles.length;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_PHOTOS_PER_UPLOAD} photos at a time.`);
      if (input.current) input.current.value = '';
      return;
    }
    for (const file of incoming) {
      if (next.length >= remainingSlots) {
        errors.push(`Only the first ${MAX_PHOTOS_PER_UPLOAD} photos were kept.`);
        break;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        errors.push(`${file.name} is not a JPEG or PNG photo.`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        errors.push(`${file.name} is larger than 5 MB.`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (errors.length) setError(errors.join(' '));
    if (next.length) setPendingFiles((current) => [...current, ...next]);
    if (input.current) input.current.value = '';
  }

  function removePendingFile(id: string) {
    setPendingFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function clearPendingFiles() {
    setPendingFiles((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    if (input.current) input.current.value = '';
  }

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!pendingFiles.length) return;
    const isClassUpload = uploadTarget === 'CLASS' && Boolean(classId);
    if (!isClassUpload && !studentId) {
      setError('Choose a child or switch to Whole class sharing.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      for (const item of pendingFiles) {
        data.append('files', item.file);
      }
      data.set('caption', caption);
      const endpoint = isClassUpload
        ? '/preschool/classes/' + classId + '/photos'
        : '/preschool/students/' + studentId + '/photos';
      const count = pendingFiles.length;
      await apiClient.post(endpoint, data, {
        headers: { 'Content-Type': undefined },
      });
      setCaption('');
      clearPendingFiles();
      const photoWord = count === 1 ? 'photo' : 'photos';
      notify(
        isClassUpload
          ? `Shared ${count} ${photoWord} with all families in ${className || 'the class'}.`
          : `Shared ${count} ${photoWord} with ${studentName ? `${studentName}’s family` : 'the family'}.`
      );
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setUploading(false);
    }
  }

  async function view(item: PreschoolPhotoItem) {
    setError('');
    try {
      const endpoint = useClassAlbumEndpoint
        ? '/preschool/classes/' + classId + '/photos/' + item.id + '/view'
        : '/preschool/students/' + studentId + '/photos/' + item.id + '/view';
      const { data } = await apiClient.get(endpoint);
      setPreview({ id: item.id, url: data.url, caption: item.caption, scope: item.scope });
    } catch (err) {
      setError(messageFor(err));
    }
  }

  async function removePhoto(item: PreschoolPhotoItem) {
    if (!action) return;
    setError('');
    const deletePath =
      useClassAlbumEndpoint || (item.scope === 'CLASS' && classId && !studentId)
        ? '/classes/' + classId + '/photos/' + item.id
        : '/students/' + studentId + '/photos/' + item.id;
    if (await action(deletePath, undefined, 'delete')) {
      setConfirmDeleteId('');
      setPreview((current) => (current?.id === item.id ? null : current));
    }
  }

  const visibleItems = items.filter((item) => {
    if (galleryFilter === 'CLASS') return item.scope === 'CLASS';
    if (galleryFilter === 'CHILD') return item.scope !== 'CLASS';
    return true;
  });

  const previewIndex = preview ? visibleItems.findIndex((i) => i.id === preview.id) : -1;
  const uploadCount = pendingFiles.length;
  const targetLabel =
    uploadTarget === 'CLASS'
      ? `whole class${className ? ` (${className})` : ''}`
      : studentName
        ? `${studentName}’s family`
        : 'this child’s family';

  return (
    <Panel
      title="Classroom photos"
      subtitle={
        family
          ? 'Individual and whole-class activity photos shared with your family using private, expiring links.'
          : 'Upload one or multiple photos at once and share with the whole class or an individual child’s family.'
      }
    >
      <div className="panel-body space-y-5">
        {error && (
          <p role="alert" className="state-box">
            {error}
          </p>
        )}
        {!family && (
          <form className="rounded-xl border p-4 space-y-4 bg-slate-50/50" onSubmit={upload}>
            <div className="space-y-2">
              <span className="text-sm font-medium block">Share photos with</span>
              <div className="flex flex-wrap gap-2">
                {classId && (
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadTarget === 'CLASS' ? 'primary' : 'outline'}
                    leftIcon={<Users size={14} />}
                    aria-pressed={uploadTarget === 'CLASS'}
                    disabled={busy || uploading}
                    onClick={() => setUploadTarget('CLASS')}
                  >
                    Whole class{className ? ` · ${className}` : ''}
                    {typeof totalInClass === 'number' ? ` (${totalInClass})` : ''}
                  </Button>
                )}
                {studentId && (
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadTarget === 'CHILD' ? 'primary' : 'outline'}
                    leftIcon={<User size={14} />}
                    aria-pressed={uploadTarget === 'CHILD'}
                    disabled={busy || uploading}
                    onClick={() => setUploadTarget('CHILD')}
                  >
                    Only {studentName || 'selected child'}
                  </Button>
                )}
              </div>
              <p className="text-xs muted">
                {uploadTarget === 'CLASS'
                  ? 'Every linked parent in this class will see these classroom activity photos in their family workspace.'
                  : 'Only this child’s linked parents will see these photos.'}
              </p>
            </div>

            <Field
              label={`Photos (JPEG or PNG, up to ${MAX_PHOTOS_PER_UPLOAD} photos · max 5 MB each)`}
            >
              {(id) => (
                <input
                  ref={input}
                  id={id}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  disabled={busy || uploading}
                  onChange={(e) => handleSelectFiles(e.target.files)}
                />
              )}
            </Field>

            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium">
                    {pendingFiles.length} of {MAX_PHOTOS_PER_UPLOAD} photos selected
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={uploading}
                    onClick={clearPendingFiles}
                  >
                    Clear selection
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {pendingFiles.map((item) => (
                    <div
                      key={item.id}
                      className="relative rounded-lg border bg-white p-1.5 space-y-1"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-24 w-full rounded object-cover"
                      />
                      <p className="text-[11px] truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-[10px] muted">
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove ${item.file.name}`}
                        disabled={uploading}
                        onClick={() => removePendingFile(item.id)}
                        className="absolute top-1 right-1 rounded-full bg-slate-900/80 text-white p-1 hover:bg-slate-900"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PreschoolText
              label="Photo caption (applies to all selected photos)"
              value={caption}
              onChange={setCaption}
              maxLength={1000}
              required={false}
              placeholder="e.g., Finger painting & nature collage during morning circle"
            />
            <Button
              type="submit"
              leftIcon={<ImagePlus size={16} />}
              disabled={busy || !pendingFiles.length}
              isLoading={uploading}
            >
              {uploadCount > 1
                ? `Share ${uploadCount} photos with ${targetLabel}`
                : uploadCount === 1
                  ? `Share photo with ${targetLabel}`
                  : `Select photos to share with ${targetLabel}`}
            </Button>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(family || studentId) && (
              <Button
                type="button"
                size="sm"
                variant={galleryFilter === 'ALL' ? 'primary' : 'outline'}
                onClick={() => setGalleryFilter('ALL')}
              >
                All photos
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={
                galleryFilter === 'CLASS' || (!family && !studentId) ? 'primary' : 'outline'
              }
              leftIcon={<Users size={14} />}
              onClick={() => setGalleryFilter('CLASS')}
            >
              Whole class
            </Button>
            {(family || studentId) && (
              <Button
                type="button"
                size="sm"
                variant={galleryFilter === 'CHILD' ? 'primary' : 'outline'}
                leftIcon={<User size={14} />}
                onClick={() => setGalleryFilter('CHILD')}
              >
                Individual
              </Button>
            )}
          </div>
          <span className="text-xs muted">
            Showing {visibleItems.length} {visibleItems.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        {!visibleItems.length ? (
          <p className="muted">No shared photos in this view yet.</p>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const isClassScope = item.scope === 'CLASS';
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap justify-between items-center border rounded-xl p-4 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {item.caption ||
                          (isClassScope ? 'Classroom activity photo' : 'Classroom photo')}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          isClassScope
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isClassScope ? 'Whole class' : 'Individual'}
                      </span>
                    </div>
                    <span className="block text-sm muted">{dateLabel(item.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => void view(item)}>
                      View photo
                    </Button>
                    {!family &&
                      action &&
                      (confirmDeleteId === item.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busy || uploading}
                            onClick={() => void removePhoto(item)}
                          >
                            {isClassScope ? 'Confirm delete for whole class' : 'Confirm delete'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setConfirmDeleteId('')}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 size={14} />}
                          disabled={busy || uploading}
                          onClick={() => setConfirmDeleteId(item.id)}
                        >
                          Delete
                        </Button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {preview && (
          <div className="rounded-xl border p-4 space-y-3 bg-slate-50/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">
                  {preview.caption || 'Photo shared by the class teacher'}
                </p>
                {preview.scope && (
                  <span className="text-xs rounded-full border px-2 py-0.5 bg-white">
                    {preview.scope === 'CLASS' ? 'Whole class' : 'Individual'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {previewIndex > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ChevronLeft size={14} />}
                    onClick={() => void view(visibleItems[previewIndex - 1])}
                  >
                    Prev
                  </Button>
                )}
                {previewIndex >= 0 && previewIndex < visibleItems.length - 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ChevronRight size={14} />}
                    onClick={() => void view(visibleItems[previewIndex + 1])}
                  >
                    Next
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                  Close photo
                </Button>
              </div>
            </div>
            <img
              src={preview.url}
              alt={preview.caption || 'Photo shared by the class teacher'}
              className="max-h-[28rem] rounded-xl object-contain"
            />
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
