'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useWebRTC } from '@/lib/useWebRTC';
import type { User, Message } from '@/types';

import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0e14', color: 'var(--muted)', fontSize: 14 }}>
      Loading editor…
    </div>
  ),
});

type SideTab = 'chat' | 'notes' | 'resources';
const LANGS = ['python', 'typescript', 'javascript', 'cpp', 'java', 'go', 'rust'];

const INITIAL_MSGS: Message[] = [
  { id: '1', session_id: 's1', sender_id: 'mentor', content: 'Session started. Ready to dive in?',                    type: 'system', created_at: new Date(Date.now() - 2_700_000).toISOString() },
  { id: '2', session_id: 's1', sender_id: 'mentor', content: "Let's start with the inorder traversal. What DS would you use?", type: 'text',   created_at: new Date(Date.now() - 2_400_000).toISOString() },
  { id: '3', session_id: 's1', sender_id: 'student', content: 'A stack? Push nodes until null, then pop & backtrack.',  type: 'text',   created_at: new Date(Date.now() - 2_300_000).toISOString() },
  { id: '4', session_id: 's1', sender_id: 'mentor', content: 'Exactly! I added the base case at line 14 — take it from there.', type: 'text', created_at: new Date(Date.now() - 2_000_000).toISOString() },
];

const STARTER_CODE = `# Binary Tree Inorder Traversal
# LeetCode #94 · Iterative approach

from typing import List, Optional

class TreeNode:
    def __init__(self, val=0):
        self.val   = val
        self.left  = None
        self.right = None

class Solution:
    def inorderTraversal(
        self,
        root: Optional[TreeNode]
    ) -> List[int]:
        if not root:
            return []

        result, stack = [], []
        curr = root

        while curr or stack:
            while curr:
                stack.append(curr)
                curr = curr.left
            curr = stack.pop()
            result.append(curr.val)  # visit node
            curr = curr.right

        return result
`;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function pad2(n: number) { return String(n).padStart(2, '0'); }
function fmtDuration(secs: number) {
  return `${pad2(Math.floor(secs / 3600))}:${pad2(Math.floor((secs % 3600) / 60))}:${pad2(secs % 60)}`;
}

export default function SessionRoom() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [user,       setUser]       = useState<User | null>(null);
  const [messages,   setMessages]   = useState<Message[]>(INITIAL_MSGS);
  const [code,       setCode]       = useState(STARTER_CODE);
  const [lang,       setLang]       = useState('python');
  const [sideTab,    setSideTab]    = useState<SideTab>('chat');
  const [chatInput,  setChatInput]  = useState('');
  const [notes,      setNotes]      = useState('Binary Tree Traversal\n- Inorder: Left → Root → Right\n- Stack-based: O(n) time, O(h) space\n\nTODO: LeetCode #94, #144, #145');
  const [elapsed,    setElapsed]    = useState(0);
  const [isTyping,   setIsTyping]   = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef      = useRef<ReturnType<typeof connectSocket>>();

  // ── GEMINI'S WORKING WebRTC signature ──────────────────────────────────────
  const {
    localVideoRef,
    remoteVideoRef,
    isMicOn,
    isCamOn,
    isConnected,
    isScreenSharing,
    initiateCall,
    startScreenShare,
    stopScreenShare,
    toggleMic,
    toggleCam,
    hangUp,
  } = useWebRTC(params.id, user?.id ?? '');

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Auth + Socket ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) { router.push('/auth'); return; }
      setUser(u);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      socketRef.current = connectSocket(session.access_token);
      const sock = socketRef.current;

      sock.emit('session:join', { sessionId: params.id, userId: u.id, role: u.role });

      sock.on('chat:message', (msg) => setMessages(p => [...p, msg]));
      sock.on('code:delta',   (delta: any) => { setCode(delta); });
      // GEMINI FIX: mentor initiates the call when student joins
      sock.on('user:joined',  () => {
        setPeerOnline(true);
        if (u.role === 'mentor') initiateCall();
      });
      sock.on('user:left', () => setPeerOnline(false));
    })();
    return () => { disconnectSocket(); };
  }, [params.id, router]); // intentionally no initiateCall dep to avoid re-registering

  // ── Scroll chat ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function sendMessage() {
    if (!chatInput.trim() || !user) return;
    const msg: Message = {
      id: Date.now().toString(),
      session_id: params.id,
      sender_id: user.id,
      content: chatInput.trim(),
      type: 'text',
      created_at: new Date().toISOString(),
    };
    socketRef.current?.emit('chat:message', msg);
    setMessages(p => [...p, msg]);
    setChatInput('');
  }

  function endSession() {
    hangUp();
    disconnectSocket();
    router.push('/dashboard');
  }

  // ── Design tokens ──────────────────────────────────────────────────────────
  const ACCENT    = '#7c6fff';
  const ACCENT2   = '#3ecf8e';
  const BG2       = '#0f1016';
  const BG3       = '#14151e';
  const BORDER    = 'rgba(255,255,255,0.06)';
  const BORDER_HI = 'rgba(255,255,255,0.12)';

  return (
    <div style={{ height: '100vh', background: '#0a0b0f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: BG2, borderBottom: `1px solid ${BORDER}`,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: ACCENT, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>M</span>
          </div>
          <div style={{ width: 1, height: 20, background: BORDER_HI }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,92,122,0.12)', border: '1px solid rgba(255,92,122,0.22)', fontSize: 11, fontWeight: 600, color: '#ff5c7a' }}>
            <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff5c7a', display: 'inline-block' }} />
            LIVE
          </span>
          <span style={{ padding: '3px 9px', borderRadius: 20, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, fontSize: 11, fontWeight: 600, color: ACCENT }}>
            Binary Trees · DSA
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted2)' }}>
            ⏱ {fmtDuration(elapsed)}
          </span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ background: BG3, border: `1px solid ${BORDER_HI}`, borderRadius: 7, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '5px 10px', cursor: 'pointer', outline: 'none' }}>
            {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* WORKING screen share button from Gemini */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              border: isScreenSharing ? `1px solid ${ACCENT}` : `1px solid ${BORDER_HI}`,
              background: isScreenSharing ? `${ACCENT}22` : BG3,
              color: isScreenSharing ? ACCENT : 'var(--text)',
            }}
          >
            {isScreenSharing ? '⏹ Stop Sharing' : '🖥 Share Screen'}
          </button>

          <button onClick={endSession} style={{ padding: '6px 14px', borderRadius: 7, background: 'rgba(255,92,122,0.12)', border: '1px solid rgba(255,92,122,0.25)', color: '#ff5c7a', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            End Session
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN GRID ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 300px', overflow: 'hidden' }}>

        {/* ── LEFT: VIDEO + PARTICIPANTS ─────────────────────────────────── */}
        <div style={{ background: BG2, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Remote video tile */}
          <div style={{ position: 'relative', aspectRatio: '16/10', flexShrink: 0, background: '#090a10', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: isConnected ? 'block' : 'none' }} />
            {!isConnected && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${ACCENT}22`, border: `1.5px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: ACCENT }}>
                  {peerOnline ? '...' : 'AK'}
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {peerOnline ? 'Connecting…' : 'Waiting for mentor'}
                </span>
              </div>
            )}
            {/* Name tag */}
            <div style={{ position: 'absolute', bottom: 7, left: 8, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              🎙 Arjun Kumar
            </div>
            {/* Self-view PIP */}
            <div style={{ position: 'absolute', bottom: 7, right: 8, width: 68, height: 50, borderRadius: 6, border: `1.5px solid ${BORDER_HI}`, background: '#141520', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: isCamOn ? 'block' : 'none' }} />
              {!isCamOn && (
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${ACCENT2}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: ACCENT2 }}>
                  {user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() ?? 'ME'}
                </div>
              )}
            </div>
          </div>

          {/* Video controls — GEMINI's working pattern */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {/* Start Call button — only when not yet connected */}
            {!isConnected && (
              <button onClick={initiateCall} style={{ padding: '6px 12px', borderRadius: 7, background: ACCENT2, color: '#000', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Start Call
              </button>
            )}
            <button onClick={toggleMic} title={isMicOn ? 'Mute' : 'Unmute'} style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${BORDER_HI}`, background: isMicOn ? BG3 : 'rgba(255,92,122,0.12)', color: isMicOn ? 'var(--text)' : '#ff5c7a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
              {isMicOn ? '🎙' : '🔇'}
            </button>
            <button onClick={toggleCam} title={isCamOn ? 'Camera off' : 'Camera on'} style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${BORDER_HI}`, background: isCamOn ? BG3 : 'rgba(255,92,122,0.12)', color: isCamOn ? 'var(--text)' : '#ff5c7a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
              {isCamOn ? '📹' : '🚫'}
            </button>
            <button title="Whiteboard" style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${BORDER_HI}`, background: BG3, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
              ✏️
            </button>
          </div>

          {/* Participants */}
          <div style={{ padding: '8px 10px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--muted)', flexShrink: 0 }}>
            Participants
          </div>
          {[
            { name: 'Arjun Kumar',                                role: 'Mentor',  initials: 'AK', color: ACCENT,  online: peerOnline },
            { name: user?.full_name ?? 'You',                     role: 'Student', initials: user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? 'ME', color: ACCENT2, online: true },
          ].map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', margin: '1px 6px', borderRadius: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}22`, border: `1.5px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: p.color, flexShrink: 0 }}>
                {p.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.role}</div>
              </div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.online ? ACCENT2 : 'var(--muted)', flexShrink: 0 }} />
            </div>
          ))}

          {/* Progress cards */}
          <div style={{ marginTop: 'auto', padding: '10px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--muted)', marginBottom: 7 }}>Progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {[
                { val: '3',   label: 'Done',  color: ACCENT },
                { val: '87%', label: 'Score', color: ACCENT2 },
              ].map(s => (
                <div key={s.label} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: CODE EDITOR ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0d0e14' }}>

          {/* File tabs */}
          <div style={{ display: 'flex', alignItems: 'center', background: BG2, borderBottom: `1px solid ${BORDER}`, padding: '0 12px', gap: 2, flexShrink: 0, overflowX: 'auto' }}>
            {['solution.py', 'utils.py'].map((f, i) => (
              <div key={f} style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)', color: i === 0 ? 'var(--text)' : 'var(--muted)', borderBottom: `2px solid ${i === 0 ? ACCENT : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                {i === 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT2, display: 'inline-block' }} />}
                {f}
              </div>
            ))}
          </div>

          {/* Collab toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: BG2, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ padding: '3px 9px', borderRadius: 5, background: `${ACCENT2}18`, border: `1px solid ${ACCENT2}28`, fontSize: 11, color: ACCENT2, fontFamily: 'var(--font-mono)' }}>{lang}</span>
            <button style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${BORDER_HI}`, background: BG3, color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>▶ Run</button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} /> You
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT2, display: 'inline-block' }} /> Peer editing
              </span>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MonacoEditor
              height="100%"
              language={lang}
              value={code}
              onChange={(v) => {
                setCode(v ?? '');
                socketRef.current?.emit('code:delta', {
                  session_id: params.id,
                  user_id: user?.id ?? '',
                  delta: v,
                  timestamp: Date.now(),
                });
              }}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                fontLigatures: true,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 14 },
                renderLineHighlight: 'gutter',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
              }}
            />
          </div>

          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 14px', background: BG2, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT2, display: 'inline-block' }} /> Synced
            </span>
            <span>UTF-8</span>
            <span style={{ marginLeft: 'auto', color: ACCENT2 }}>▶ Ctrl+Enter to run</span>
          </div>
        </div>

        {/* ── RIGHT: CHAT / NOTES / RESOURCES ──────────────────────────────── */}
        <div style={{ background: BG2, borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {(['chat', 'notes', 'resources'] as SideTab[]).map(t => (
              <button key={t} onClick={() => setSideTab(t)} style={{ flex: 1, padding: '10px 6px', border: 'none', cursor: 'pointer', background: 'transparent', color: sideTab === t ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: sideTab === t ? 600 : 400, borderBottom: `2px solid ${sideTab === t ? ACCENT : 'transparent'}`, transition: 'all 0.12s', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Chat tab ── */}
          {sideTab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(msg => {
                  const isMe     = msg.sender_id === user?.id;
                  const isSys    = msg.type === 'system';
                  const isMentor = msg.sender_id === 'mentor';

                  if (isSys) return (
                    <div key={msg.id} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', padding: '4px 12px', borderRadius: 20, alignSelf: 'center' }}>
                      {msg.content}
                    </div>
                  );

                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: isMentor ? `${ACCENT}22` : `${ACCENT2}22`, border: `1.5px solid ${isMentor ? ACCENT : ACCENT2}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, color: isMentor ? ACCENT : ACCENT2 }}>
                        {isMentor ? 'AK' : user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? 'ME'}
                      </div>
                      <div>
                        <div style={{ padding: '8px 10px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.5, maxWidth: 200, background: isMentor ? `${ACCENT}14` : BG3, border: `1px solid ${isMentor ? `${ACCENT}22` : BORDER}`, color: 'var(--text)' }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, paddingLeft: 2 }}>{fmtTime(msg.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${ACCENT2}22`, border: `1.5px solid ${ACCENT2}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, color: ACCENT2 }}>RS</div>
                    <div style={{ padding: '10px 12px', borderRadius: 9, background: BG3, border: `1px solid ${BORDER}`, display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: `typingDot 1.4s ${d}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ padding: '10px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: BG3, border: `1px solid ${BORDER_HI}`, borderRadius: 9, padding: '7px 10px' }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 12.5 }}
                  />
                  <button onClick={sendMessage} style={{ width: 26, height: 26, borderRadius: 6, background: ACCENT, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 11 }}>➤</button>
                </div>
              </div>
            </>
          )}

          {/* ── Notes tab ── */}
          {sideTab === 'notes' && (
            <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--muted)' }}>Session Notes</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ flex: 1, background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, resize: 'none', outline: 'none' }}
              />
            </div>
          )}

          {/* ── Resources tab ── */}
          {sideTab === 'resources' && (
            <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--muted)', marginBottom: 4 }}>Resources</div>
              {[
                { title: 'LeetCode #94 · Binary Tree Inorder', url: 'https://leetcode.com/problems/binary-tree-inorder-traversal', tag: 'Problem' },
                { title: 'Visualgo · Tree Traversals',          url: 'https://visualgo.net/en/bst',                                tag: 'Visual' },
                { title: 'Big O Complexity Cheatsheet',         url: 'https://bigocheatsheet.com',                                  tag: 'Reference' },
              ].map(r => (
                <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
                  style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '10px 12px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BORDER_HI)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{r.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}28` }}>{r.tag}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Shared by Arjun</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}