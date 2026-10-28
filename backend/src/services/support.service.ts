import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/inMemoryDb';
import { SupportTicket, SupportMessage, UserRole } from '../types';

export class SupportService {
  static createTicket(userId: string, subject: string): SupportTicket {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    const ticket: SupportTicket = {
      id: `tick_${uuidv4().substring(0, 8)}`,
      requesterId: user.id,
      requesterName: user.name,
      requesterRole: user.role,
      subject,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    db.supportTickets.set(ticket.id, ticket);
    db.supportMessages.set(ticket.id, [
      {
        id: `msg_${uuidv4().substring(0, 8)}`,
        ticketId: ticket.id,
        senderId: 'SYSTEM',
        senderName: 'Friend Connect Helpdesk Bot',
        senderRole: 'SUPPORT',
        message: `Hello ${user.name}! Your support session has started. An available support agent will join shortly. You can also initiate an audio call at any time.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return ticket;
  }

  static getTicketById(ticketId: string): SupportTicket | undefined {
    return db.supportTickets.get(ticketId);
  }

  static getTicketsForUser(userId: string): SupportTicket[] {
    return Array.from(db.supportTickets.values()).filter((t) => t.requesterId === userId);
  }

  static getAllTickets(): SupportTicket[] {
    return Array.from(db.supportTickets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static getMessages(ticketId: string): SupportMessage[] {
    return db.supportMessages.get(ticketId) || [];
  }

  static addMessage(
    ticketId: string,
    senderId: string,
    message: string
  ): SupportMessage {
    const ticket = db.supportTickets.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const sender = db.getUserById(senderId);
    const senderName = sender ? sender.name : 'Agent';
    const senderRole: UserRole = sender ? sender.role : 'SUPPORT';

    const msg: SupportMessage = {
      id: `msg_${uuidv4().substring(0, 8)}`,
      ticketId,
      senderId,
      senderName,
      senderRole,
      message,
      timestamp: new Date().toISOString(),
    };

    const list = db.supportMessages.get(ticketId) || [];
    list.push(msg);
    db.supportMessages.set(ticketId, list);

    return msg;
  }

  static assignAgent(ticketId: string, agentId: string) {
    const ticket = db.supportTickets.get(ticketId);
    if (ticket) {
      ticket.agentId = agentId;
      ticket.status = 'IN_PROGRESS';
    }
    return ticket;
  }
}
