import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return <div className="recovery-page">
    <div className="recovery-card">
      <div className="recovery-icon"><Compass size={28} strokeWidth={1.5}/></div>
      <span className="eyebrow">404 &middot; PAGE NOT FOUND</span>
      <h1>Let&apos;s get you back on track.</h1>
      <p className="muted">This page may have moved. Return to your workspace to find what you need.</p>
      <Link className="overview-hero-link !mt-0" href="/login">Return to your workspace<ArrowRight size={16}/></Link>
    </div>
  </div>;
}
