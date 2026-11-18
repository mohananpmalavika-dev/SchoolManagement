import { ResourceTabs } from '@/components/ResourceTabs';
export const metadata = {title:'Fees & invoices'};
import Link from 'next/link';
export default function Page() { return <><div className="page-heading-actions"><Link className="btn btn-outline" href="/school/fees/payment-settings">School payment accounts</Link></div><ResourceTabs resources={[{key:'invoices',label:'Invoices'},{key:'payments',label:'Payment records'}]}/></>; }
