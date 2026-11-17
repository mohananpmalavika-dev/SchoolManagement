import Link from 'next/link';
import { ResourceTabs } from '@/components/ResourceTabs';

export default function Page() {
  return <>
    <div className="flex flex-wrap gap-4 mb-5">
      <Link className="panel-link" href="/school/transport">Manage stops, drivers & trips</Link>
      <Link className="panel-link" href="/school/transport/assignments">Assign students to stops</Link>
    </div>
    <ResourceTabs resources={[{key:'vehicles',label:'Vehicles'},{key:'routes',label:'Routes'}]}/>
  </>;
}
