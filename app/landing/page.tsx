'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const FEATURES = [
  {
    icon: '⬡',
    title: 'Live Video Sessions',
    desc: 'Crystal-clear WebRTC peer-to-peer video — no plugins, no lag, just you and your mentor.',
    accent: '#7c6fff',
  },
  {
    icon: '⌨',
    title: 'Collaborative Code Editor',
    desc: 'Real-time code sync powered by Monaco Editor. Both cursors visible, zero conflict.',
    accent: '#3ecf8e',
  },
  {
    icon: '⬟',
    title: 'Session Chat',
    desc: 'Drop links, paste snippets, share resources — all within the session window.',
    accent: '#ff7b54',
  },
  {
    icon: '◈',
    title: 'Session History',
    desc: 'Every session is logged. Review code, notes and recordings any time after.',
    accent: '#ffd166',
  },
];

const MENTORS = [
  { name: 'Priya Nair',   role: 'SDE-III @ Google',    tag: 'DSA · System Design', initials: 'PN', color: '#7c6fff', rating: 4.9, sessions: 142 },
  { name: 'Arjun Mehra',  role: 'Backend Lead @ Swiggy', tag: 'Node.js · PostgreSQL', initials: 'AM', color: '#3ecf8e', rating: 4.8, sessions: 98 },
  { name: 'Sara Kapoor',  role: 'ML Eng @ Flipkart',   tag: 'Python · ML Ops',     initials: 'SK', color: '#ff7b54', rating: 5.0, sessions: 61 },
];

const STATS = [
  { value: '2,400+', label: 'Sessions completed' },
  { value: '340+',   label: 'Expert mentors' },
  { value: '98%',    label: 'Satisfaction rate' },
  { value: '< 5min', label: 'Average wait time' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 5vw',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,11,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#fff',
            boxShadow: '0 0 16px rgba(124,111,255,0.5)',
          }}>M</span>
          MentorSpace
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/auth" style={{
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid var(--border-hi)',
            color: 'var(--muted2)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none', transition: 'all 0.15s',
          }}>Sign in</Link>
          <Link href="/auth?tab=signup" style={{
            padding: '8px 18px', borderRadius: 8,
            background: 'var(--accent)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 0 20px rgba(124,111,255,0.35)',
            transition: 'all 0.15s',
          }}>Get started</Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 5vw 80px',
        position: 'relative',
        textAlign: 'center',
      }}>
        {/* Radial glow blobs */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(124,111,255,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '60%', left: '20%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(62,207,142,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div className="fade-up-1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 14px', borderRadius: 20,
          border: '1px solid rgba(124,111,255,0.3)',
          background: 'rgba(124,111,255,0.08)',
          fontSize: 12, fontWeight: 500, color: 'var(--accent)',
          marginBottom: 32, letterSpacing: '0.5px',
        }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Now in beta · Free for students
        </div>

        <h1 className="fade-up-2" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(42px, 7vw, 80px)',
          fontWeight: 800, lineHeight: 1.05,
          letterSpacing: '-2px',
          maxWidth: 820,
          marginBottom: 24,
        }}>
          Learn faster with a{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            dedicated mentor
          </span>
          {' '}by your side
        </h1>

        <p className="fade-up-3" style={{
          fontSize: 18, color: 'var(--muted2)', maxWidth: 540,
          lineHeight: 1.7, marginBottom: 44,
        }}>
          Live 1-on-1 sessions with video, real-time collaborative code editor, and chat — everything you need to go from confused to confident.
        </p>

        <div className="fade-up-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/auth?tab=signup&role=student" style={{
            padding: '14px 32px', borderRadius: 10,
            background: 'var(--accent)', color: '#fff',
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 0 32px rgba(124,111,255,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}>
            Find a mentor →
          </Link>
          <Link href="/auth?tab=signup&role=mentor" style={{
            padding: '14px 32px', borderRadius: 10,
            border: '1px solid var(--border-hi)', color: 'var(--text)',
            fontSize: 15, fontWeight: 500, textDecoration: 'none',
            background: 'var(--bg3)', transition: 'all 0.15s',
          }}>
            Become a mentor
          </Link>
        </div>

        {/* Stats row */}
        <div className="fade-up-5" style={{
          display: 'flex', gap: 40, marginTop: 72,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section style={{ padding: '80px 5vw', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Platform</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-1px' }}>
            Everything in one session
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '28px 24px',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${f.accent}40`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${f.accent}18`, border: `1px solid ${f.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 16, color: f.accent,
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MENTORS ─────────────────────────────────────── */}
      <section style={{ padding: '80px 5vw', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Mentors</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-1px' }}>
            Learn from the best
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {MENTORS.map(m => (
            <div key={m.name} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16,
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${m.color}22`, border: `1.5px solid ${m.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: m.color,
                }}>{m.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.role}</div>
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--bg4)', border: '1px solid var(--border-hi)',
                fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--font-mono)',
              }}>{m.tag}</div>
              <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>★ {m.rating}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Rating</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{m.sessions}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Sessions</div>
                </div>
              </div>
              <Link href="/auth?tab=signup" style={{
                padding: '10px', borderRadius: 8, textAlign: 'center',
                background: `${m.color}18`, border: `1px solid ${m.color}30`,
                color: m.color, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                transition: 'background 0.15s',
              }}>Book a session</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 5vw 100px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          padding: '60px 40px',
          background: 'var(--bg3)',
          border: '1px solid var(--border-hi)',
          borderRadius: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(124,111,255,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 16, position: 'relative' }}>
            Start your first session today
          </h2>
          <p style={{ color: 'var(--muted2)', fontSize: 15, marginBottom: 32, position: 'relative' }}>
            Free for students. No credit card required.
          </p>
          <Link href="/auth?tab=signup" style={{
            display: 'inline-block',
            padding: '14px 36px', borderRadius: 10,
            background: 'var(--accent)', color: '#fff',
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 0 32px rgba(124,111,255,0.45)',
            position: 'relative',
          }}>
            Get started for free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 5vw',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--muted)' }}>
          MentorSpace
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          © {new Date().getFullYear()} MentorSpace. Built for Labmentix.
        </div>
      </footer>
    </div>
  );
}
