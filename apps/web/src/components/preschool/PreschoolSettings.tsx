'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { friendly, schoolProgrammeLabels, type PreschoolAction, type PreschoolOptions } from '@/lib/preschool';
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
  const enabledClasses = options.classes.filter(c => c.school.programme !== 'STANDARD');
  const hasPreschool = options.schools.some(school => school.programme !== 'STANDARD');
  async function assign(e: FormEvent) {
    e.preventDefault();
    await action('/staff-assignments', { classId, staffId: teacher, assigned: true });
  }
  return (
    <div className="content-stack">
      <Panel
        title="School programme & safe pickup"
        subtitle="School type is managed by the platform Super Admin. Configure preschool classes, teachers and pickup here."
      >
        <div className="panel-body space-y-4">
          {!options.schools.length && (
            <EmptyState
              title="Create a school first"
              description="Add the school in academic setup, then return here."
            />
          )}
          {!options.schools.length && <Link className="panel-link" href="/school/academics">Open academic setup</Link>}
          {options.schools.map((school) => (
            <div key={school.id} className="border rounded-xl p-4 space-y-3">
              <div><p className="font-semibold">{school.name}</p><p className="muted mt-1">{schoolProgrammeLabels[school.programme]}</p></div>
              {school.programme !== 'STANDARD' && (
                <div className="field">
                  <label htmlFor={'pickup-verification-' + school.id}>
                    Safe pickup verification ({school.name})
                  </label>
                  <select
                    id={'pickup-verification-' + school.id}
                    value={school.preschoolPickupVerification || 'OPTIONAL'}
                    disabled={busy}
                    onChange={(e) =>
                      void action(
                        '/schools/' + school.id,
                        { pickupVerification: e.target.value },
                        'patch'
                      )
                    }
                  >
                    <option value="OPTIONAL">
                      Optional OTP / QR pass (staff manual check allowed)
                    </option>
                    <option value="REQUIRED">
                      Require parent OTP or QR pass for checkout
                    </option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
      {hasPreschool ? <><Panel
        title="Preschool class stages"
        subtitle="Select nursery or kindergarten classes. Setting a stage marks the class as pre-primary."
      >
        <div className="panel-body space-y-4">
          {!enabledClasses.length && <EmptyState title="Add classes for your preschool" description="Create classes in Academic setup, then assign their preschool stages here."/>}
          {enabledClasses.map((c) => (
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
                    {enabledClasses
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
          {options.assignments.filter(a => enabledClasses.some(c => c.id === a.classId)).map((a) => (
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
      </Panel></> : options.schools.length > 0 && <div className="panel panel-body"><p className="font-semibold">Regular school selected</p><p className="muted mt-2">Continue with classes, subjects and terms in Academic setup. Contact the platform Super Admin if the school type needs to change.</p><Link className="panel-link mt-3" href="/school/academics">Continue to academic setup</Link></div>}
    </div>
  );
}
