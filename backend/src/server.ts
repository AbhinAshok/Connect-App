import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.routes';
import { MatchmakerService } from './services/matchmaker.service';
import { db } from './db/inMemoryDb';
import { SupportService } from './services/support.service';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for local Web dev, Android/iOS native WebSockets
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    matchmakingQueueLength: MatchmakerService.getQueueLength(),
    activeCalls: MatchmakerService.getActiveCallCount(),
  });
});

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Map of userId -> socketId for direct targeted calls (Celebrity / Support)
const userSocketMap = new Map<string, string>();
const socketUserMap = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // Register user session
  socket.on('register-user', ({ userId }: { userId: string }) => {
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);
    db.updateUser(userId, { status: 'ONLINE' });
    console.log(`[SOCKET] User ${userId} registered on socket ${socket.id}`);
  });

  // ================= 1. RANDOM FRIEND MATCHMAKING =================
  socket.on('join-matchmaking', ({ userId }: { userId: string }) => {
    console.log(`[MATCHMAKING] User ${userId} requested random match`);
    const match = MatchmakerService.enqueueUser(userId, socket.id);

    if (match) {
      const { roomId, peerA, peerB, session } = match;

      // Join both sockets to Socket.io room
      const socketA = io.sockets.sockets.get(peerA.socketId);
      const socketB = io.sockets.sockets.get(peerB.socketId);

      socketA?.join(roomId);
      socketB?.join(roomId);

      const userA = db.getUserById(peerA.userId);
      const userB = db.getUserById(peerB.userId);

      // Notify Peer A (Initiator)
      socketA?.emit('match-found', {
        roomId,
        callSessionId: session.id,
        isInitiator: true,
        peer: {
          id: userB?.id,
          name: userB?.name || 'Anonymous Friend',
          avatarUrl: userB?.avatarUrl,
        },
      });

      // Notify Peer B (Receiver)
      socketB?.emit('match-found', {
        roomId,
        callSessionId: session.id,
        isInitiator: false,
        peer: {
          id: userA?.id,
          name: userA?.name || 'Anonymous Friend',
          avatarUrl: userA?.avatarUrl,
        },
      });
    } else {
      socket.emit('waiting-for-peer', {
        message: 'Looking for a friend... You will be connected as soon as someone joins!',
        queuePosition: MatchmakerService.getQueueLength(),
      });
    }
  });

  socket.on('cancel-matchmaking', () => {
    MatchmakerService.dequeueBySocketId(socket.id);
    socket.emit('matchmaking-cancelled');
  });

  // ================= 2. WEBRTC SIGNALING =================
  // Relay SDP Offer
  socket.on('webrtc-offer', ({ roomId, offer }: { roomId: string; offer: any }) => {
    socket.to(roomId).emit('webrtc-offer', { offer, senderSocketId: socket.id });
  });

  // Relay SDP Answer
  socket.on('webrtc-answer', ({ roomId, answer }: { roomId: string; answer: any }) => {
    socket.to(roomId).emit('webrtc-answer', { answer, senderSocketId: socket.id });
  });

  // Relay ICE Candidate
  socket.on('webrtc-ice-candidate', ({ roomId, candidate }: { roomId: string; candidate: any }) => {
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate, senderSocketId: socket.id });
  });

  // Next / Skip friend in random call
  socket.on('skip-friend', ({ roomId, userId }: { roomId: string; userId: string }) => {
    console.log(`[CALL] User ${userId} skipped room ${roomId}`);
    MatchmakerService.endRoom(roomId);
    socket.to(roomId).emit('peer-left', { reason: 'Peer skipped the conversation.' });
    socket.leave(roomId);

    // Re-queue user automatically for another friend!
    const newMatch = MatchmakerService.enqueueUser(userId, socket.id);
    if (!newMatch) {
      socket.emit('waiting-for-peer', {
        message: 'Searching for your next friend...',
        queuePosition: MatchmakerService.getQueueLength(),
      });
    }
  });

  // End Call
  socket.on('end-call', ({ roomId }: { roomId: string }) => {
    console.log(`[CALL] Call ended in room ${roomId}`);
    MatchmakerService.endRoom(roomId);
    socket.to(roomId).emit('call-ended', { reason: 'Call ended by peer.' });
    socket.leave(roomId);
  });

  // ================= 3. DIRECT CALLS (CELEBRITY & SUPPORT) =================
  socket.on('direct-call-request', ({ callerId, calleeId, callType }: { callerId: string; calleeId: string; callType: string }) => {
    const calleeSocketId = userSocketMap.get(calleeId);
    const caller = db.getUserById(callerId);

    if (!calleeSocketId) {
      socket.emit('call-failed', { reason: 'User is currently offline.' });
      return;
    }

    const roomId = `direct_call_${callerId}_${calleeId}`;
    socket.join(roomId);

    io.to(calleeSocketId).emit('incoming-direct-call', {
      roomId,
      callType,
      caller: {
        id: caller?.id,
        name: caller?.name,
        avatarUrl: caller?.avatarUrl,
        role: caller?.role,
      },
    });
  });

  socket.on('accept-direct-call', ({ roomId }: { roomId: string }) => {
    socket.join(roomId);
    socket.to(roomId).emit('direct-call-accepted', { roomId });
  });

  socket.on('reject-direct-call', ({ roomId, reason }: { roomId: string; reason?: string }) => {
    socket.to(roomId).emit('direct-call-rejected', { reason: reason || 'Call rejected' });
  });

  // ================= 4. SUPPORT CHAT REAL-TIME =================
  socket.on('support-send-message', ({ ticketId, senderId, message }: { ticketId: string; senderId: string; message: string }) => {
    try {
      const msg = SupportService.addMessage(ticketId, senderId, message);
      io.emit(`support-ticket-${ticketId}-msg`, msg);
    } catch (err: any) {
      console.error('[SUPPORT CHAT ERROR]', err.message);
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    const userId = socketUserMap.get(socket.id);
    console.log(`[SOCKET] Client disconnected: ${socket.id} (User: ${userId || 'unknown'})`);

    MatchmakerService.dequeueBySocketId(socket.id);
    const room = MatchmakerService.getRoomBySocketId(socket.id);
    if (room) {
      MatchmakerService.endRoom(room);
      socket.to(room).emit('peer-left', { reason: 'Peer disconnected.' });
    }

    if (userId) {
      userSocketMap.delete(userId);
      socketUserMap.delete(socket.id);
      db.updateUser(userId, { status: 'OFFLINE' });
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Friend Connect Server running at http://localhost:${PORT}`);
  console.log(`📞 WebRTC Signaling & Redis Matchmaker active`);
  console.log(`=======================================================`);
});
