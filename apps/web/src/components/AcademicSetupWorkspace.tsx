'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { schoolResources } from '@/lib/resources';
import { messageFor } from '@/lib/workspace';
import { ResourcePage } from './ResourcePage';

export function AcademicSetupWorkspace() {
  return <Suspense fallback={<p role="status">Loading school setup…</p>}><AcademicSetupContent/></Suspense>;
}

function AcademicSetupContent() {
  const query = useSearchParams(), pathname = usePathname(), router = useRouter();
  const [programme, setProgramme] = useState(''), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setError(''); setProgramme('');
    apiClient.get('/preschool/navigation').then(({ data }) => {
      if (active) {
        if (!['STANDARD', 'PRESCHOOL', 'COMBINED'].includes(data.programme)) throw new Error('School configuration could not be loaded. Please try again.');
        setProgramme(data.programme);
      }
    }).catch(err => { if (active) setError(messageFor(err)); });
    return () => { active = false; };
  }, [attempt]);
  function selectTab(key: string) {
    const next = new URLSearchParams(query.toString());
    next.set('section', key);
    router.push(pathname + '?' + next.toString(), { scroll: false });
  }
  if (error) return <div className="state-box" role="alert">{error}<button className="underline ml-3" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
  if (!programme) return <p role="status">Loading school setup…</p>;
  const preschool = programme === 'PRESCHOOL';
  const tabs = preschool
    ? [['classes', 'Preschool classes'], ['streams', 'Class sections'], ['years', 'School years'], ['terms', 'Terms'], ['schools', 'Campuses']]
    : [['years', 'Academic years'], ['terms', 'Terms'], ['classes', 'Classes'], ['streams', 'Class sections'], ['subjects', 'Subjects'], ['schools', 'Campuses']];
  const requested = query.get('section');
  const tab = tabs.some(([key]) => key === requested) ? requested! : preschool ? 'classes' : 'years';
  const config = { ...schoolResources[tab] };
  if (tab === 'classes') config.columns = [config.columns[0], { key: 'schoolName', label: 'Campus' }, ...config.columns.slice(1)];
  if (tab === 'terms') config.columns = [config.columns[0], { key: 'academicYearName', label: 'School year' }, ...config.columns.slice(1)];
  if (preschool && tab === 'classes') {
    config.title = 'Preschool classes';
    config.description = 'Create Playgroup, Nursery, LKG or UKG classes. Each class is automatically pre-primary and ready for the preschool workspace.';
    config.columns = config.columns.map(column => column.key === 'level' ? { ...column, key: 'preschoolStage', label: 'Preschool stage' } : column);
  }
  if (tab === 'streams') { config.title = 'Class sections'; config.description = 'Create sections within a class and set their capacity.'; config.columns = [config.columns[0], { key: 'schoolName', label: 'Campus' }, { key: 'className', label: 'Class' }, ...config.columns.slice(1)]; }
  if (preschool && tab === 'years') { config.title = 'School years'; config.description = 'Set the school year used for enrolment, fees and classroom records.'; }
  return <>
    <div className="panel panel-body mb-6"><p className="font-semibold">{preschool ? 'Preschool class setup' : 'Academic setup'}</p><p className="muted mt-2">Create a campus, add classes and sections, then create a school year and its terms. Set the year and term current before enrolment and billing.{preschool ? ' Assign teachers in Preschool setup.' : ' Add the subjects taught at each education level.'}</p><div className="flex flex-wrap gap-4 mt-3"><button className="panel-link" onClick={() => selectTab('schools')}>Manage campuses</button><Link className="panel-link" href={preschool ? '/school/setup' : '/school/academics/promotion'}>{preschool ? 'Assign teachers & configure safe pickup' : 'Year-end promotion & academic-year rollover'}</Link></div></div>
    <nav className="section-tabs" aria-label="Setup sections">{tabs.map(([key, label]) => <button key={key} aria-pressed={tab === key} className={tab === key ? 'selected' : ''} onClick={() => selectTab(key)}>{label}</button>)}</nav>
    <ResourcePage key={tab} {...config}/>
  </>;
}
