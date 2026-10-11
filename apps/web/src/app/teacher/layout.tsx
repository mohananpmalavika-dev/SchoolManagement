import { AppShell } from '@/components/AppShell';
export default function Layout({children}:{children:React.ReactNode}){return <AppShell portal="teacher">{children}</AppShell>;}