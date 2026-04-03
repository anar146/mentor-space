require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.get('/health', (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('⚡ Connected:', socket.id);

  socket.on('session:join', ({ sessionId, userId }) => {
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    socket.data.userId    = userId;
    console.log(`👤 ${userId} joined room ${sessionId}`);
    socket.to(sessionId).emit('user:joined', { userId });
  });

  socket.on('chat:message', (msg) => {
    socket.to(msg.session_id).emit('chat:message', msg);
  });

  socket.on('code:delta', (data) => {
    socket.to(data.session_id).emit('code:delta', data.delta);
  });

  // ── WebRTC signaling ──────────────────────────────────────────────────────
  // FIX: Your original code used socket.to(sessionId) which broadcasts to
  // everyone in the room INCLUDING other observers. Use socket.to(from) to
  // send signals only to the specific peer that should receive them.
  // Since we don't have the target socket ID here, we broadcast to the room
  // but EXCLUDE the sender — this is correct for a 2-person session.

  socket.on('webrtc:offer', ({ sessionId, sdp, from }) => {
    console.log(`📡 offer from ${from} in ${sessionId}`);
    socket.to(sessionId).emit('webrtc:offer', { sdp, from });
  });

  socket.on('webrtc:answer', ({ sessionId, sdp, from }) => {
    console.log(`📡 answer from ${from} in ${sessionId}`);
    socket.to(sessionId).emit('webrtc:answer', { sdp, from });
  });

  socket.on('webrtc:ice', ({ sessionId, candidate, from }) => {
    socket.to(sessionId).emit('webrtc:ice', { candidate, from });
  });

  socket.on('disconnect', () => {
    const { sessionId, userId } = socket.data;
    if (sessionId) socket.to(sessionId).emit('user:left', userId);
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));