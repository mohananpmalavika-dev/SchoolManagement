import {CertificateVerification} from '@/components/PublicSchoolServices';
export default async function Page({params}:{params:Promise<{token:string}>}){const {token}=await params;return <CertificateVerification token={token}/>;}
