import {ResourcePage} from '@/components/ResourcePage';
import {adminResources} from '@/lib/resources';
export default function Page(){return <ResourcePage {...adminResources['users']}/>;}