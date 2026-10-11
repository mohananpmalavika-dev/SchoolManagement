import { ResourceTabs } from '@/components/ResourceTabs';
export const metadata = {title:'School timetable'};
export default function Page() { return <ResourceTabs resources={[{key:'timetable',label:'Saved timetable'}]}/>; }
