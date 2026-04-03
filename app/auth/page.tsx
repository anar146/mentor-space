'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Tell Vercel to skip static generation for this dynamic route
export const dynamic = 'force-dynamic';

type Tab    = 'login' | 'signup';
type Role   = 'student' | 'mentor';
type Status = 'idle' | 'loading' | 'error';

// 1. THE WRAPPER: Satisfies the Next.js Suspense requirement for useSearchParams
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Loading MentorSpace Auth...
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

// 2. THE CONTENT: Your full logic and UI
function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'login');
  const [role, setRole] = useState<Role>((params.get('role') as Role) ?? 'student');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrMsg('');

    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          });
          router.push('/dashboard');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrMsg(err.message ?? 'Something went wrong');
      setStatus('error');
    }
  }

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,111,255,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: '#7c6fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>M</span>
            MentorSpace
          </Link>
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: '32px 28px' }}>
          <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 9, padding: 4, marginBottom: 28, border: '1px solid #222' }}>
            {(['login', 'signup'] as Tab[]).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: tab === t ? '#222' : 'transparent',
                color: tab === t ? '#fff' : '#666',
                fontWeight: tab === t ? 600 : 400,
              }}>
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                {(['student', 'mentor'] as Role[]).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)} style={{
                    padding: '12px 8px', borderRadius: 9,
                    border: role === r ? '1.5px solid #7c6fff' : '1px solid #222',
                    background: role === r ? 'rgba(124,111,255,0.1)' : '#0a0a0a',
                    color: role === r ? '#7c6fff' : '#666',
                    cursor: 'pointer', fontWeight: 600,
                  }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
                ))}
              </div>
            )}

            {tab === 'signup' && (
              <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
            )}
            <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />

            {errMsg && <div style={{ color: '#ff4b4b', fontSize: 13, background: 'rgba(255,75,75,0.1)', padding: 10, borderRadius: 8 }}>{errMsg}</div>}

            <button type="submit" disabled={status === 'loading'} style={{ padding: '12px', borderRadius: 9, background: '#7c6fff', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
              {status === 'loading' ? 'Processing...' : tab === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#222' }} />
            <span style={{ fontSize: 12, color: '#666' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#222' }} />
          </div>

          <button onClick={handleGoogleAuth} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 9, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}