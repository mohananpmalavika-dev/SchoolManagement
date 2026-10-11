import { ResourceTabs } from '@/components/ResourceTabs';
export default function Page() {
  return <ResourceTabs resources={[{key:'vehicles',label:'Vehicles'},{key:'routes',label:'Routes'}]}/>;
}
