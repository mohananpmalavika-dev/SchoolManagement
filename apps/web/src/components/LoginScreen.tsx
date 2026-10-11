'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert } from './ui';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
export function LoginScreen({portal = 'school'}: {portal?: string}) {
  const { login, verifyMfa } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mfaSession, setMfaSession] = useState<string | null>(null);
  const [code, setCode] = useState('');

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

  const portalLabel = portal === 'admin' ? t('admin.administration') 
    : portal === 'teacher' ? t('teacher.teaching') 
    : portal === 'parent' ? t('parent.family') 
    : portal === 'student' ? 'Student'
    : t('common.school');

  return (
    <div className="login-page">
      <section className="login-story">
        <Link href="/" className="brand">
          <img src="/hustlertech-logo.png" alt="HustlerTech Logo" className="brand-logo-img" />
          <span>
            HustlerTech
            <small>{t('common.schoolWorkspace')}</small>
          </span>
        </Link>
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
          <div className="story-art" aria-hidden="true">
            <div className="art-orbit" />
            <div className="art-book">
              <GraduationCap size={68} strokeWidth={1} />
              <span>{t('common.placeToGrow')}</span>
            </div>
            <div className="art-dot one" />
            <div className="art-dot two" />
          </div>
          <small>{t('common.oneCommunity')}</small>
        </div>
      </section>

      <section className="login-form-panel">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="login-form-wrap">
          <span className="eyebrow">{t('common.welcomeToKrypton')}</span>
          <h2>{t('auth.goodToSeeYou')}</h2>
          <p className="muted">
            {t('auth.signInToWorkspace', { workspace: portalLabel })}
          </p>
          <div className="portal-tabs">
            <Link className={portal === 'school' ? 'selected' : ''} href="/login">
              {t('common.school')}
            </Link>
            <Link className={portal === 'teacher' ? 'selected' : ''} href="/teacher/login">
              {t('teacher.teacher')}
            </Link>
            <Link className={portal === 'student' ? 'selected' : ''} href="/student/login">
              Student
            </Link>
            <Link className={portal === 'parent' ? 'selected' : ''} href="/parent/login">
              {t('parent.family')}
            </Link>
            <Link className={portal === 'admin' ? 'selected' : ''} href="/admin/login">
              {t('admin.platform')}
            </Link>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {error && <Alert variant="danger">{error}</Alert>}
            {mfaSession ? <div className="space-y-5"><div className="security-note"><ShieldCheck size={22}/><p>Enter the code from your authenticator app, or a single-use backup code.</p></div><Input label="Verification code" autoComplete="one-time-code" autoFocus required minLength={6} maxLength={16} value={code} onChange={e => setCode(e.target.value)} /><Button variant="ghost" size="sm" onClick={() => {setMfaSession(null);setCode('');setError('');}}>Back to sign in</Button></div> : <><Input
              label={t('auth.email')}
              type="email"
              autoComplete="username"
              placeholder="you@school.ac.ke"
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
      </section>
    </div>
  );
}
