# MentorSpace — Frontend

> Next.js 14 + TypeScript frontend for the 1-on-1 Mentor–Student platform.

## Project Structure

```
app/
  landing/page.tsx        ← Public landing page
  auth/page.tsx           ← Login + Sign up (with Google OAuth)
  dashboard/page.tsx      ← Mentor & student dashboard
  session/[id]/page.tsx   ← Live session room (video + code + chat)

lib/
  supabase.ts             ← Supabase client + auth helpers
  socket.ts               ← Socket.io client singleton
  useWebRTC.ts            ← WebRTC hook (camera, mic, peer connection)

types/
  index.ts                ← Shared TypeScript types

styles/
  globals.css             ← Design tokens, animations, global styles
```

## Setup

```bash
# 1. Install deps
npm install

# 2. Copy env file and fill in your Supabase + backend URL
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

## Key Dependencies

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Auth + database |
| `socket.io-client` | Real-time events (chat, code sync, signaling) |
| `@monaco-editor/react` | VS Code–grade code editor |
| `yjs` + `y-monaco` | Conflict-free collaborative editing |

## Connecting to Your Backend

All socket events are typed in `types/index.ts` under `SocketEvents`.  
The WebRTC signaling (offer / answer / ICE) is handled in `lib/useWebRTC.ts`.  
Wire up your Express + Socket.io handlers to match these events.

## Pages

### `/landing`
Public marketing page with hero, features, mentor showcase, and CTA.

### `/auth`
- Login / signup tabs
- Role selection (mentor vs student) on signup
- Google OAuth via Supabase
- Redirects to `/dashboard` on success

### `/dashboard`
- Loads the current user from Supabase Auth
- Displays all sessions with status filter (all / active / upcoming / ended)
- Stats row (total, active, upcoming, completed)
- Join / open session buttons

### `/session/[id]`
- Left panel: WebRTC video, mic/cam controls, participant list, progress
- Center: Monaco Editor with language selector, real-time collab indicators
- Right panel: Chat (with typing indicator), Notes textarea, Resources list

## Deployment

```bash
# Vercel (recommended)
vercel --prod
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_BACKEND_URL` in your Vercel environment variables.
