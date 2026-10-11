import { ResourceTabs } from '@/components/ResourceTabs';
export const metadata = {title:'Fees & invoices'};
export default function Page() { return <ResourceTabs resources={[{key:'invoices',label:'Invoices'},{key:'payments',label:'Payment records'}]}/>; }
