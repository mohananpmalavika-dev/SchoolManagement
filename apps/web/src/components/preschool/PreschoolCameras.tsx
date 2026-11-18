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

type GatewayVendor = 'hikvision' | 'dahua' | 'cpplus' | 'rtsp' | 'push';

const vendorLabels: Record<GatewayVendor, string> = {
  hikvision: 'Hikvision NVR (RTSP Pull)',
  dahua: 'Dahua NVR (RTSP Pull)',
  cpplus: 'CP Plus NVR (RTSP Pull)',
  rtsp: 'Custom RTSP / ONVIF URL',
  push: 'OM Edge Bridge (SRT Push — CGNAT)',
};

interface GatewayFormState {
  syncToGateway: boolean;
  vendor: GatewayVendor;
  host: string;
  port: string;
  channel: string;
  stream: 'sub' | 'main';
  username: string;
  password: string;
  rtspUrl: string;
  rtspPath: string;
  rtspTransport: 'tcp' | 'udp';
  tls: boolean;
  sourceOnDemand: boolean;
  publishSecret: string;
  hasExistingPassword: boolean;
  hasExistingRtspUrl: boolean;
}

const emptyGatewayForm: GatewayFormState = {
  syncToGateway: true,
  vendor: 'hikvision',
  host: '',
  port: '554',
  channel: '1',
  stream: 'sub',
  username: '',
  password: '',
  rtspUrl: '',
  rtspPath: '',
  rtspTransport: 'tcp',
  tls: false,
  sourceOnDemand: true,
  publishSecret: '',
  hasExistingPassword: false,
  hasExistingRtspUrl: false,
};

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
    [gatewayReachable, setGatewayReachable] = useState(false),
    [gatewayHttpsEnforced, setGatewayHttpsEnforced] = useState(true),
    [gatewayMediamtx, setGatewayMediamtx] = useState<string | null>(null),
    [gatewayRegistryWritable, setGatewayRegistryWritable] = useState<boolean | null>(null),
    [gatewayError, setGatewayError] = useState<string | null>(null),
    [error, setError] = useState(''),
    [session, setSession] = useState<{ url: string; expiresAt: string; label: string } | null>(
      null
    ),
    [viewing, setViewing] = useState(false),
    [localRefresh, setLocalRefresh] = useState(0),
    [editing, setEditing] = useState(''),
    [confirmDeleteId, setConfirmDeleteId] = useState('');

  const createInitialForm = (targetClassId: string) => ({
    classId: targetClassId,
    label: '',
    externalCameraRef: '',
    enabled: false,
    parentAccess: false,
    weekdays: [1, 2, 3, 4, 5],
    startMinute: 540,
    endMinute: 720,
  });

  const [form, setForm] = useState(() => createInitialForm(classId));
  const [gwForm, setGwForm] = useState<GatewayFormState>(emptyGatewayForm);

  useEffect(() => {
    setForm((current) => ({ ...current, classId }));
    setEditing('');
    setConfirmDeleteId('');
  }, [classId]);

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
        setConfigured(Boolean(data.gatewayConfigured));
        setGatewayReachable(Boolean(data.gatewayReachable));
        setGatewayHttpsEnforced(data.gatewayHttpsEnforced !== false);
        setGatewayMediamtx(data.gatewayMediamtx || null);
        setGatewayRegistryWritable(
          typeof data.gatewayRegistryWritable === 'boolean' ? data.gatewayRegistryWritable : null
        );
        setGatewayError(data.gatewayError || null);
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

  function resetForm() {
    setForm(createInitialForm(classId));
    setGwForm(emptyGatewayForm);
    setEditing('');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form, classId };
    if (configured && gwForm.syncToGateway) {
      const stream: Record<string, unknown> = {
        vendor: gwForm.vendor,
        mode: gwForm.vendor === 'push' ? 'push' : 'pull',
      };
      if (gwForm.vendor === 'push') {
        if (gwForm.publishSecret.trim()) stream.publishSecret = gwForm.publishSecret.trim();
      } else if (gwForm.vendor === 'rtsp') {
        if (gwForm.rtspUrl.trim()) stream.rtspUrl = gwForm.rtspUrl.trim();
        stream.rtspTransport = gwForm.rtspTransport;
        stream.sourceOnDemand = gwForm.sourceOnDemand;
      } else {
        stream.host = gwForm.host.trim();
        stream.port = Number(gwForm.port) || 554;
        stream.channel = Number(gwForm.channel) || 1;
        stream.stream = gwForm.stream;
        if (gwForm.username.trim()) stream.username = gwForm.username.trim();
        if (gwForm.password) stream.password = gwForm.password;
        if (gwForm.rtspPath.trim()) stream.rtspPath = gwForm.rtspPath.trim();
        stream.rtspTransport = gwForm.rtspTransport;
        stream.tls = gwForm.tls;
        stream.sourceOnDemand = gwForm.sourceOnDemand;
      }
      payload.gatewayStream = stream;
    }
    if (
      await action('/cameras' + (editing ? '/' + editing : ''), payload, editing ? 'patch' : 'post')
    ) {
      resetForm();
      setLocalRefresh((v) => v + 1);
    }
  }

  async function removeCamera(cameraId: string) {
    if (await action('/cameras/' + cameraId, undefined, 'delete')) {
      if (editing === cameraId) resetForm();
      setConfirmDeleteId('');
      setLocalRefresh((v) => v + 1);
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

  const isPullNvr =
    gwForm.vendor === 'hikvision' || gwForm.vendor === 'dahua' || gwForm.vendor === 'cpplus';

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
            <div className="state-box space-y-1">
              <p className="font-medium">CCTV gateway is not configured yet.</p>
              <p className="text-sm muted">
                Camera entries can be saved disabled until the gateway is connected. Run{' '}
                <code>./deploy-oci.sh --domain your.school.edu.in --email admin@school.edu.in</code>{' '}
                (HTTPS production) or <code>./deploy-oci.sh --enable-http-cctv</code> (HTTP IP
                testing) on OCI to activate live camera sync.
              </p>
            </div>
          )}
          {!family && configured && (
            <div className="border rounded-xl p-3 text-sm space-y-1">
              <p className="font-medium">
                Gateway status:{' '}
                {gatewayReachable
                  ? gatewayMediamtx === 'reachable'
                    ? 'Connected (Gateway + MediaMTX online)'
                    : 'Gateway online (MediaMTX starting or unreachable)'
                  : 'Configured, currently unreachable'}
                {!gatewayHttpsEnforced && ' · HTTP testing mode'}
              </p>
              {gatewayError && <p className="text-sm muted">{gatewayError}</p>}
              {gatewayReachable && gatewayRegistryWritable === false && (
                <p className="text-sm muted">
                  Warning: <code>cameras.json</code> is mounted read-only in Docker. Remove{' '}
                  <code>:ro</code> on the <code>cctv-gateway</code> volume to allow UI camera sync.
                </p>
              )}
              {!gatewayHttpsEnforced && (
                <p className="text-sm muted">
                  Running with <code>CCTV_ALLOW_INSECURE_HTTP=true</code>. Attach a domain + Let’s
                  Encrypt SSL (<code>oci-nginx-ssl.conf</code>) and open OCI ports{' '}
                  <code>8189/udp</code>, <code>8189/tcp</code>, <code>8890/udp</code> for encrypted
                  parent mobile WebRTC streaming.
                </p>
              )}
            </div>
          )}
          {!cameras.length ? (
            <EmptyState
              title="No classroom cameras available"
              description="The school can configure a classroom camera and permitted viewing hours."
            />
          ) : (
            cameras.map((camera) => (
              <article className="border rounded-xl p-4 space-y-3" key={camera.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{camera.label}</h3>
                  {!family && configured && (
                    <span className="text-xs px-2 py-1 rounded-full border">
                      {camera.gatewayRegistered
                        ? `Gateway synced · ${camera.gatewayStream?.vendor?.toUpperCase() || 'READY'}`
                        : 'Not registered in gateway yet'}
                    </span>
                  )}
                </div>
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
                      {camera.externalCameraRef ? ` · Ref: ${camera.externalCameraRef}` : ''}
                    </p>
                    {camera.gatewayStream && (
                      <p className="text-xs muted break-all">
                        Stream:{' '}
                        <code>
                          {camera.gatewayStream.mode === 'push'
                            ? `SRT Push (${camera.gatewayStream.streamPath})`
                            : camera.gatewayStream.redactedSourceUrl}
                        </code>
                      </p>
                    )}
                    {manager && (
                      <div className="flex flex-wrap gap-2">
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
                            const gs = camera.gatewayStream;
                            if (gs) {
                              setGwForm({
                                syncToGateway: true,
                                vendor: gs.vendor,
                                host: gs.host || '',
                                port: String(gs.port || 554),
                                channel: String(gs.channel || 1),
                                stream: gs.stream === 'main' ? 'main' : 'sub',
                                username: gs.username || '',
                                password: '',
                                rtspUrl: '',
                                rtspPath: gs.rtspPath || '',
                                rtspTransport: gs.rtspTransport === 'udp' ? 'udp' : 'tcp',
                                tls: Boolean(gs.tls),
                                sourceOnDemand: gs.sourceOnDemand !== false,
                                publishSecret: '',
                                hasExistingPassword: Boolean(gs.hasPassword),
                                hasExistingRtspUrl: Boolean(gs.hasCustomRtspUrl),
                              });
                            } else {
                              setGwForm({ ...emptyGatewayForm, syncToGateway: configured });
                            }
                          }}
                        >
                          Edit camera access
                        </Button>
                        {confirmDeleteId === camera.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void removeCamera(camera.id)}
                            >
                              Confirm remove
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId('')}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setConfirmDeleteId(camera.id)}
                          >
                            Remove camera
                          </Button>
                        )}
                      </div>
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
          subtitle="Register the camera reference and optionally sync NVR / RTSP / Edge Bridge stream settings directly to the CCTV gateway (no SSH required)."
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

            <fieldset className="border rounded-xl p-4 space-y-4">
              <legend className="px-2 font-medium">CCTV Gateway Stream Registration</legend>
              <label className="flex gap-3 items-start">
                <input
                  type="checkbox"
                  checked={configured && gwForm.syncToGateway}
                  disabled={!configured}
                  onChange={(e) =>
                    setGwForm((g) => ({ ...g, syncToGateway: e.target.checked }))
                  }
                />
                <span>
                  Automatically sync NVR / stream settings to <code>cctv-gateway</code> &amp;
                  MediaMTX (credentials are sent directly to the gateway and never stored in the ERP
                  database)
                </span>
              </label>

              {configured && gwForm.syncToGateway && (
                <div className="space-y-4">
                  <div className="form-grid">
                    <Field label="NVR / Camera brand">
                      {(id) => (
                        <select
                          id={id}
                          value={gwForm.vendor}
                          onChange={(e) =>
                            setGwForm((g) => ({
                              ...g,
                              vendor: e.target.value as GatewayVendor,
                            }))
                          }
                        >
                          {(Object.keys(vendorLabels) as GatewayVendor[]).map((key) => (
                            <option key={key} value={key}>
                              {vendorLabels[key]}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>

                    {isPullNvr && (
                      <>
                        <Field label="NVR IP / Hostname">
                          {(id) => (
                            <input
                              id={id}
                              type="text"
                              required
                              placeholder="e.g. 10.8.0.20"
                              value={gwForm.host}
                              onChange={(e) => setGwForm((g) => ({ ...g, host: e.target.value }))}
                              maxLength={255}
                            />
                          )}
                        </Field>
                        <Field label="RTSP Port">
                          {(id) => (
                            <input
                              id={id}
                              type="number"
                              min={1}
                              max={65535}
                              value={gwForm.port}
                              onChange={(e) => setGwForm((g) => ({ ...g, port: e.target.value }))}
                            />
                          )}
                        </Field>
                        <Field label="NVR Channel">
                          {(id) => (
                            <input
                              id={id}
                              type="number"
                              min={1}
                              max={256}
                              value={gwForm.channel}
                              onChange={(e) =>
                                setGwForm((g) => ({ ...g, channel: e.target.value }))
                              }
                            />
                          )}
                        </Field>
                        <Field label="Stream Profile">
                          {(id) => (
                            <select
                              id={id}
                              value={gwForm.stream}
                              onChange={(e) =>
                                setGwForm((g) => ({
                                  ...g,
                                  stream: e.target.value as 'sub' | 'main',
                                }))
                              }
                            >
                              <option value="sub">Sub-stream (H.264 — recommended)</option>
                              <option value="main">Main stream (High bandwidth)</option>
                            </select>
                          )}
                        </Field>
                        <Field label="NVR Read-Only Username">
                          {(id) => (
                            <input
                              id={id}
                              type="text"
                              placeholder="e.g. krypton_view"
                              value={gwForm.username}
                              onChange={(e) =>
                                setGwForm((g) => ({ ...g, username: e.target.value }))
                              }
                              maxLength={120}
                            />
                          )}
                        </Field>
                        <Field label="NVR Password">
                          {(id) => (
                            <input
                              id={id}
                              type="password"
                              autoComplete="new-password"
                              placeholder={
                                gwForm.hasExistingPassword
                                  ? 'Leave blank to keep existing gateway password'
                                  : 'NVR viewer password'
                              }
                              value={gwForm.password}
                              onChange={(e) =>
                                setGwForm((g) => ({ ...g, password: e.target.value }))
                              }
                              maxLength={200}
                            />
                          )}
                        </Field>
                        <Field label="Custom RTSP Path (optional)">
                          {(id) => (
                            <input
                              id={id}
                              type="text"
                              placeholder="Leave blank for vendor default"
                              value={gwForm.rtspPath}
                              onChange={(e) =>
                                setGwForm((g) => ({ ...g, rtspPath: e.target.value }))
                              }
                              maxLength={200}
                            />
                          )}
                        </Field>
                      </>
                    )}

                    {gwForm.vendor === 'rtsp' && (
                      <Field label="Full RTSP / RTSPS URL">
                        {(id) => (
                          <input
                            id={id}
                            type="text"
                            required={!gwForm.hasExistingRtspUrl}
                            placeholder={
                              gwForm.hasExistingRtspUrl
                                ? 'Leave blank to keep existing RTSP URL'
                                : 'rtsp://user:pass@10.8.0.20:554/Streaming/Channels/102'
                            }
                            value={gwForm.rtspUrl}
                            onChange={(e) => setGwForm((g) => ({ ...g, rtspUrl: e.target.value }))}
                            maxLength={500}
                          />
                        )}
                      </Field>
                    )}

                    {gwForm.vendor === 'push' && (
                      <Field label="Custom Edge Bridge Publish Secret (optional)">
                        {(id) => (
                          <input
                            id={id}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Leave blank to use default CCTV_PUBLISH_TOKEN"
                            value={gwForm.publishSecret}
                            onChange={(e) =>
                              setGwForm((g) => ({ ...g, publishSecret: e.target.value }))
                            }
                            maxLength={200}
                          />
                        )}
                      </Field>
                    )}

                    {gwForm.vendor !== 'push' && (
                      <Field label="RTSP Transport">
                        {(id) => (
                          <select
                            id={id}
                            value={gwForm.rtspTransport}
                            onChange={(e) =>
                              setGwForm((g) => ({
                                ...g,
                                rtspTransport: e.target.value as 'tcp' | 'udp',
                              }))
                            }
                          >
                            <option value="tcp">TCP (recommended for WAN/VPN)</option>
                            <option value="udp">UDP</option>
                          </select>
                        )}
                      </Field>
                    )}
                  </div>

                  {gwForm.vendor !== 'push' && (
                    <div className="flex flex-wrap gap-6">
                      <label className="flex gap-2 items-center text-sm">
                        <input
                          type="checkbox"
                          checked={gwForm.sourceOnDemand}
                          onChange={(e) =>
                            setGwForm((g) => ({ ...g, sourceOnDemand: e.target.checked }))
                          }
                        />
                        Pull stream on demand only while viewing (saves school bandwidth)
                      </label>
                      {isPullNvr && (
                        <label className="flex gap-2 items-center text-sm">
                          <input
                            type="checkbox"
                            checked={gwForm.tls}
                            onChange={(e) => setGwForm((g) => ({ ...g, tls: e.target.checked }))}
                          />
                          Use RTSPS (TLS)
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )}
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
                <Button variant="ghost" onClick={resetForm}>
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
