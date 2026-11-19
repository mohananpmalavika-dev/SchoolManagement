'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Users, BookOpen, School, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert, PageLoader } from './ui';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { WorkspacePreview } from './WorkspacePreview';
import { homeForRole } from '@/lib/session';
export function LoginScreen() {
  const { login, verifyMfa, user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mfaSession, setMfaSession] = useState<string | null>(null);
  const [code, setCode] = useState('');
  useEffect(() => {
    if (!isLoading && user) router.replace(homeForRole(user.role));
  }, [isLoading, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mfaSession) await verifyMfa(mfaSession, code);
      else {
        const challenge = await login(email, password);
        setPassword('');
        setMfaSession(challenge);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.unableToSignIn'));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || user) return <PageLoader/>;

  return (
    <div className="login-page" data-portal="school">
      <header className="login-brandbar"><Link href="/" className="brand">
          <span className="brand-mark"><School size={23}/></span>
          <span>
            Krypton
            <small>{t('common.schoolWorkspace')}</small>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
            className="login-install-action"
            aria-label="Install School App"
          >
            <Smartphone size={15}/>
            <span className="hidden sm:inline">Install App</span>
          </button>
          <LanguageSwitcher variant="compact"/>
        </div>
      </header><div className="login-surface"><section className="login-form-panel">


        <div className="login-form-wrap">
          <div className="login-portal-emblem"><ShieldCheck size={26} strokeWidth={1.7}/></div>
          <span className="eyebrow">{t('common.welcomeToKrypton')}</span>
          <h2>{t('auth.goodToSeeYou')}</h2>
          <p className="muted">
            {t('auth.signInToWorkspace')}
          </p>
          <p className="login-routing-note">{t('auth.workspaceRouting')}</p>

          <form onSubmit={submit} className="space-y-5">
            {error && <Alert variant="danger">{error}</Alert>}
            {mfaSession ? <div className="space-y-5"><div className="security-note"><ShieldCheck size={22}/><p>Enter the code from your authenticator app, or a single-use backup code.</p></div><Input label="Verification code" autoComplete="one-time-code" autoFocus required minLength={6} maxLength={16} value={code} onChange={e => setCode(e.target.value)} /><Button variant="ghost" size="sm" onClick={() => {setMfaSession(null);setCode('');setError('');}}>Back to sign in</Button></div> : <><Input
              label={t('auth.email')}
              type="email"
              autoComplete="username"
              placeholder="you@school.edu.in"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="password-field">
              <Input
                label={t('auth.password')}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('auth.enterPassword')}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Link className="forgot-link" href="/forgot-password">Forgot your password?</Link></>}
            <Button type="submit" fullWidth isLoading={busy} rightIcon={<ArrowRight size={18} />}>
              {mfaSession ? 'Verify and sign in' : t('auth.signIn')}
            </Button>
          </form>
          <p className="login-help">
            <ShieldCheck size={16} />
            {t('auth.accessAssigned')}
          </p>
          <p className="login-contact">{t('auth.needHelpContact')}</p>
        </div>
        <footer>{t('common.organizedSchools')}</footer>
      </section><section className="login-story">

        <div className="login-story-content">
          <span className="eyebrow light">
            <span className="workspace-dot" />
            {t('common.connectedSchool')}
          </span>
          <h1>
            {t('common.betterSchoolDays')}
            <br />
            <span>{t('common.brighterFutures')}</span>
          </h1>
          <p>{t('common.workspaceDescription')}</p>
          <div className="story-features">
            <div>
              <Users />
              <span>{t('common.peopleConnected')}</span>
            </div>
            <div>
              <BookOpen />
              <span>{t('common.learningSupported')}</span>
            </div>
            <div>
              <ShieldCheck />
              <span>{t('common.accessProtected')}</span>
            </div>
          </div>
          <WorkspacePreview />
          <small>{t('common.oneCommunity')}</small>
        </div>
      </section></div>
    </div>
  );
}
