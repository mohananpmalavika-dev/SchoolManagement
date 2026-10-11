import {ResourcePage} from '@/components/ResourcePage';
import {schoolResources} from '@/lib/resources';
export default function Page(){const {fields,action,editable,...config}=schoolResources.timetable;return <ResourcePage {...config} title="My schedule"/>;}