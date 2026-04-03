export type UserRole = 'mentor' | 'student';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  sessions_count?: number;
  created_at: string;
}

export type SessionStatus = 'scheduled' | 'waiting' | 'active' | 'ended';

export interface Session {
  id: string;
  mentor_id: string;
  student_id: string;
  topic: string;
  description?: string;
  status: SessionStatus;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  code_language: string;
  mentor?: User;
  student?: User;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  type: 'text' | 'code_snippet' | 'system';
  created_at: string;
}

export interface SessionNote {
  id: string;
  session_id: string;
  author_id: string;
  content: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  session_id: string;
  shared_by: string;
  title: string;
  url: string;
  created_at: string;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface CodeDelta {
  session_id: string;
  user_id: string;
  delta: unknown;
  cursor?: { line: number; column: number };
  timestamp: number;
}

export interface SocketEvents {
  // Session
  'session:join':   (data: { sessionId: string; userId: string; role: UserRole }) => void;
  'session:leave':  (data: { sessionId: string; userId: string }) => void;
  'user:joined':    (user: Pick<User, 'id' | 'full_name' | 'role'>) => void;
  'user:left':      (userId: string) => void;

  // WebRTC signaling
  'webrtc:offer':     (signal: WebRTCSignal) => void;
  'webrtc:answer':    (signal: WebRTCSignal) => void;
  'webrtc:ice':       (signal: WebRTCSignal) => void;

  // Code editor
  'code:delta':    (delta: CodeDelta) => void;
  'code:cursor':   (data: { userId: string; cursor: CodeDelta['cursor'] }) => void;

  // Chat
  'chat:message':  (msg: Message) => void;
  'chat:typing':   (data: { userId: string; isTyping: boolean }) => void;
}
