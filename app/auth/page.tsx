'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [tab, setTab] = useState<'login' | 'signup'>((params.get('tab') as any) ?? 'login');
  const [role, setRole] = useState<'student' | 'mentor'>((params.get('role') as any) ?? 'student');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

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
          await supabase.from('users').insert({ id: data.user.id, email, full_name: fullName, role });
          router.push('/dashboard');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrMsg(err.message ?? 'Error');
      setStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: '#111', padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <h2 style={{ textAlign: 'center' }}>{tab === 'login' ? 'Sign In' : 'Sign Up'}</h2>
        
        {tab === 'signup' && (
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ padding: '10px', borderRadius: '5px' }} />
        )}
        
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '5px' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '5px' }} />
        
        <button type="submit" style={{ padding: '10px', background: '#7c6fff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {status === 'loading' ? '...' : 'Submit'}
        </button>
        
        <button type="button" onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#7c6fff', cursor: 'pointer' }}>
          Switch to {tab === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
        
        {errMsg && <p style={{ color: 'red', fontSize: '12px' }}>{errMsg}</p>}
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}