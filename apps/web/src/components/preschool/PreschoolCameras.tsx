'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import { type PreschoolAction, type PreschoolCamera } from '@/lib/preschool';
import { messageFor } from '@/lib/workspace';
import { Panel, EmptyState } from '../WorkspaceUI';
import { Button } from '../ui';
import { Field, PreschoolText } from './PreschoolFields';
const time = (minutes: number) =>
  String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
const minutes = (value: string) => Number(value.split(':')[0]) * 60 + Number(value.split(':')[1]);
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PreschoolCameras({
  classId,
  studentId,
  family,
  manager,
  timezone,
  refresh,
  action,
  busy,
}: {
  classId: string;
  studentId: string;
  family: boolean;
  manager: boolean;
  timezone: string;
  refresh: number;
  action: PreschoolAction;
  busy: boolean;
}) {
  const [cameras, setCameras] = useState<PreschoolCamera[]>([]),
    [consent, setConsent] = useState(false),
    [configured, setConfigured] = useState(false),
    [error, setError] = useState(''),
    [session, setSession] = useState<{ url: string; expiresAt: string; label: string } | null>(
      null
    ),
    [viewing, setViewing] = useState(false),
    [localRefresh, setLocalRefresh] = useState(0),
    [editing, setEditing] = useState('');
  const initial = {
    classId,
    label: '',
    externalCameraRef: '',
    enabled: false,
    parentAccess: false,
    weekdays: [1, 2, 3, 4, 5],
    startMinute: 540,
    endMinute: 720,
  };
  const [form, setForm] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setCameras([]);
    apiClient
      .get(
        family
          ? '/preschool/students/' + studentId + '/cameras'
          : '/preschool/classes/' + classId + '/cameras',
        { signal: controller.signal }
      )
      .then(({ data }) => {
        setCameras(data.cameras);
        setConsent(data.consent || false);
        setConfigured(data.gatewayConfigured || false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [classId, studentId, family, refresh, localRefresh]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => {
        setSession(null);
        setLocalRefresh((v) => v + 1);
      },
      Math.max(0, new Date(session.expiresAt).getTime() - Date.now())
    );
    return () => clearTimeout(timer);
  }, [session]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (
      await action('/cameras' + (editing ? '/' + editing : ''), form, editing ? 'patch' : 'post')
    ) {
      setForm(initial);
      setEditing('');
    }
  }
  async function changeConsent(value: boolean) {
    setSession(null);
    setConsent(value);
    if (!(await action('/students/' + studentId + '/camera-consent', { consent: value })))
      setConsent(!value);
  }
  async function open(camera: PreschoolCamera) {
    setError('');
    setViewing(true);
    try {
      const { data } = await apiClient.post(
        '/preschool/students/' + studentId + '/cameras/' + camera.id + '/session'
      );
      setSession(data);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setViewing(false);
    }
  }
  return (
    <div className="content-stack">
      {error && (
        <div className="state-box" role="alert">
          {error}
        </div>
      )}
      <Panel
        title="Classroom camera access"
        subtitle={
          'Viewing hours use ' + timezone + '. Each viewing session lasts up to two minutes.'
        }
      >
        <div className="panel-body space-y-4">
          {family && (
            <>
              <p className="text-sm">
                View your child’s classroom only during the school’s permitted hours. Do not record
                or redistribute footage. Withdrawing consent stops new sessions; an already issued
                session expires within two minutes.
              </p>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={busy || viewing}
                  onChange={(e) => void changeConsent(e.target.checked)}
                />
                I agree to the classroom viewing conditions
              </label>
            </>
          )}
          {!family && !configured && (
            <p className="state-box">
              The school’s camera gateway is not configured. Camera entries can be saved disabled
              until it is connected.
            </p>
          )}
          {!cameras.length ? (
            <EmptyState
              title="No classroom cameras available"
              description="The school can configure a classroom camera and permitted viewing hours."
            />
          ) : (
            cameras.map((camera) => (
              <article className="border rounded-xl p-4 space-y-3" key={camera.id}>
                <h3 className="font-semibold">{camera.label}</h3>
                <p className="text-sm muted">
                  {camera.weekdays.map((d) => days[d]).join(', ')} · {time(camera.startMinute)}–
                  {time(camera.endMinute)}
                </p>
                {family ? (
                  <Button
                    size="sm"
                    disabled={busy || viewing || !consent || !camera.available}
                    onClick={() => void open(camera)}
                  >
                    {camera.available ? 'View classroom' : 'Viewing currently unavailable'}
                  </Button>
                ) : (
                  <>
                    <p className="text-sm">
                      {camera.enabled ? 'Enabled' : 'Disabled'} ·{' '}
                      {camera.parentAccess ? 'Parent viewing allowed' : 'Staff only'}
                    </p>
                    {manager && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(camera.id);
                          setForm({
                            classId,
                            label: camera.label,
                            externalCameraRef: camera.externalCameraRef || '',
                            enabled: !!camera.enabled,
                            parentAccess: !!camera.parentAccess,
                            weekdays: camera.weekdays,
                            startMinute: camera.startMinute,
                            endMinute: camera.endMinute,
                          });
                        }}
                      >
                        Edit camera access
                      </Button>
                    )}
                  </>
                )}
              </article>
            ))
          )}
          {session && (
            <section className="space-y-3">
              <h3 className="font-semibold">{session.label}</h3>
              <iframe
                title={session.label + ' secure classroom viewer'}
                src={session.url}
                className="w-full h-80 rounded-xl border"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
                allow="autoplay; fullscreen"
              />
              <p className="text-sm muted">
                Session expires at{' '}
                {new Date(session.expiresAt).toLocaleTimeString('en-IN', { timeZone: timezone })}.
              </p>
              <Button variant="outline" onClick={() => setSession(null)}>
                Close camera viewer
              </Button>
            </section>
          )}
        </div>
      </Panel>
      {manager && !family && (
        <Panel
          title={editing ? 'Update classroom camera' : 'Add classroom camera'}
          subtitle="Use the camera reference supplied by your streaming gateway."
        >
          <form className="panel-body space-y-4" onSubmit={save}>
            <div className="form-grid">
              <PreschoolText
                label="Camera label"
                value={form.label}
                onChange={(v) => setForm((c) => ({ ...c, label: v }))}
                maxLength={120}
              />
              <PreschoolText
                label="Gateway camera reference"
                value={form.externalCameraRef}
                onChange={(v) => setForm((c) => ({ ...c, externalCameraRef: v }))}
                maxLength={100}
              />
              <Field label="Viewing starts">
                {(id) => (
                  <input
                    id={id}
                    type="time"
                    required
                    value={time(form.startMinute)}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, startMinute: minutes(e.target.value) }))
                    }
                  />
                )}
              </Field>
              <Field label="Viewing ends">
                {(id) => (
                  <input
                    id={id}
                    type="time"
                    required
                    value={time(form.endMinute)}
                    onChange={(e) => setForm((c) => ({ ...c, endMinute: minutes(e.target.value) }))}
                  />
                )}
              </Field>
            </div>
            <fieldset>
              <legend className="mb-2 font-medium">Viewing days</legend>
              <div className="flex flex-wrap gap-4">
                {days.map((day, n) => (
                  <label key={day} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={form.weekdays.includes(n)}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          weekdays: e.target.checked
                            ? [...c.weekdays, n]
                            : c.weekdays.filter((d) => d !== n),
                        }))
                      }
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex gap-3 items-start">
              <input
                type="checkbox"
                checked={form.enabled}
                disabled={!configured}
                onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.checked }))}
              />
              Enable this camera
            </label>
            <label className="flex gap-3 items-start">
              <input
                type="checkbox"
                checked={form.parentAccess}
                onChange={(e) => setForm((c) => ({ ...c, parentAccess: e.target.checked }))}
              />
              Allow parents of children in this classroom to request viewing sessions
            </label>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!form.weekdays.length || form.startMinute >= form.endMinute}
                isLoading={busy}
              >
                Save camera settings
              </Button>
              {editing && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing('');
                    setForm(initial);
                  }}
                >
                  Cancel camera editing
                </Button>
              )}
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
