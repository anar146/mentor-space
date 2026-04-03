'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tab     = 'login' | 'signup';
type Role    = 'student' | 'mentor';
type Status  = 'idle' | 'loading' | 'error';

export default function AuthPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const [tab,    setTab]    = useState<Tab>((params.get('tab') as Tab) ?? 'login');
  const [role,   setRole]   = useState<Role>((params.get('role') as Role) ?? 'student');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  // Form fields
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
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(124,111,255,0.1) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
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

        {/* Card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border-hi)',
          borderRadius: 16,
          padding: '32px 28px',
        }}>
          {/* Tab switcher */}
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

            {/* Role picker (signup only) */}
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

            {/* Full name (signup only) */}
            {tab === 'signup' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text" required placeholder="Riya Sharma"
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-hi)')}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" required placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-hi)')}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" required placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-hi)')}
              />
            </div>

            {/* Error */}
            {errMsg && (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(255,92,122,0.1)',
                border: '1px solid rgba(255,92,122,0.25)',
                color: 'var(--red)', fontSize: 13,
              }}>
                {errMsg}
              </div>
            )}

            {/* Submit */}
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

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <button onClick={handleGoogleAuth} style={{
            width: '100%', padding: '11px',
            background: 'var(--bg3)', border: '1px solid var(--border-hi)',
            borderRadius: 9, color: 'var(--text)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg4)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg3)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
            }}>
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
