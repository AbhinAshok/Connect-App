export type UserRole = 'USER' | 'ORGANIZATION' | 'CELEBRITY' | 'SUPPORT' | 'ADMIN';

export type UserStatus = 'ONLINE' | 'BUSY' | 'OFFLINE' | 'SEARCHING';

export interface User {
  id: string;
  phone: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isVerified?: boolean;
  isBanned?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  bio?: string;
  createdAt: string;
  isPremium?: boolean;
}

export interface MatchmakingRequest {
  userId: string;
  socketId: string;
  joinedAt: number;
}

export type CallType = 'RANDOM_AUDIO' | 'CELEBRITY_AUDIO' | 'CELEBRITY_VIDEO' | 'SUPPORT_AUDIO' | 'SUPPORT_CHAT';

export type CallStatus = 'RINGING' | 'CONNECTED' | 'ENDED' | 'MISSED' | 'REJECTED';

export interface CallSession {
  id: string;
  type: CallType;
  callerId: string;
  calleeId: string;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  roomId: string;
}

export interface CelebrityProfile {
  userId: string;
  stageName: string;
  category: string; // e.g., 'Actor', 'Musician', 'Creator'
  isAvailableForCalls: boolean;
  audioRatePerMinute: number;
  videoRatePerMinute: number;
  media: CelebrityMedia[];
  totalEarnings: number;
}

export interface CelebrityMedia {
  id: string;
  celebrityId: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  caption?: string;
  createdAt: string;
}

export interface EventTicketTier {
  id: string;
  name: string; // e.g., 'General', 'VIP'
  price: number;
  currency: string;
  availableQuantity: number;
  totalQuantity: number;
}

export interface AppEvent {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  bannerUrl: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  ticketTiers: EventTicketTier[];
  createdAt: string;
}

export interface TicketBooking {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  ticketTierId: string;
  tierName: string;
  pricePaid: number;
  qrCodeToken: string;
  status: 'VALID' | 'CHECKED_IN' | 'CANCELLED';
  bookedAt: string;
}

export interface SupportTicket {
  id: string;
  requesterId: string;
  requesterRole: UserRole;
  requesterName: string;
  agentId?: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
}
