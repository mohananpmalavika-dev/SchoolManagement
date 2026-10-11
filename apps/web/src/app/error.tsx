'use client';
import { Button } from '@/components/ui';
export default function ErrorPage({reset}:{reset:()=>void}) { return <div className="empty-state"><h2>Something went wrong</h2><p>Please retry. Your saved records are safe.</p><Button onClick={reset}>Try again</Button></div>;}