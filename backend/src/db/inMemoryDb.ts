import { User, AppEvent, CelebrityProfile, TicketBooking, SupportTicket, SupportMessage, CallSession } from '../types';

class InMemoryDatabase {
  users: Map<string, User> = new Map();
  phoneToUserId: Map<string, string> = new Map();
  events: Map<string, AppEvent> = new Map();
  celebrities: Map<string, CelebrityProfile> = new Map();
  tickets: Map<string, TicketBooking> = new Map();
  supportTickets: Map<string, SupportTicket> = new Map();
  supportMessages: Map<string, SupportMessage[]> = new Map();
  callSessions: Map<string, CallSession> = new Map();
  otpStore: Map<string, string> = new Map(); // phone -> OTP

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Super Admin
    const adminUser: User = {
      id: 'usr_admin_1',
      phone: '+919999999999',
      name: 'Super Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      role: 'ADMIN',
      status: 'ONLINE',
      isVerified: true,
      city: 'Kochi',
      createdAt: new Date().toISOString(),
    };
    this.addUser(adminUser);

    // 2. Customer Care Support Agent
    const supportUser: User = {
      id: 'usr_support_1',
      phone: '+918888888888',
      name: 'Customer Care Desk 1',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      role: 'SUPPORT',
      status: 'ONLINE',
      isVerified: true,
      city: 'Bangalore',
      createdAt: new Date().toISOString(),
    };
    this.addUser(supportUser);

    // 3. Celebrity User
    const celebUser: User = {
      id: 'usr_celeb_1',
      phone: '+917777777777',
      name: 'Dulquer Salmaan (Verified)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      role: 'CELEBRITY',
      status: 'ONLINE',
      isVerified: true,
      city: 'Kochi',
      bio: 'Film Actor & Producer. Connect directly on live calls!',
      createdAt: new Date().toISOString(),
    };
    this.addUser(celebUser);

    const celebProfile: CelebrityProfile = {
      userId: celebUser.id,
      stageName: 'Dulquer Salmaan',
      category: 'Cinema & Arts',
      isAvailableForCalls: true,
      audioRatePerMinute: 150,
      videoRatePerMinute: 300,
      totalEarnings: 45000,
      media: [
        {
          id: 'med_1',
          celebrityId: celebUser.id,
          type: 'IMAGE',
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          caption: 'Behind the scenes at the latest film shoot!',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'med_2',
          celebrityId: celebUser.id,
          type: 'IMAGE',
          url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
          caption: 'Great interacting with fans today ✨',
          createdAt: new Date().toISOString(),
        }
      ]
    };
    this.celebrities.set(celebUser.id, celebProfile);

    // 4. Organization User
    const orgUser: User = {
      id: 'usr_org_1',
      phone: '+916666666666',
      name: 'Kerala Music Fest Events LLC',
      avatarUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80',
      role: 'ORGANIZATION',
      status: 'ONLINE',
      isVerified: true,
      city: 'Kochi',
      bio: 'Premier music and cultural event organizing company.',
      createdAt: new Date().toISOString(),
    };
    this.addUser(orgUser);

    // Sample Event in Kochi (Lat: 9.9816, Lon: 76.2999)
    const event1: AppEvent = {
      id: 'evt_kochi_music_fest',
      organizationId: orgUser.id,
      organizationName: orgUser.name,
      title: 'Grand Kochi Indie Music & Art Carnival 2026',
      description: 'Experience an electrifying evening with top artists, indie bands, food trucks, and live interactions!',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      category: 'Music & Concerts',
      locationName: 'Jawaharlal Nehru International Stadium Ground, Kochi',
      latitude: 9.9983,
      longitude: 76.3005,
      startDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days later
      endDate: new Date(Date.now() + 86400000 * 3 + 18000000).toISOString(),
      ticketTiers: [
        {
          id: 'tier_general',
          name: 'General Pass',
          price: 499,
          currency: 'INR',
          availableQuantity: 450,
          totalQuantity: 500
        },
        {
          id: 'tier_vip',
          name: 'VIP Front Row Pass',
          price: 1499,
          currency: 'INR',
          availableQuantity: 40,
          totalQuantity: 50
        }
      ],
      createdAt: new Date().toISOString()
    };
    this.events.set(event1.id, event1);

    // 5. Sample Normal Users for Random Calling Testing
    const user1: User = {
      id: 'usr_normal_1',
      phone: '+919876543210',
      name: 'Arjun Das',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'USER',
      status: 'ONLINE',
      city: 'Kochi',
      latitude: 9.9816,
      longitude: 76.2999,
      isPremium: true,
      createdAt: new Date().toISOString(),
    };
    this.addUser(user1);

    const user2: User = {
      id: 'usr_normal_2',
      phone: '+919876543211',
      name: 'Ananya Nair',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      role: 'USER',
      status: 'ONLINE',
      city: 'Thiruvananthapuram',
      latitude: 8.5241,
      longitude: 76.9366,
      isPremium: false,
      createdAt: new Date().toISOString(),
    };
    this.addUser(user2);
  }

  addUser(user: User) {
    this.users.set(user.id, user);
    this.phoneToUserId.set(user.phone, user.id);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByPhone(phone: string): User | undefined {
    const id = this.phoneToUserId.get(phone);
    if (!id) return undefined;
    return this.users.get(id);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
}

export const db = new InMemoryDatabase();
