import {ResourceTabs} from '@/components/ResourceTabs';
import Link from 'next/link';
export default function Page(){return <><div className="panel panel-body mb-6"><Link className="panel-link" href="/school/academics/promotion">Year-end bulk promotion & academic-year rollover</Link></div><ResourceTabs resources={[{"key": "years", "label": "Academic years"}, {"key": "terms", "label": "Terms"}, {"key": "classes", "label": "Classes"}, {"key": "streams", "label": "Streams"}, {"key": "subjects", "label": "Subjects"}, {"key": "schools", "label": "Campuses"}]}/></>;}
