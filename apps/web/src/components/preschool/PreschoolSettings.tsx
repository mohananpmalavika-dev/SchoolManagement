'use client';
import { useState, type FormEvent } from 'react';
import { friendly, type PreschoolAction, type PreschoolOptions } from '@/lib/preschool';
import { Panel, EmptyState } from '../WorkspaceUI';
import { Button } from '../ui';
import { Field } from './PreschoolFields';

export function PreschoolSettings({
  options,
  action,
  busy,
}: {
  options: PreschoolOptions;
  action: PreschoolAction;
  busy: boolean;
}) {
  const [classId, setClass] = useState(''),
    [teacher, setTeacher] = useState('');
  async function assign(e: FormEvent) {
    e.preventDefault();
    await action('/staff-assignments', { classId, staffId: teacher, assigned: true });
  }
  return (
    <div className="content-stack">
      <Panel
        title="School programme"
        subtitle="A combined school can run preschool and regular school classes in the same platform."
      >
        <div className="panel-body space-y-4">
          {!options.schools.length && (
            <EmptyState
              title="Create a school first"
              description="Add the school in academic setup, then return here."
            />
          )}
          {options.schools.map((school) => (
            <div key={school.id} className="field">
              <label htmlFor={'programme-' + school.id}>{school.name}</label>
              <select
                id={'programme-' + school.id}
                value={school.programme}
                disabled={busy}
                onChange={(e) =>
                  void action('/schools/' + school.id, { programme: e.target.value }, 'patch')
                }
              >
                <option value="STANDARD">Regular school</option>
                <option value="PRESCHOOL">Playschool / preschool</option>
                <option value="COMBINED">Combined school</option>
              </select>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Preschool class stages"
        subtitle="Select nursery or kindergarten classes. Setting a stage marks the class as pre-primary."
      >
        <div className="panel-body space-y-4">
          {options.classes.map((c) => (
            <div className="field" key={c.id}>
              <label htmlFor={'stage-' + c.id}>{c.name}</label>
              <select
                id={'stage-' + c.id}
                value={c.preschoolStage || ''}
                disabled={busy || c.school.programme === 'STANDARD'}
                onChange={(e) =>
                  void action('/classes/' + c.id, { stage: e.target.value }, 'patch')
                }
              >
                <option value="" disabled>
                  {c.school.programme === 'STANDARD'
                    ? 'Enable preschool or combined mode first'
                    : 'Select a preschool stage'}
                </option>
                {['PLAYGROUP', 'NURSERY', 'LKG', 'UKG'].map((stage) => (
                  <option key={stage} value={stage}>
                    {friendly(stage)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Preschool teaching staff"
        subtitle="Explicit class assignments work without an academic timetable."
      >
        <div className="panel-body space-y-4">
          <form className="space-y-4" onSubmit={assign}>
            <div className="form-grid">
              <Field label="Assigned class">
                {(id) => (
                  <select
                    id={id}
                    required
                    value={classId}
                    onChange={(e) => setClass(e.target.value)}
                  >
                    <option value="">Choose class</option>
                    {options.classes
                      .filter(
                        (c) =>
                          c.educationLevel === 'PRE_PRIMARY' && c.school.programme !== 'STANDARD'
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
              </Field>
              <Field label="Teacher">
                {(id) => (
                  <select
                    id={id}
                    required
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                  >
                    <option value="">Choose linked teacher</option>
                    {options.staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <Button type="submit" isLoading={busy}>
              Assign teacher
            </Button>
          </form>
          {options.assignments.map((a) => (
            <div
              className="flex justify-between gap-3 border rounded-xl p-4"
              key={a.classId + a.staffId}
            >
              <p>
                {options.classes.find((c) => c.id === a.classId)?.name || 'Class'} ·{' '}
                {options.staff.find((s) => s.id === a.staffId)?.firstName || 'Teacher'}{' '}
                {options.staff.find((s) => s.id === a.staffId)?.lastName}
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void action('/staff-assignments', {
                    classId: a.classId,
                    staffId: a.staffId,
                    assigned: false,
                  })
                }
              >
                Remove assignment
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
