'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import type { User } from '@/types';

// Connect to your Node.js backend
const socket: Socket = io('http://localhost:4000');

export default function SessionPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState<string>('// Start coding here...');
  const [messages, setMessages] = useState<{sender: string, text: string, name: string}[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setup = async () => {
      const u = await getCurrentUser();
      if (!u) {
        router.push('/auth');
        return;
      }
      setUser(u);

      // 1. Join the Socket Room
      socket.emit('join_session', { sessionId, userId: u.id });

      // 2. Listen for Code Changes
      socket.on('code_update', (newCode: string) => {
        setCode(newCode);
      });

      // 3. Listen for Chat Messages
      socket.on('receive_message', (data) => {
        setMessages((prev) => [...prev, data]);
      });
    };

    setup();

    return () => {
      socket.off('code_update');
      socket.off('receive_message');
    };
  }, [sessionId, router]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      socket.emit('code_change', { sessionId, code: value });
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const msgData = {
      room: sessionId,
      sender: user.id,
      name: user.full_name,
      text: input
    };

    socket.emit('send_message', msgData);
    setMessages((prev) => [...prev, msgData]);
    setInput('');
  };

  if (!user) return <div style={{color: 'white', padding: 20}}>Loading Session...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: '100vh', background: '#0a0b0f' }}>
      
      {/* LEFT: CODE EDITOR */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1f26' }}>
        <div style={{ padding: '10px 20px', background: '#111218', color: '#888', fontSize: 12, borderBottom: '1px solid #1e1f26' }}>
           SESSION ID: {sessionId} • ROLE: {user.role.toUpperCase()}
        </div>
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="javascript"
          value={code}
          onChange={handleCodeChange}
          options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 20 } }}
        />
      </div>

      {/* RIGHT: CHAT BOX */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#0d0e14' }}>
        <div style={{ padding: '15px', fontWeight: 600, borderBottom: '1px solid #1e1f26', color: '#fff' }}>Session Chat</div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.sender === user.id ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 2, textAlign: m.sender === user.id ? 'right' : 'left' }}>{m.name}</div>
              <div style={{ 
                background: m.sender === user.id ? '#7c6fff' : '#1e1f26', 
                color: '#fff', padding: '8px 12px', borderRadius: 12, fontSize: 13 
              }}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendChat} style={{ padding: '15px', borderTop: '1px solid #1e1f26' }}>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ 
              width: '100%', background: '#1e1f26', border: '1px solid #333', 
              color: '#fff', padding: '10px', borderRadius: 8, outline: 'none' 
            }}
          />
        </form>
      </div>
    </div>
  );
}