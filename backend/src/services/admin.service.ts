import { db } from '../db/inMemoryDb';
import { MatchmakerService } from './matchmaker.service';
import { User } from '../types';

export class AdminService {
  static getPlatformStats() {
    const allUsers = Array.from(db.users.values());
    const allEvents = Array.from(db.events.values());
    const allTickets = Array.from(db.tickets.values());
    const allCalls = Array.from(db.callSessions.values());

    const totalRevenue = allTickets.reduce((sum, t) => sum + t.pricePaid, 0);

    return {
      users: {
        total: allUsers.length,
        normalUsers: allUsers.filter((u) => u.role === 'USER').length,
        celebrities: allUsers.filter((u) => u.role === 'CELEBRITY').length,
        organizations: allUsers.filter((u) => u.role === 'ORGANIZATION').length,
        supportStaff: allUsers.filter((u) => u.role === 'SUPPORT').length,
        bannedUsers: allUsers.filter((u) => u.isBanned).length,
      },
      liveActivity: {
        activeAudioCalls: MatchmakerService.getActiveCallCount(),
        matchmakingQueue: MatchmakerService.getQueueLength(),
        totalCallsLogged: allCalls.length,
      },
      events: {
        totalEvents: allEvents.length,
        ticketsSold: allTickets.length,
        totalTicketRevenue: totalRevenue,
      },
    };
  }

  static toggleUserBan(userId: string, isBanned: boolean): User {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.isBanned = isBanned;
    console.log(`[ADMIN] User ${user.name} (${user.id}) banned status set to: ${isBanned}`);
    return user;
  }

  static verifyUser(userId: string, isVerified: boolean): User {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.isVerified = isVerified;
    console.log(`[ADMIN] User ${user.name} (${user.id}) verification status set to: ${isVerified}`);
    return user;
  }

  static toggleUserPremium(userId: string, isPremium: boolean): User {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.isPremium = isPremium;
    return user;
  }
}
