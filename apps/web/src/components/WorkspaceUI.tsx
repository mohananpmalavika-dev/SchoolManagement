import { ReactNode } from 'react';
import { Inbox, ArrowUpRight, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui';
export function PageHeading({eyebrow='YOUR WORKSPACE',title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:ReactNode}){
 return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="page-heading-actions">{actions}</div>}</div>;
}
export function EmptyState({title='Nothing here yet',description='Records will appear here as your school adds them.',retry}:{title?:string;description?:string;retry?:()=>void}){
 return <div className="empty-state"><Inbox size={34} strokeWidth={1.3}/><h2>{title}</h2><p>{description}</p>{retry&&<Button variant="outline" size="sm" onClick={retry}>Try again</Button>}</div>;
}
export function Panel({title,subtitle,href,children}:{title:string;subtitle?:string;href?:string;children:ReactNode}){
 return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{href&&<Link className="panel-link" href={href}>View all<ArrowUpRight size={14}/></Link>}</div>{children}</section>;
}
export function StatCard({label,value,note,icon:Icon}:{label:string;value:string|number;note:string;icon:LucideIcon}){
 return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17}/></span></div><div className="metric-value">{value}</div><div className="metric-foot">{note}</div></div>;
}
export function StatusPill({value}:{value:string}){
 const warning=['TRIAL','PENDING','OVERDUE','PAST_DUE','BORROWED','LATE','MAINTENANCE','PARTIALLY_PAID','IN_PROGRESS','OPEN'];
 const danger=['SUSPENDED','CANCELLED','FAILED','ABSENT','EXPIRED','URGENT'];
 const positive=['ACTIVE','PAID','COMPLETED','PRESENT','PUBLISHED','APPROVED','RETURNED','ADMITTED','RESOLVED'];
 return <span className={'pill '+(danger.includes(value)?'danger':warning.includes(value)?'warning':positive.includes(value)?'':'neutral')}>{value.replaceAll('_',' ').toLowerCase()}</span>;
}
