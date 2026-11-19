'use client';

import { useState } from 'react';
import { AdminSupportWorkspace } from '@/components/admin/AdminSupportWorkspace';
import { ResourcePage } from '@/components/ResourcePage';
import { adminResources } from '@/lib/resources';

export default function Page() {
  const [tab, setTab] = useState<'tickets' | 'announcements'>('tickets');

  return (
    <>
      <div className="section-tabs" aria-label="Support sections">
        <button
          className={tab === 'tickets' ? 'selected' : ''}
          aria-pressed={tab === 'tickets'}
          onClick={() => setTab('tickets')}
        >
          Support tickets
        </button>
        <button
          className={tab === 'announcements' ? 'selected' : ''}
          aria-pressed={tab === 'announcements'}
          onClick={() => setTab('announcements')}
        >
          Announcements
        </button>
      </div>

      {tab === 'tickets' ? (
        <AdminSupportWorkspace />
      ) : (
        <ResourcePage key="announcements" {...adminResources.announcements} />
      )}
    </>
  );
}
