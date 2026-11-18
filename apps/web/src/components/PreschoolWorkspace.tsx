'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Baby, CheckCheck, ClipboardCheck, Flower2, RefreshCw, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageContext } from '@/contexts/LanguageContext';
import {
  emptyPreschoolOptions,
  preschoolManagers,
  timeLabel,
  type PreschoolAction,
  type PreschoolChild,
  type PreschoolChildView,
  type PreschoolContent as Content,
  type PreschoolCopilotMessage,
  type PreschoolOptions,
} from '@/lib/preschool';
import { messageFor, dateLabel } from '@/lib/workspace';
import { Button } from './ui';
import { EmptyState, PageHeading, Panel, StatCard, StatusPill } from './WorkspaceUI';
import { PreschoolContent, PreschoolPrint } from './preschool/PreschoolContent';
import {
  PreschoolBulkCareForm,
  PreschoolCareForm,
  PreschoolChildHistory,
  PreschoolObservationForm,
  PreschoolPhotos,
} from './preschool/PreschoolDaily';
import { PreschoolParentPickupPass } from './preschool/PreschoolPickupPass';
import { PreschoolCameras } from './preschool/PreschoolCameras';
import { PreschoolSettings } from './preschool/PreschoolSettings';
import { PreschoolReports } from './preschool/PreschoolReports';
import { Field } from './preschool/PreschoolFields';
import { PreschoolCopilot } from './preschool/PreschoolCopilot';
import { PreschoolSectionLocation } from './PreschoolSectionLocation';
import { preschoolSectionsFor } from '@/lib/navigation';

type View =
  'daily' | 'learning' | 'progress' | 'photos' | 'cameras' | 'reports' | 'settings' | 'copilot';
const labels: Record<View, string> = {
  daily: 'Daily care',
  learning: 'Activities & plans',
  progress: 'Child development',
  photos: 'Photos',
  cameras: 'Classroom cameras',
  reports: 'Reports',
  settings: 'School setup',
  copilot: 'INKY assistant',
};
export function PreschoolWorkspace({ family = false }: { family?: boolean }) {
  const { user } = useAuth(),
    { language } = useLanguageContext();
  const manager = preschoolManagers.includes(user?.role || '');
  const router = useRouter(), pathname = usePathname();
  const syncSection = useCallback((section: string | null) => {
    const allowed = preschoolSectionsFor(user?.role || '');
    setView(allowed.includes(section as View) ? section as View : 'daily');
  }, [user?.role]);
  const selectView = (tab: View) => {
    setView(tab);
    const query = new URLSearchParams(window.location.search);
    query.set('section', tab);
    router.push(pathname + '?' + query.toString(), { scroll: false });
  };
  const [options, setOptions] = useState<PreschoolOptions>(emptyPreschoolOptions),
    [classId, setClass] = useState(''),
    [studentId, setStudent] = useState(''),
    [roster, setRoster] = useState<PreschoolChild[]>([]),
    [pickupVerification, setPickupVerification] = useState<'OPTIONAL' | 'REQUIRED'>('OPTIONAL'),
    [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0),
    [view, setView] = useState<View>('daily'),
    [child, setChild] = useState<PreschoolChildView | null>(null),
    [refresh, setRefresh] = useState(0),
    [loading, setLoading] = useState(true),
    [rosterLoading, setRosterLoading] = useState(false),
    [childLoading, setChildLoading] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [print, setPrint] = useState<Content | null>(null),
    [selectedIds, setSelectedIds] = useState<string[]>([]),
    [copilotHistoryByClass, setCopilotHistoryByClass] = useState<
      Record<string, PreschoolCopilotMessage[]>
    >({}),
    [pendingContentEdit, setPendingContentEdit] = useState<{
      content: Content;
      sourceLabel?: string;
    } | null>(null);
  const working = useRef(false);
  const consumePendingContentEdit = useCallback(() => setPendingContentEdit(null), []);
  const copilotStorageKey =
    !family && user?.id && classId ? `krypton.preschool.inky.${user.id}.${classId}` : '';
  useEffect(() => {
    if (!copilotStorageKey) return;
    setCopilotHistoryByClass((current) => {
      if (current[classId] !== undefined) return current;
      try {
        const raw = window.sessionStorage.getItem(copilotStorageKey);
        if (!raw) return { ...current, [classId]: [] };
        const parsed = JSON.parse(raw);
        return { ...current, [classId]: Array.isArray(parsed) ? parsed.slice(-40) : [] };
      } catch {
        return { ...current, [classId]: [] };
      }
    });
  }, [classId, copilotStorageKey]);
  const updateCopilotMessages = useCallback(
    (updater: (prev: PreschoolCopilotMessage[]) => PreschoolCopilotMessage[]) => {
      if (!classId) return;
      setCopilotHistoryByClass((current) => {
        const prev = current[classId] ?? [];
        const next = updater(prev).slice(-40);
        if (copilotStorageKey) {
          try {
            if (next.length === 0) window.sessionStorage.removeItem(copilotStorageKey);
            else window.sessionStorage.setItem(copilotStorageKey, JSON.stringify(next));
          } catch {
            // Ignore storage quota or private browsing errors
          }
        }
        return { ...current, [classId]: next };
      });
    },
    [classId, copilotStorageKey]
  );
  useEffect(() => {
    if (!family) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setRefresh((value) => value + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, [family]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiClient
      .get<PreschoolOptions>('/preschool/options', { signal: controller.signal })
      .then(({ data }) => {
        setOptions(data);
        setFrom(
          (current) =>
            current ||
            new Date(new Date(data.today + 'T00:00:00Z').getTime() - 29 * 86400000)
              .toISOString()
              .slice(0, 10)
        );
        setTo((current) => current || data.today);
        if (family)
          setStudent((current) =>
            data.students.some((s) => s.id === current) ? current : data.students[0]?.id || ''
          );
        else {
          const eligible = data.classes.filter(
            (c) => c.educationLevel === 'PRE_PRIMARY' && c.school.programme !== 'STANDARD'
          );
          setClass((current) =>
            eligible.some((c) => c.id === current) ? current : eligible[0]?.id || ''
          );
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setOptions(emptyPreschoolOptions);
          setClass('');
          setStudent('');
          setError(messageFor(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [family, refresh]);
  useEffect(() => {
    if (family || !classId) return;
    const controller = new AbortController();
    setRosterLoading(true);
    setRoster([]);
    setChild(null);
    apiClient
      .get('/preschool/classes/' + classId + '/roster', {
        params: { offset },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setRoster(data.students);
        setPickupVerification(data.pickupVerification === 'REQUIRED' ? 'REQUIRED' : 'OPTIONAL');
        setTotal(data.total);
        const visibleIds = new Set(data.students.map((s: PreschoolChild) => s.id));
        setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
        setStudent((current) =>
          data.students.some((s: PreschoolChild) => s.id === current)
            ? current
            : data.students[0]?.id || ''
        );
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setStudent('');
          setError(messageFor(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRosterLoading(false);
      });
    return () => controller.abort();
  }, [classId, family, offset, refresh]);
  useEffect(() => {
    if (!studentId || !from || !to) {
      setChild(null);
      return;
    }
    const controller = new AbortController();
    setChildLoading(true);
    setChild(null);
    apiClient
      .get<PreschoolChildView>('/preschool/students/' + studentId, {
        params: { from, to },
        signal: controller.signal,
      })
      .then(({ data }) => setChild(data))
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setChildLoading(false);
      });
    return () => controller.abort();
  }, [studentId, from, to, refresh]);
  const action: PreschoolAction = useCallback(async (path, data, method = 'post') => {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response =
        method === 'delete'
          ? await apiClient.delete('/preschool' + path)
          : await apiClient[method]('/preschool' + path, data);
      if (
        path.startsWith('/schools/') ||
        (method === 'patch' && path.startsWith('/classes/')) ||
        path === '/staff-assignments'
      )
        window.dispatchEvent(new Event('preschool-configuration-changed'));
      const result = response?.data as
        | {
          checkedInCount?: number;
          updatedCount?: number;
          skippedCount?: number;
          sharedWithParents?: boolean;
        }
        | undefined;
      if (path.endsWith('/check-in/bulk') && typeof result?.checkedInCount === 'number') {
        const count = result.checkedInCount;
        const skipped = result.skippedCount || 0;
        setNotice(
          count === 0
            ? 'All selected children were already checked in today.'
            : `Checked in ${count} ${count === 1 ? 'child' : 'children'}${skipped ? ` (${skipped} already checked in)` : ''
            }.`
        );
      } else if (path.endsWith('/care/bulk') && typeof result?.updatedCount === 'number') {
        const count = result.updatedCount;
        const skipped = result.skippedCount || 0;
        setNotice(
          count === 0
            ? 'No children matched the bulk update selection.'
            : `Updated daily care for ${count} ${count === 1 ? 'child' : 'children'}${result.sharedWithParents ? ' and shared with parents' : ''
            }${skipped ? ` (${skipped} skipped)` : ''}.`
        );
      } else {
        setNotice('Saved successfully.');
      }
      setRefresh((v) => v + 1);
      return true;
    } catch (err) {
      setError(messageFor(err));
      return false;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }, []);
  const selected = roster.find((s) => s.id === studentId);
  const uncheckedOnPage = roster.filter((s) => !s.day?.checkInAt && !s.day?.checkOutAt);
  const checkedInOnPage = roster.filter((s) => !!s.day?.checkInAt);
  const selectedUncheckedIds = selectedIds.filter((id) =>
    uncheckedOnPage.some((s) => s.id === id)
  );
  const allSelectedOnPage =
    roster.length > 0 && roster.every((s) => selectedIds.includes(s.id));
  const toggleSelected = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  const eligible = options.classes.filter(
    (c) => c.educationLevel === 'PRE_PRIMARY' && c.school.programme !== 'STANDARD'
  );
  const tabs: View[] = preschoolSectionsFor(user?.role || '');
  const title =
    language === 'ml' ? 'പ്ലേസ്കൂൾ' : language === 'hi' ? 'प्लेस्कूल' : 'Preschool workspace';
  const hasSchool = family ? !!studentId : !!classId;
  return (
    <>
      <Suspense fallback={null}><PreschoolSectionLocation onChange={syncSection} /></Suspense>
      <PageHeading
        eyebrow="EARLY YEARS"
        title={title}
        description={
          family
            ? 'Your child’s day, discoveries and classroom updates.'
            : 'A caring daily routine, playful learning and development observations.'
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={15} />}
            disabled={busy || loading}
            onClick={() => setRefresh((v) => v + 1)}
          >
            Refresh
          </Button>
        }
      />
      {error && (
        <div className="state-box mb-4" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="state-box success mb-4" role="status">
          {notice}
        </div>
      )}
      <nav aria-label="Preschool sections" className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={view === tab ? 'primary' : 'outline'}
            aria-pressed={view === tab}
            disabled={busy}
            onClick={() => selectView(tab)}
          >
            {labels[tab]}
          </Button>
        ))}
      </nav>
      {loading && !options.today ? (
        <p role="status">Loading preschool workspace…</p>
      ) : (
        <>
          {view === 'settings' && manager ? (
            <PreschoolSettings options={options} action={action} busy={busy} />
          ) : !hasSchool ? (
            <EmptyState
              title={
                family ? 'No preschool child linked yet' : 'Preschool mode is ready to configure'
              }
              description={
                family
                  ? 'Your school can link your child to your parent account.'
                  : manager
                    ? 'Enable preschool or combined mode in School setup, then select the relevant classes and teachers.'
                    : 'Ask the school administrator to enable preschool mode and assign your teaching classes.'
              }
            />
          ) : (
            <div className="content-stack">
              <div className="panel panel-body">
                <div className="form-grid">
                  {!family && (
                    <Field label="Preschool class">
                      {(id) => (
                        <select
                          id={id}
                          value={classId}
                          disabled={busy}
                          onChange={(e) => {
                            setClass(e.target.value);
                            setStudent('');
                            setSelectedIds([]);
                            setPendingContentEdit(null);
                            setOffset(0);
                            setError('');
                            setNotice('');
                          }}
                        >
                          {eligible.map((c) => (
                            <option value={c.id} key={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  )}
                  {(family || ['daily', 'progress', 'photos'].includes(view)) && (
                    <Field label={family ? 'Your child' : 'Child'}>
                      {(id) => (
                        <select
                          id={id}
                          value={studentId}
                          disabled={busy || rosterLoading}
                          onChange={(e) => {
                            setStudent(e.target.value);
                            setError('');
                            setNotice('');
                          }}
                        >
                          {(family ? options.students : roster).map((s) => (
                            <option value={s.id} key={s.id}>
                              {s.firstName} {s.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  )}
                  {(family || ['progress', 'reports'].includes(view)) && (
                    <>
                      <Field label="From date">
                        {(id) => (
                          <input
                            id={id}
                            type="date"
                            required
                            value={from}
                            max={to}
                            onChange={(e) => setFrom(e.target.value)}
                          />
                        )}
                      </Field>
                      <Field label="To date">
                        {(id) => (
                          <input
                            id={id}
                            type="date"
                            required
                            value={to}
                            min={from}
                            onChange={(e) => setTo(e.target.value)}
                          />
                        )}
                      </Field>
                    </>
                  )}
                </div>
                <p className="text-sm muted mt-3">
                  School date: {options.today} · {options.timezone}
                </p>
                {!family && total > 50 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!offset || rosterLoading}
                      onClick={() => setOffset((v) => Math.max(0, v - 50))}
                    >
                      Previous children
                    </Button>
                    <span className="text-sm">
                      {offset + 1}–{Math.min(offset + 50, total)} of {total}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={offset + 50 >= total || rosterLoading}
                      onClick={() => setOffset((v) => v + 50)}
                    >
                      More children
                    </Button>
                  </div>
                )}
              </div>
              {view === 'daily' && !family && (
                <>
                  <div className="metric-grid preschool-metrics">
                    <StatCard
                      label="Children in class"
                      value={total}
                      note="Active enrolled children"
                      icon={Baby}
                    />
                    <StatCard
                      label="Checked in on this page"
                      value={roster.filter((s) => s.day?.checkInAt).length}
                      note={'Today · ' + options.today}
                      icon={ClipboardCheck}
                    />
                    <StatCard
                      label="Care shared on this page"
                      value={roster.filter((s) => s.day?.sharedAt).length}
                      note="Reviewed notes shared with families"
                      icon={Flower2}
                    />
                  </div>
                  <Panel
                    title="Today’s attendance"
                    subtitle="Check in individual children or the entire class in one click. Checkout requires an authorized guardian."
                  >
                    <div className="panel-body space-y-4">
                      {rosterLoading ? (
                        <p role="status">Loading class register…</p>
                      ) : !roster.length ? (
                        <EmptyState
                          title="No enrolled children"
                          description="Add students to this class in the student directory."
                        />
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  setSelectedIds(
                                    allSelectedOnPage ? [] : roster.map((s) => s.id)
                                  )
                                }
                              >
                                {allSelectedOnPage
                                  ? 'Clear selection'
                                  : `Select all (${roster.length})`}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || !uncheckedOnPage.length}
                                onClick={() =>
                                  setSelectedIds(uncheckedOnPage.map((s) => s.id))
                                }
                              >
                                Not checked in ({uncheckedOnPage.length})
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || !checkedInOnPage.length}
                                onClick={() =>
                                  setSelectedIds(checkedInOnPage.map((s) => s.id))
                                }
                              >
                                Checked in ({checkedInOnPage.length})
                              </Button>
                              {selectedIds.length > 0 && (
                                <span className="text-sm muted">
                                  {selectedIds.length} selected
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedUncheckedIds.length > 0 && (
                                <Button
                                  size="sm"
                                  leftIcon={<CheckCheck size={15} />}
                                  disabled={busy}
                                  onClick={async () => {
                                    if (
                                      await action('/classes/' + classId + '/check-in/bulk', {
                                        studentIds: selectedUncheckedIds,
                                      })
                                    )
                                      setSelectedIds([]);
                                  }}
                                >
                                  Check in selected ({selectedUncheckedIds.length})
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={selectedUncheckedIds.length > 0 ? 'outline' : 'primary'}
                                leftIcon={<CheckCheck size={15} />}
                                disabled={busy || (total <= roster.length && !uncheckedOnPage.length)}
                                onClick={async () => {
                                  if (await action('/classes/' + classId + '/check-in/bulk', {}))
                                    setSelectedIds([]);
                                }}
                              >
                                Check in all remaining
                                {total <= roster.length ? ` (${uncheckedOnPage.length})` : ''}
                              </Button>
                            </div>
                          </div>
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th className="w-10">
                                    <input
                                      type="checkbox"
                                      aria-label="Select all children on this page"
                                      checked={allSelectedOnPage}
                                      disabled={busy}
                                      onChange={() =>
                                        setSelectedIds(
                                          allSelectedOnPage ? [] : roster.map((s) => s.id)
                                        )
                                      }
                                    />
                                  </th>
                                  <th>Child</th>
                                  <th>Check-in</th>
                                  <th>Checkout</th>
                                  <th>Today’s care</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {roster.map((s) => (
                                  <tr key={s.id}>
                                    <td>
                                      <input
                                        type="checkbox"
                                        aria-label={`Select ${s.firstName} ${s.lastName}`}
                                        checked={selectedIds.includes(s.id)}
                                        disabled={busy}
                                        onChange={() => toggleSelected(s.id)}
                                      />
                                    </td>
                                    <td>
                                      {s.firstName} {s.lastName}
                                    </td>
                                    <td>{timeLabel(s.day?.checkInAt, options.timezone)}</td>
                                    <td>{timeLabel(s.day?.checkOutAt, options.timezone)}</td>
                                    <td>
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {s.day?.mood && s.day.mood !== 'NOT_RECORDED' && (
                                          <StatusPill value={s.day.mood} />
                                        )}
                                        {s.day?.sharedAt ? (
                                          <StatusPill value="Shared" />
                                        ) : s.day?.meals ||
                                          s.day?.sleepMinutes != null ||
                                          (s.day?.mood && s.day.mood !== 'NOT_RECORDED') ||
                                          s.day?.notes ? (
                                          <StatusPill value="Draft" />
                                        ) : (
                                          <span className="muted">—</span>
                                        )}
                                        {s.day?.meals && (
                                          <span
                                            className="muted max-w-44 truncate"
                                            title={s.day.meals}
                                          >
                                            {s.day.meals}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="flex flex-wrap gap-2">
                                        {!s.day?.checkInAt && (
                                          <Button
                                            size="sm"
                                            disabled={busy}
                                            onClick={() =>
                                              void action('/students/' + s.id + '/check-in')
                                            }
                                          >
                                            Check in {s.firstName}
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={busy}
                                          onClick={() => setStudent(s.id)}
                                        >
                                          Care & pickup for {s.firstName}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  </Panel>
                  {roster.length > 0 && (
                    <PreschoolBulkCareForm
                      key={'bulk-' + classId}
                      classId={classId}
                      roster={roster}
                      total={total}
                      selectedIds={selectedIds}
                      busy={busy}
                      action={action}
                      onClearSelection={() => setSelectedIds([])}
                    />
                  )}
                  {selected && (
                    <PreschoolCareForm
                      key={selected.id + '-' + (selected.day?.version || 0)}
                      child={selected}
                      busy={busy}
                      action={action}
                      pickupVerification={pickupVerification}
                      timezone={options.timezone}
                    />
                  )}
                  {manager && selected && (
                    <Panel
                      title="Pickup permissions"
                      subtitle="The office controls which linked guardians may collect this child."
                    >
                      <div className="panel-body space-y-4">
                        {selected.guardianLinks.map((link) => (
                          <label className="flex gap-3 items-start" key={link.guardianId}>
                            <input
                              type="checkbox"
                              checked={link.canPickup !== false}
                              disabled={busy}
                              onChange={(event) =>
                                void action(
                                  '/students/' +
                                  selected.id +
                                  '/guardians/' +
                                  link.guardianId +
                                  '/pickup',
                                  { canPickup: event.target.checked },
                                  'patch'
                                )
                              }
                            />
                            {link.guardian.firstName} {link.guardian.lastName} may collect{' '}
                            {selected.firstName}
                          </label>
                        ))}
                        {!selected.guardianLinks.length && (
                          <p>
                            Link a guardian to this child through the school office before enabling
                            pickup.
                          </p>
                        )}
                      </div>
                    </Panel>
                  )}
                </>
              )}
              {view === 'daily' &&
                family &&
                (childLoading ? (
                  <p role="status">Loading your child’s updates…</p>
                ) : (
                  child && (
                    <>
                      <PreschoolParentPickupPass
                        studentId={child.student.id}
                        studentName={child.student.firstName}
                        timezone={options.timezone}
                        refresh={refresh}
                      />
                      <Panel
                        title={child.student.firstName + '’s school updates'}
                        subtitle={child.student.className}
                      >
                        <div className="panel-body space-y-4">
                          <Link href="/parent/transport" className="panel-link">
                            View your child’s bus journey
                          </Link>
                          {!child.activities.length ? (
                            <EmptyState title="No updates yet" />
                          ) : (
                            child.activities.map((a) => (
                              <article key={a.id} className="border rounded-xl p-4">
                                <h3 className="font-semibold">{a.title}</h3>
                                <p className="whitespace-pre-wrap mt-2">{a.description}</p>
                                <p className="text-xs muted mt-2">
                                  {new Date(a.createdAt).toLocaleString('en-IN', {
                                    timeZone: options.timezone,
                                  })}
                                </p>
                              </article>
                            ))
                          )}
                        </div>
                      </Panel>
                      <PreschoolChildHistory
                        view={{ ...child, observations: [] }}
                        timezone={options.timezone}
                      />
                    </>
                  )
                ))}
              {view === 'learning' && !family && (
                <PreschoolContent
                  key={classId}
                  classId={classId}
                  today={options.today}
                  language={
                    language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English'
                  }
                  refresh={refresh}
                  busy={busy}
                  action={action}
                  initialEdit={pendingContentEdit}
                  onConsumeInitialEdit={consumePendingContentEdit}
                />
              )}
              {view === 'copilot' && !family && (
                <PreschoolCopilot
                  key={classId}
                  classId={classId}
                  className={eligible.find((c) => c.id === classId)?.name}
                  stage={eligible.find((c) => c.id === classId)?.preschoolStage}
                  today={options.today}
                  timezone={options.timezone}
                  language={
                    language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English'
                  }
                  messages={copilotHistoryByClass[classId] ?? []}
                  onMessagesChange={updateCopilotMessages}
                  onDraftCreated={(created, sourceLabel) => {
                    setError('');
                    setNotice(
                      'Saved INKY suggestion as a draft in Activities & plans. Review and adapt before publishing to families.'
                    );
                    setPendingContentEdit({ content: created, sourceLabel });
                    setRefresh((v) => v + 1);
                    selectView('learning');
                  }}
                  onOpenDraft={(existing, sourceLabel) => {
                    setError('');
                    setPendingContentEdit({ content: existing, sourceLabel });
                    selectView('learning');
                  }}
                />
              )}
              {view === 'learning' && family && child && (
                <Panel
                  title="Your child’s playful learning"
                  subtitle="Teacher-reviewed activities and plans for the selected dates."
                >
                  <div className="panel-body space-y-4">
                    {!child.content.length ? (
                      <EmptyState title="No published plans for this period" />
                    ) : (
                      child.content.map((item) => (
                        <article className="border rounded-xl p-4 space-y-3" key={item.id}>
                          <h3 className="font-semibold flex items-center gap-2">
                            <Sparkles size={16} />
                            {item.title}
                          </h3>
                          <p className="text-sm muted">
                            {dateLabel(item.scheduledOn || undefined)} · {item.language}
                          </p>
                          <p className="whitespace-pre-wrap">{item.body}</p>
                          <Button variant="outline" size="sm" onClick={() => setPrint(item)}>
                            Printable sheet
                          </Button>
                        </article>
                      ))
                    )}
                  </div>
                </Panel>
              )}
              {view === 'progress' && studentId && (
                <>
                  {!family && (
                    <PreschoolObservationForm
                      key={studentId}
                      studentId={studentId}
                      today={options.today}
                      busy={busy}
                      action={action}
                    />
                  )}
                  <div>
                    {childLoading ? (
                      <p role="status">Loading observations…</p>
                    ) : (
                      child && (
                        <PreschoolChildHistory
                          view={{ ...child, days: [] }}
                          timezone={options.timezone}
                        />
                      )
                    )}
                  </div>
                </>
              )}
              {view === 'photos' && studentId && (
                <PreschoolPhotos
                  key={studentId}
                  studentId={studentId}
                  family={family}
                  refresh={refresh}
                  busy={busy}
                  notify={() => {
                    setRefresh((v) => v + 1);
                    setNotice('Photo shared with the family.');
                  }}
                />
              )}
              {view === 'cameras' && (
                <PreschoolCameras
                  key={family ? studentId : classId}
                  family={family}
                  manager={manager}
                  classId={
                    family
                      ? options.students.find((s) => s.id === studentId)?.currentClassId || ''
                      : classId
                  }
                  studentId={studentId}
                  timezone={options.timezone}
                  refresh={refresh}
                  action={action}
                  busy={busy}
                />
              )}
              {view === 'reports' && !family && (
                <PreschoolReports classId={classId} from={from} to={to} refresh={refresh} />
              )}
            </div>
          )}
        </>
      )}
      {print && <PreschoolPrint content={print} close={() => setPrint(null)} />}
    </>
  );
}
