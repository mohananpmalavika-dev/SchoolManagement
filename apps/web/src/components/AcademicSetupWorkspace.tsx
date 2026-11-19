'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { schoolResources } from '@/lib/resources';
import { messageFor } from '@/lib/workspace';
import { ResourcePage } from './ResourcePage';

export function AcademicSetupWorkspace() {
  const [programme, setProgramme] = useState(''), [error, setError] = useState('');
  const [tab, setTab] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setError(''); setProgramme('');
    apiClient.get('/preschool/navigation').then(({ data }) => {
      if (active) { setProgramme(data.programme); setTab(data.programme === 'PRESCHOOL' ? 'classes' : 'years'); }
    }).catch(err => { if (active) setError(messageFor(err)); });
    return () => { active = false; };
  }, [attempt]);
  if (error) return <div className="state-box" role="alert">{error}<button className="underline ml-3" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
  if (!programme) return <p role="status">Loading school setup…</p>;
  const preschool = programme === 'PRESCHOOL';
  const tabs = preschool
    ? [['classes', 'Preschool classes'], ['streams', 'Class sections'], ['years', 'School years'], ['terms', 'Terms'], ['schools', 'Campuses']]
    : [['years', 'Academic years'], ['terms', 'Terms'], ['classes', 'Classes'], ['streams', 'Class sections'], ['subjects', 'Subjects'], ['schools', 'Campuses']];
  const config = { ...schoolResources[tab] };
  if (preschool && tab === 'classes') {
    config.title = 'Preschool classes';
    config.description = 'Create Playgroup, Nursery, LKG or UKG classes. Each class is automatically pre-primary and ready for the preschool workspace.';
    config.columns = config.columns.map(column => column.key === 'level' ? { ...column, key: 'preschoolStage', label: 'Preschool stage' } : column);
  }
  if (tab === 'streams') { config.title = 'Class sections'; config.description = 'Create sections within a class and set their capacity.'; }
  if (preschool && tab === 'years') { config.title = 'School years'; config.description = 'Set the school year used for enrolment, fees and classroom records.'; }
  return <>
    <div className="panel panel-body mb-6"><p className="font-semibold">{preschool ? 'Preschool class setup' : 'Academic setup'}</p><p className="muted mt-2">{preschool ? 'Start with classes and their preschool stages, then add sections and school-year dates. Assign teachers in Preschool setup.' : 'Manage school years, terms, classes, sections and subjects.'}</p><Link className="panel-link mt-3" href={preschool ? '/school/setup' : '/school/academics/promotion'}>{preschool ? 'Assign teachers & configure safe pickup' : 'Year-end promotion & academic-year rollover'}</Link></div>
    <nav className="section-tabs" aria-label="Setup sections">{tabs.map(([key, label]) => <button key={key} aria-pressed={tab === key} className={tab === key ? 'selected' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
    <ResourcePage key={tab} {...config}/>
  </>;
}
