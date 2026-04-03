'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Tab     = 'login' | 'signup';
type Role    = 'student' | 'mentor';
type Status  = 'idle' | 'loading' | 'error';

// 1. THIS IS THE NEW WRAPPER
export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}

// 2. THIS IS YOUR ORIGINAL CODE (Moved into a Content component)
function AuthContent() {
  const router       = useRouter();
  const params       = useSearchParams();
  const [tab,    setTab]    = useState<Tab>((params.get('tab') as Tab) ?? 'login');
  const [role,   setRole]   = useState<Role>((params.get('role') as Role) ?? 'student');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  const [email,    setEmail]    = useState('');
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
    background: 'var(--bg3)',
    border: '1px solid var(--border-hi)',
    borderRadius: 9,
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(124,111,255,0.1) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
            color: 'var(--text)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 9,
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, background: 'var(--accent)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', boxShadow: '0 0 20px rgba(124,111,255,0.5)',
            }}>M</span>
            MentorSpace
          </Link>
        </div>

        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border-hi)',
          borderRadius: 16,
          padding: '32px 28px',
        }}>
          <div style={{
            display: 'flex', background: 'var(--bg3)',
            borderRadius: 9, padding: 4, marginBottom: 28,
            border: '1px solid var(--border)',
          }}>
            {(['login', 'signup'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 7,
                border: 'none', cursor: 'pointer',
                background: tab === t ? 'var(--bg4)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: tab === t ? 600 : 400,
                transition: 'all 0.15s',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
              }}>
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  I am a
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['student', 'mentor'] as Role[]).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)} style={{
                      padding: '12px 8px',
                      borderRadius: 9,
                      border: role === r ? '1.5px solid var(--accent)' : '1px solid var(--border-hi)',
                      background: role === r ? 'rgba(124,111,255,0.1)' : 'var(--bg3)',
                      color: role === r ? 'var(--accent)' : 'var(--muted2)',
                      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                      <span style={{ fontSize: 16 }}>{r === 'student' ? '🎓' : '🧑‍💻'}</span>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'signup' && (
              <input
                type="text" required placeholder="Full Name"
                value={fullName} onChange={e => setFullName(e.target.value)}
                style={inputStyle}
              />
            )}

            <input
              type="email" required placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />

            {errMsg && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.25)', color: 'var(--red)', fontSize: 13 }}>
                {errMsg}
              </div>
            )}

            <button type="submit" disabled={status === 'loading'} style={{
              padding: '12px', borderRadius: 9,
              background: status === 'loading' ? 'rgba(124,111,255,0.5)' : 'var(--accent)',
              border: 'none', color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 24px rgba(124,111,255,0.3)',
              transition: 'all 0.15s', marginTop: 4,
            }}>
              {status === 'loading' ? 'Please wait…' : tab === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button onClick={handleGoogleAuth} style={{
            width: '100%', padding: '11px',
            background: 'var(--bg3)', border: '1px solid var(--border-hi)',
            borderRadius: 9, color: 'var(--text)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          }}>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}