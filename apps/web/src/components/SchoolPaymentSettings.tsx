'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { EmptyState, PageHeading, Panel } from './WorkspaceUI';
import { Button } from './ui';

type Account = { id: string; merchantName: string; razorpayEnabled: boolean; razorpayKeyId: string | null;
  hasKeySecret: boolean; hasWebhookSecret: boolean; upiVpa: string; mode: 'TEST' | 'LIVE'; createdAt: string };
type School = { id: string; name: string; isActive: boolean; account: Account | null };
type Form = { expectedAccountId: string; merchantName: string; razorpayEnabled: boolean; razorpayKeyId: string;
  razorpayKeySecret: string; razorpayWebhookSecret: string; upiVpa: string };
const editors = ['SCHOOL_OWNER', 'PRINCIPAL', 'SCHOOL_ADMIN'];
const initial = (school: School): Form => ({ expectedAccountId: school.account?.id || '', merchantName: school.account?.merchantName || school.name,
  razorpayEnabled: school.account?.razorpayEnabled || false, razorpayKeyId: school.account?.razorpayKeyId || '',
  razorpayKeySecret: '', razorpayWebhookSecret: '', upiVpa: school.account?.upiVpa || '' });

export function SchoolPaymentSettings() {
  const { user } = useAuth();
  const canEdit = editors.includes(user?.role || '');
  const allowed = canEdit || user?.role === 'ACCOUNTANT';
  const [schools, setSchools] = useState<School[]>([]), [selected, setSelected] = useState('');
  const [form, setForm] = useState<Form | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [confirmed, setConfirmed] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(''), [assignConfirmed, setAssignConfirmed] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.get<School[]>('/payments-gateway/school-accounts');
      setSchools(data); setSelected(''); setForm(null); setConfirmed(false);
    } catch (err) { setError(messageFor(err)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (allowed) void load(); }, [allowed, load]);
  const school = schools.find(row => row.id === selected);
  function selectSchool(id: string) {
    setSelected(id); const next = schools.find(row => row.id === id); setForm(next ? initial(next) : null);
    setError(''); setNotice(''); setConfirmed(false); setInvoiceNumber(''); setAssignConfirmed(false);
  }
  function change<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(previous => previous ? { ...previous, [key]: value } : null); setConfirmed(false); setNotice('');
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!form || !confirmed || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { razorpayKeySecret, razorpayWebhookSecret, ...fields } = form;
      const { data } = await apiClient.put<Account>('/payments-gateway/school-accounts/' + selected, {
        ...fields, merchantName: fields.merchantName.trim(), upiVpa: fields.upiVpa.trim(),
        ...(razorpayKeySecret ? { razorpayKeySecret } : {}), ...(razorpayWebhookSecret ? { razorpayWebhookSecret } : {}),
      });
      const updated = { ...school!, account: data };
      setSchools(previous => previous.map(row => row.id === selected ? updated : row)); setForm(initial(updated)); setConfirmed(false);
      setNotice('Payment settings saved for ' + school!.name + '. New payments will use this account.');
    } catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  async function assign(event: FormEvent) {
    event.preventDefault(); if (!assignConfirmed || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiClient.post('/payments-gateway/school-accounts/' + selected + '/assign-invoice', { invoiceNumber: invoiceNumber.trim() });
      setNotice('Invoice ' + invoiceNumber + ' assigned to ' + school!.name + '.'); setInvoiceNumber(''); setAssignConfirmed(false);
    } catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  if (!allowed) return <EmptyState title="Finance administration access required" description="A school owner, principal, administrator or accountant can view payment settings." />;
  return <>
    <PageHeading eyebrow="SCHOOL FINANCE" title="School payment accounts" description="Choose where each school's fee payments are received."
      actions={<Link className="btn btn-outline" href="/school/fees">Back to fees</Link>} />
    {error && <div className="notice error" role="alert">{error} <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>Reload settings</Button></div>}
    {notice && <div className="notice success" role="status">{notice}</div>}
    {loading ? <p role="status">Loading payment accounts…</p> : schools.length === 0 ? <EmptyState title="Add a school first" description="Create your school in Academic setup before configuring payments." /> : <>
      <Panel title="Receiving school" subtitle="Each school has its own account. Schools without settings cannot accept online payments.">
        <div className="field"><label htmlFor="payment-school">School</label><select id="payment-school" value={selected} onChange={event => selectSchool(event.target.value)} disabled={busy}>
          <option value="">Select a school</option>{schools.map(row => <option key={row.id} value={row.id}>{row.name}{row.isActive ? '' : ' (inactive)'}</option>)}
        </select></div>
      </Panel>
      {school && form && <>
        <Panel title={school.name + ' · payment details'} subtitle="Razorpay settles to the bank account registered in this school's Razorpay Dashboard. Direct UPI uses the UPI ID below.">
          {!school.isActive && <p role="status">This school is inactive. New online payments are blocked.</p>}
          {!canEdit && <p>Only the school owner, principal or administrator can change these settings.</p>}
          <form onSubmit={save} autoComplete="off">
            <fieldset disabled={!canEdit || busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              <div className="form-grid">
                <div className="field"><label htmlFor="merchant-name">Merchant display name</label><input id="merchant-name" value={form.merchantName} required minLength={2} maxLength={100} onChange={event => change('merchantName', event.target.value)} /></div>
                <div className="field"><label htmlFor="school-upi">Receiving UPI ID</label><input id="school-upi" value={form.upiVpa} placeholder="school@bank" maxLength={321} onChange={event => change('upiVpa', event.target.value)} /><small>Leave empty to disable direct UPI. Confirm the beneficiary in your UPI app before saving.</small></div>
              </div>
              <label className="check-row"><input type="checkbox" checked={form.razorpayEnabled} onChange={event => change('razorpayEnabled', event.target.checked)} /> Enable Razorpay for this school</label>
              <div className="form-grid">
                <div className="field"><label htmlFor="razorpay-key-id">Razorpay key ID</label><input id="razorpay-key-id" value={form.razorpayKeyId} placeholder="rzp_live_…" onChange={event => change('razorpayKeyId', event.target.value)} />
                  {form.razorpayKeyId.startsWith('rzp_test_') && <small>TEST mode: simulated payments only. Live payments require live keys.</small>}</div>
                <div className="field"><label htmlFor="razorpay-key-secret">Razorpay key secret</label><input id="razorpay-key-secret" type="password" autoComplete="new-password" value={form.razorpayKeySecret} minLength={8} maxLength={256} onChange={event => change('razorpayKeySecret', event.target.value)} /><small>{school.account?.hasKeySecret ? 'Secret saved. Leave blank to keep it for the same key ID.' : 'Required to enable Razorpay.'}</small></div>
                <div className="field"><label htmlFor="razorpay-webhook-secret">Webhook secret</label><input id="razorpay-webhook-secret" type="password" autoComplete="new-password" value={form.razorpayWebhookSecret} minLength={8} maxLength={256} onChange={event => change('razorpayWebhookSecret', event.target.value)} /><small>{school.account?.hasWebhookSecret ? 'Secret saved. Leave blank to keep it for the same key ID.' : 'Use the same secret in this school’s Razorpay webhook configuration.'}</small></div>
              </div>
              <p>In this school&apos;s Razorpay Dashboard, configure the API webhook <code style={{ overflowWrap: 'anywhere' }}>/api/v1/payments-gateway/webhook</code> for payment.captured, order.paid and payment.failed. Use your public API domain. Changing the key ID requires both secrets.</p>
              <p>Direct UPI payments stay pending until the school verifies its bank statement. Keep earlier Razorpay credentials and webhook secrets valid while their orders are outstanding.</p>
              {canEdit && <><label className="check-row"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I verified these receiving details belong to {school.name}.</label>
                <Button type="submit" disabled={!confirmed || busy}>{busy ? 'Saving…' : 'Save payment settings'}</Button></>}
            </fieldset>
          </form>
        </Panel>
        {canEdit && <Panel title="Assign an older invoice" subtitle="Use this only when an older invoice has no receiving school. Assigned invoices and invoices with gateway orders cannot be changed here.">
          <form onSubmit={assign}>
            <div className="field"><label htmlFor="unassigned-invoice">Invoice number</label><input id="unassigned-invoice" required maxLength={100} value={invoiceNumber} disabled={busy} onChange={event => { setInvoiceNumber(event.target.value); setAssignConfirmed(false); }} /></div>
            <label className="check-row"><input type="checkbox" checked={assignConfirmed} disabled={busy} onChange={event => setAssignConfirmed(event.target.checked)} /> This invoice belongs to {school.name}.</label>
            <Button type="submit" variant="outline" disabled={!assignConfirmed || !invoiceNumber.trim() || busy}>Assign invoice to this school</Button>
          </form>
        </Panel>}
      </>}
    </>}
  </>;
}
