import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/inMemoryDb';
import { MatchmakingRequest, CallSession } from '../types';

export interface MatchResult {
  roomId: string;
  peerA: MatchmakingRequest;
  peerB: MatchmakingRequest;
  session: CallSession;
}

export class MatchmakerService {
  // Queue of users currently waiting for a match
  private static waitingQueue: MatchmakingRequest[] = [];
  // Active socket id to current room mapping
  private static socketToRoom: Map<string, string> = new Map();
  // Room to active call session mapping
  private static activeRooms: Map<string, CallSession> = new Map();

  /**
   * Add a user to the matchmaking pool
   */
  static enqueueUser(userId: string, socketId: string): MatchResult | null {
    // Remove if already in queue or already in a call
    this.dequeueBySocketId(socketId);

    const user = db.getUserById(userId);
    if (!user || user.isBanned) {
      return null;
    }

    db.updateUser(userId, { status: 'SEARCHING' });

    // Look for a peer in the queue that is not the same user
    const peerIndex = this.waitingQueue.findIndex((req) => req.userId !== userId);

    if (peerIndex !== -1) {
      // Found a match!
      const peer = this.waitingQueue.splice(peerIndex, 1)[0];
      const currentReq: MatchmakingRequest = {
        userId,
        socketId,
        joinedAt: Date.now(),
      };

      const roomId = `room_match_${uuidv4().substring(0, 8)}`;
      
      const session: CallSession = {
        id: `call_${uuidv4().substring(0, 8)}`,
        type: 'RANDOM_AUDIO',
        callerId: peer.userId,
        calleeId: currentReq.userId,
        status: 'CONNECTED',
        startedAt: new Date().toISOString(),
        roomId,
      };

      this.activeRooms.set(roomId, session);
      this.socketToRoom.set(socketId, roomId);
      this.socketToRoom.set(peer.socketId, roomId);

      db.updateUser(userId, { status: 'BUSY' });
      db.updateUser(peer.userId, { status: 'BUSY' });
      db.callSessions.set(session.id, session);

      console.log(`[MATCHMAKER] Paired ${userId} and ${peer.userId} in room ${roomId}`);

      return {
        roomId,
        peerA: peer,
        peerB: currentReq,
        session,
      };
    } else {
      // No match available right now, add to waiting queue
      this.waitingQueue.push({
        userId,
        socketId,
        joinedAt: Date.now(),
      });
      console.log(`[MATCHMAKER] Enqueued user ${userId} (Queue size: ${this.waitingQueue.length})`);
      return null;
    }
  }

  /**
   * Remove a user from waiting queue
   */
  static dequeueBySocketId(socketId: string) {
    const index = this.waitingQueue.findIndex((req) => req.socketId === socketId);
    if (index !== -1) {
      const removed = this.waitingQueue.splice(index, 1)[0];
      db.updateUser(removed.userId, { status: 'ONLINE' });
      console.log(`[MATCHMAKER] Dequeued user ${removed.userId}`);
    }
  }

  /**
   * Get room info for a socket
   */
  static getRoomBySocketId(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
  }

  /**
   * End or skip a room
   */
  static endRoom(roomId: string): CallSession | undefined {
    const session = this.activeRooms.get(roomId);
    if (session) {
      session.status = 'ENDED';
      session.endedAt = new Date().toISOString();
      if (session.startedAt) {
        const diffMs = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
        session.durationSeconds = Math.round(diffMs / 1000);
      }
      this.activeRooms.delete(roomId);
      db.updateUser(session.callerId, { status: 'ONLINE' });
      db.updateUser(session.calleeId, { status: 'ONLINE' });
      console.log(`[MATCHMAKER] Ended call room ${roomId} (Duration: ${session.durationSeconds || 0}s)`);
    }

    // Clean up socketToRoom map
    for (const [sId, rId] of this.socketToRoom.entries()) {
      if (rId === roomId) {
        this.socketToRoom.delete(sId);
      }
    }

    return session;
  }

  static getQueueLength(): number {
    return this.waitingQueue.length;
  }

  static getActiveCallCount(): number {
    return this.activeRooms.size;
  }
}
