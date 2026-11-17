'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Baby, ClipboardCheck, Flower2, RefreshCw, Sparkles } from 'lucide-react';
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
  type PreschoolOptions,
} from '@/lib/preschool';
import { messageFor, dateLabel } from '@/lib/workspace';
import { Button } from './ui';
import { EmptyState, PageHeading, Panel, StatCard } from './WorkspaceUI';
import { PreschoolContent, PreschoolPrint } from './preschool/PreschoolContent';
import {
  PreschoolCareForm,
  PreschoolChildHistory,
  PreschoolObservationForm,
  PreschoolPhotos,
} from './preschool/PreschoolDaily';
import { PreschoolCameras } from './preschool/PreschoolCameras';
import { PreschoolSettings } from './preschool/PreschoolSettings';
import { PreschoolReports } from './preschool/PreschoolReports';
import { Field } from './preschool/PreschoolFields';
import { PreschoolCopilot } from './preschool/PreschoolCopilot';

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
  const [options, setOptions] = useState<PreschoolOptions>(emptyPreschoolOptions),
    [classId, setClass] = useState(''),
    [studentId, setStudent] = useState(''),
    [roster, setRoster] = useState<PreschoolChild[]>([]),
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
    [print, setPrint] = useState<Content | null>(null);
  const working = useRef(false);
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
        setTotal(data.total);
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
      await apiClient[method]('/preschool' + path, data);
      if (
        path.startsWith('/schools/') ||
        path.startsWith('/classes/') ||
        path === '/staff-assignments'
      )
        window.dispatchEvent(new Event('preschool-configuration-changed'));
      setNotice('Saved successfully.');
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
  const eligible = options.classes.filter(
    (c) => c.educationLevel === 'PRE_PRIMARY' && c.school.programme !== 'STANDARD'
  );
  const tabs: View[] = family
    ? ['daily', 'learning', 'progress', 'photos', 'cameras']
    : [
        'daily',
        'learning',
        'copilot',
        'progress',
        'photos',
        'cameras',
        'reports',
        ...(manager ? ['settings' as View] : []),
      ];
  const title =
    language === 'ml' ? 'പ്ലേസ്കൂൾ' : language === 'hi' ? 'प्लेस्कूल' : 'Preschool workspace';
  const hasSchool = family ? !!studentId : !!classId;
  return (
    <>
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
            onClick={() => setView(tab)}
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
                    subtitle="Check in each child when they arrive. Checkout requires an authorized guardian."
                  >
                    <div className="panel-body">
                      {rosterLoading ? (
                        <p role="status">Loading class register…</p>
                      ) : !roster.length ? (
                        <EmptyState
                          title="No enrolled children"
                          description="Add students to this class in the student directory."
                        />
                      ) : (
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Child</th>
                                <th>Check-in</th>
                                <th>Checkout</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roster.map((s) => (
                                <tr key={s.id}>
                                  <td>
                                    {s.firstName} {s.lastName}
                                  </td>
                                  <td>{timeLabel(s.day?.checkInAt, options.timezone)}</td>
                                  <td>{timeLabel(s.day?.checkOutAt, options.timezone)}</td>
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
                      )}
                    </div>
                  </Panel>
                  {selected && (
                    <PreschoolCareForm
                      key={selected.id + '-' + (selected.day?.version || 0)}
                      child={selected}
                      busy={busy}
                      action={action}
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
                />
              )}
              {view === 'copilot' && !family && (
                <PreschoolCopilot
                  key={classId}
                  classId={classId}
                  language={
                    language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English'
                  }
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
