'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';
import type { User, Session } from '@/types';

/* ── HELPERS ── */
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: 'rgba(62,207,142,0.12)',  color: '#3ecf8e', label: 'Live' },
  scheduled: { bg: 'rgba(124,111,255,0.12)', color: '#7c6fff', label: 'Upcoming' },
  ended:     { bg: 'rgba(107,107,128,0.12)', color: '#6b6b80', label: 'Ended' },
  waiting:   { bg: 'rgba(255,209,102,0.12)', color: '#ffd166', label: 'Waiting' },
};

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, color, size = 38 }: { name: string; color?: string; size?: number }) {
  const initials = (name || 'User').split(' ').map(w => w[0]).join('').toUpperCase();
  const c = color ?? '#7c6fff';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `${c}22`, border: `1.5px solid ${c}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.34,
      color: c, flexShrink: 0,
    }}>{initials}</div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all');

  // 1. IMPROVED FETCH: Load User and Real Sessions
  useEffect(() => {
    const initDashboard = async () => {
      const u = await getCurrentUser();
      if (!u) {
        router.push('/auth');
        return;
      }
      setUser(u);

      // Build a smart query:
      // Mentors see their own created sessions.
      // Students see sessions they are in OR active sessions where student_id is empty.
      let query = supabase.from('sessions').select('*').order('created_at', { ascending: false });

      if (u.role === 'mentor') {
        query = query.eq('mentor_id', u.id);
      } else {
        query = query.or(`student_id.eq.${u.id},and(status.eq.active,student_id.is.null)`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setSessions(data);
      }
      setLoading(false);
    };

    initDashboard();
  }, [router]);

  // 2. MINIMAL INSERT: Let the DB handle defaults to avoid column errors
  const handleCreateSession = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        mentor_id: user.id, 
        topic: 'Live Mentorship Session' 
      }])
      .select()
      .single();

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    // Redirect to the session room
    router.push(`/session/${data.id}`);
  };

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    upcoming: sessions.filter(s => s.status === 'scheduled').length,
    ended: sessions.filter(s => s.status === 'ended').length,
  };

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: 18 }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 32px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,11,15,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#fff', boxShadow: '0 0 12px rgba(124,111,255,0.4)',
          }}>M</span>
          MentorSpace
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.role === 'mentor' && (
            <button 
              onClick={handleCreateSession}
              style={{
                padding: '7px 16px', borderRadius: 8, background: 'var(--accent2)',
                color: '#0a0b0f', border: 'none', fontSize: 13, fontWeight: 600, 
                cursor: 'pointer', boxShadow: '0 0 16px rgba(62,207,142,0.3)',
              }}
            >
              + New Session
            </button>
          )}
          {user && <Avatar name={user.full_name} size={32} />}
          <button onClick={handleSignOut} style={{
            padding: '7px 14px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border-hi)',
            color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
          }}>Sign out</button>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '32px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        <div className="fade-up-1" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted2)', fontSize: 14, marginTop: 4 }}>
            {user?.role === 'mentor' ? 'Your upcoming and active mentoring sessions.' : 'Join an active session or view your history.'}
          </p>
        </div>

        {/* ── STATS ── */}
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Total Sessions', value: stats.total,    color: 'var(--accent)' },
            { label: 'Active Now',     value: stats.active,   color: 'var(--accent2)' },
            { label: 'Upcoming',       value: stats.upcoming, color: 'var(--yellow)' },
            { label: 'Completed',      value: stats.ended,    color: 'var(--muted2)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '18px 20px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SESSIONS LIST ── */}
        <div className="fade-up-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Sessions</h2>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              {(['all', 'active', 'scheduled', 'ended'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: filter === f ? 'var(--bg4)' : 'transparent',
                  color: filter === f ? 'var(--text)' : 'var(--muted)',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: filter === f ? 600 : 400,
                  transition: 'all 0.12s', textTransform: 'capitalize',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '48px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ color: 'var(--muted)', fontSize: 15 }}>No {filter !== 'all' ? filter : ''} sessions found.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(sess => {
                const st = STATUS_STYLE[sess.status] || STATUS_STYLE.ended;
                return (
                  <div key={sess.id} style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '18px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <Avatar name={user?.role === 'mentor' ? 'Student' : 'Mentor'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{sess.topic}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Room ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{sess.id.slice(0,8)}...</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <span style={{
                        padding: '4px 10px', borderRadius: 20,
                        background: st.bg, color: st.color,
                        fontSize: 11, fontWeight: 600,
                      }}>{st.label}</span>
                      
                      {sess.status !== 'ended' && (
                        <Link href={`/session/${sess.id}`} style={{
                          padding: '7px 16px', borderRadius: 8,
                          background: sess.status === 'active' ? 'var(--accent2)' : 'var(--accent)',
                          color: sess.status === 'active' ? '#0a0b0f' : '#fff',
                          fontSize: 12, fontWeight: 600, textDecoration: 'none',
                        }}>
                          {sess.status === 'active' ? 'Join' : 'Open'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}