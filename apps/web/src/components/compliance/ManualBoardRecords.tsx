'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import { messageFor, dateLabel } from '@/lib/workspace';
import { Panel, EmptyState } from '../WorkspaceUI';
import { Button } from '../ui';

const root = '/government/compliance/board-records';
export function ManualBoardRecords({
  students,
  onSaved,
}: {
  students: any[];
  onSaved: () => Promise<void>;
}) {
  const [rows, setRows] = useState<any[]>([]),
    [kind, setKind] = useState('CANDIDATE'),
    [examLevel, setExamLevel] = useState('CBSE_AISSE'),
    [examYear, setExamYear] = useState(() =>
      new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(
        new Date()
      )
    );
  const [studentId, setStudentId] = useState(''),
    [candidateNumber, setCandidate] = useState(''),
    [reference, setReference] = useState(''),
    [evidence, setEvidence] = useState(''),
    [notes, setNotes] = useState(''),
    [subjectCode, setSubject] = useState(''),
    [marks, setMarks] = useState(''),
    [totalMarks, setTotalMarks] = useState('100'),
    [examDate, setExamDate] = useState(''),
    [startTime, setStartTime] = useState(''),
    [endTime, setEndTime] = useState(''),
    [replacesId, setReplaces] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const load = useCallback(async () => setRows((await apiClient.get(root)).data), []);
  useEffect(() => {
    void load().catch((err) => setError(messageFor(err)));
  }, [load]);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.post(root, {
        kind,
        examLevel,
        examYear: Number(examYear),
        portalReference: reference.trim(),
        notes: notes.trim(),
        ...(studentId && kind !== 'TIMETABLE' ? { studentId, candidateNumber } : {}),
        ...(evidence ? { evidenceUrl: evidence } : {}),
        ...(kind === 'RESULT'
          ? { subjectCode, marks: Number(marks), totalMarks: Number(totalMarks) }
          : {}),
        ...(kind === 'TIMETABLE' ? { subjectCode, examDate, startTime, endTime } : {}),
        ...(replacesId ? { replacesId } : {}),
      });
      await load();
      await onSaved();
      setReplaces('');
      setNotice('Official document details recorded manually. No government API call was made.');
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }
  const input = (
    id: string,
    title: string,
    value: string,
    set: (value: string) => void,
    type = 'text',
    required = true
  ) => (
    <div className="field">
      <label htmlFor={id}>{title}</label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
  return (
    <div className="content-stack">
      {error && (
        <div className="state-box" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="state-box success" role="status">
          {notice}
        </div>
      )}
      <Panel
        title="Record official board documents"
        subtitle="After using the official portal, record candidate registration, published results, timetable entries or irregularity references here. These entries do not register candidates or retrieve results automatically."
      >
        <form className="panel-body space-y-4" onSubmit={save}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="board-kind">Document type</label>
              <select id="board-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                {['CANDIDATE', 'RESULT', 'TIMETABLE', 'IRREGULARITY'].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="board-level">Board examination</label>
              <select
                id="board-level"
                value={examLevel}
                onChange={(e) => setExamLevel(e.target.value)}
              >
                {['CBSE_AISSE', 'CBSE_AISSCE', 'ICSE_10', 'ISC_12', 'STATE_SSLC', 'STATE_HSC'].map(
                  (k) => (
                    <option key={k}>{k}</option>
                  )
                )}
              </select>
            </div>
            {input('board-year', 'Examination year', examYear, setExamYear, 'number')}
            {kind !== 'TIMETABLE' && (
              <>
                <div className="field">
                  <label htmlFor="board-student">School student</label>
                  <select
                    id="board-student"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  >
                    <option value="">Choose a student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.admissionNumber} · {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                {input(
                  'board-candidate',
                  'Official candidate number',
                  candidateNumber,
                  setCandidate
                )}
              </>
            )}
            {input(
              'board-reference',
              'Official document or portal reference',
              reference,
              setReference
            )}
            {input(
              'board-evidence',
              'Official evidence HTTPS link (optional)',
              evidence,
              setEvidence,
              'url',
              false
            )}
            {['RESULT', 'TIMETABLE'].includes(kind) &&
              input('board-subject', 'Official subject code', subjectCode, setSubject)}
            {kind === 'RESULT' && (
              <>
                {input('board-marks', 'Published marks', marks, setMarks, 'number')}
                {input('board-total', 'Maximum marks', totalMarks, setTotalMarks, 'number')}
              </>
            )}
            {kind === 'TIMETABLE' && (
              <>
                {input('board-date', 'Official exam date', examDate, setExamDate, 'date')}
                {input('board-start', 'Exam start time', startTime, setStartTime, 'time')}
                {input('board-end', 'Exam end time', endTime, setEndTime, 'time')}
              </>
            )}
            <div className="field">
              <label htmlFor="board-notes">Document verification notes</label>
              <textarea
                id="board-notes"
                required
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          {replacesId && (
            <p>Correction of saved entry {replacesId}. The previous entry remains in evidence.</p>
          )}
          <Button type="submit" disabled={busy}>
            Save official document record
          </Button>
        </form>
      </Panel>
      <Panel title="Saved manual board records">
        <div className="panel-body space-y-4">
          {rows.length ? (
            rows.map((row) => (
              <article key={row.id} className="panel p-4 space-y-2">
                <strong>
                  {row.payload.kind} · {row.payload.examLevel} · {row.payload.examYear}
                </strong>
                <p>
                  {row.payload.studentName || row.payload.subjectCode} ·{' '}
                  {row.payload.portalReference}
                </p>
                <p>{row.payload.notes}</p>
                {row.payload.kind === 'RESULT' && (
                  <p>
                    {row.payload.subjectCode}: {row.payload.marks} / {row.payload.totalMarks}
                  </p>
                )}
                {row.payload.kind === 'TIMETABLE' && (
                  <p>
                    {row.payload.examDate} · {row.payload.startTime}–{row.payload.endTime}
                  </p>
                )}
                <p className="text-sm muted">Recorded {dateLabel(row.createdAt)}</p>
                {row.payload.replacesId && (
                  <p className="text-xs break-all">Corrects entry {row.payload.replacesId}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    const p = row.payload;
                    setKind(p.kind);
                    setExamLevel(p.examLevel);
                    setExamYear(String(p.examYear));
                    setStudentId(p.studentId || '');
                    setCandidate(p.candidateNumber || '');
                    setReference(p.portalReference);
                    setSubject(p.subjectCode || '');
                    setMarks(String(p.marks ?? ''));
                    setTotalMarks(String(p.totalMarks || 100));
                    setExamDate(p.examDate || '');
                    setStartTime(p.startTime || '');
                    setEndTime(p.endTime || '');
                    setReplaces(row.id);
                    setNotes('');
                    setNotice('Enter corrected details and explain the source document above.');
                  }}
                >
                  Correct this entry
                </Button>
              </article>
            ))
          ) : (
            <EmptyState title="No board documents recorded" />
          )}
        </div>
      </Panel>
    </div>
  );
}
