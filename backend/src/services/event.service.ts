import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/inMemoryDb';
import { AppEvent, TicketBooking } from '../types';

export class EventService {
  /**
   * Haversine formula to calculate great-circle distance between two coordinates in kilometers
   */
  private static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // 1 decimal place
  }

  /**
   * Get events with optional distance calculation from user's coordinates
   */
  static getEvents(params: {
    userLat?: number;
    userLon?: number;
    radiusKm?: number;
    category?: string;
  }): Array<AppEvent & { distanceKm?: number }> {
    const allEvents = Array.from(db.events.values());

    return allEvents
      .map((event) => {
        let distanceKm: number | undefined = undefined;
        if (params.userLat !== undefined && params.userLon !== undefined) {
          distanceKm = this.calculateDistanceKm(
            params.userLat,
            params.userLon,
            event.latitude,
            event.longitude
          );
        }
        return { ...event, distanceKm };
      })
      .filter((event) => {
        // Filter by radius if user coords and radius provided
        if (params.radiusKm && event.distanceKm !== undefined) {
          if (event.distanceKm > params.radiusKm) return false;
        }
        // Filter by category
        if (params.category && params.category !== 'ALL') {
          if (event.category.toLowerCase() !== params.category.toLowerCase()) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort closest first if distance exists
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
  }

  static getEventById(id: string): AppEvent | undefined {
    return db.events.get(id);
  }

  static createEvent(orgId: string, eventData: Omit<AppEvent, 'id' | 'organizationId' | 'organizationName' | 'createdAt'>): AppEvent {
    const org = db.getUserById(orgId);
    if (!org || org.role !== 'ORGANIZATION') {
      throw new Error('Only verified Organization accounts can post events.');
    }

    const newEvent: AppEvent = {
      ...eventData,
      id: `evt_${uuidv4().substring(0, 8)}`,
      organizationId: org.id,
      organizationName: org.name,
      createdAt: new Date().toISOString(),
    };

    db.events.set(newEvent.id, newEvent);
    console.log(`[EVENTS] Event created: "${newEvent.title}" by ${org.name}`);
    return newEvent;
  }

  static bookTicket(params: {
    eventId: string;
    userId: string;
    tierId: string;
  }): TicketBooking {
    const event = db.events.get(params.eventId);
    if (!event) throw new Error('Event not found');

    const user = db.getUserById(params.userId);
    if (!user) throw new Error('User not found');

    const tier = event.ticketTiers.find((t) => t.id === params.tierId);
    if (!tier) throw new Error('Invalid ticket tier');
    if (tier.availableQuantity <= 0) throw new Error('Tickets for this tier are sold out');

    // Deduct quantity
    tier.availableQuantity -= 1;

    const qrToken = `TKT-${uuidv4().substring(0, 12).toUpperCase()}`;
    const booking: TicketBooking = {
      id: `tkt_book_${uuidv4().substring(0, 8)}`,
      eventId: event.id,
      userId: user.id,
      userName: user.name,
      ticketTierId: tier.id,
      tierName: tier.name,
      pricePaid: tier.price,
      qrCodeToken: qrToken,
      status: 'VALID',
      bookedAt: new Date().toISOString(),
    };

    db.tickets.set(booking.id, booking);
    console.log(`[TICKETING] Ticket booked for ${user.name} on event ${event.title}`);
    return booking;
  }

  static getUserTickets(userId: string): TicketBooking[] {
    return Array.from(db.tickets.values()).filter((t) => t.userId === userId);
  }

  static verifyAndCheckInTicket(qrCodeToken: string, orgId: string): { success: boolean; message: string; booking?: TicketBooking } {
    const booking = Array.from(db.tickets.values()).find((t) => t.qrCodeToken === qrCodeToken);
    if (!booking) {
      return { success: false, message: 'Invalid ticket token' };
    }

    const event = db.events.get(booking.eventId);
    if (!event || event.organizationId !== orgId) {
      return { success: false, message: 'Ticket does not belong to your organization event' };
    }

    if (booking.status === 'CHECKED_IN') {
      return { success: false, message: 'Ticket already used / checked in', booking };
    }

    booking.status = 'CHECKED_IN';
    return { success: true, message: `Ticket checked in successfully for ${booking.userName}`, booking };
  }
}
