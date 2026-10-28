import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { CelebrityService } from '../services/celebrity.service';
import { SupportService } from '../services/support.service';
import { AdminService } from '../services/admin.service';
import { db } from '../db/inMemoryDb';

export const apiRouter = Router();

const getIdParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

// ================= AUTH ROUTES =================
apiRouter.post('/auth/send-otp', (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    const result = AuthService.sendOtp(phone);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/verify-otp', (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });
    const result = AuthService.verifyOtp(phone, otp);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  // Returns all seeded users for quick dev switching / demo login
  return res.json(Array.from(db.users.values()));
});

apiRouter.put('/auth/profile/:id', (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const updated = db.updateUser(id, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= EVENT & TICKETING ROUTES =================
apiRouter.get('/events', (req: Request, res: Response) => {
  const { lat, lon, radiusKm, category } = req.query;
  const userLat = lat ? parseFloat(lat as string) : undefined;
  const userLon = lon ? parseFloat(lon as string) : undefined;
  const rad = radiusKm ? parseFloat(radiusKm as string) : undefined;
  const cat = category ? (category as string) : undefined;

  const events = EventService.getEvents({ userLat, userLon, radiusKm: rad, category: cat });
  return res.json(events);
});

apiRouter.get('/events/:id', (req: Request, res: Response) => {
  const id = getIdParam(req.params.id);
  const event = EventService.getEventById(id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  return res.json(event);
});

apiRouter.post('/events', (req: Request, res: Response) => {
  try {
    const { orgId, ...eventData } = req.body;
    if (!orgId) return res.status(400).json({ error: 'orgId is required' });
    const created = EventService.createEvent(orgId, eventData);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/events/book-ticket', (req: Request, res: Response) => {
  try {
    const { eventId, userId, tierId } = req.body;
    const booking = EventService.bookTicket({ eventId, userId, tierId });
    return res.status(201).json(booking);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/events/verify-ticket', (req: Request, res: Response) => {
  try {
    const { qrCodeToken, orgId } = req.body;
    const result = EventService.verifyAndCheckInTicket(qrCodeToken, orgId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/events/user-tickets/:userId', (req: Request, res: Response) => {
  const userId = getIdParam(req.params.userId);
  const tickets = EventService.getUserTickets(userId);
  return res.json(tickets);
});

// ================= CELEBRITY ROUTES =================
apiRouter.get('/celebrities', (req: Request, res: Response) => {
  return res.json(CelebrityService.getAllCelebrities());
});

apiRouter.get('/celebrities/:id', (req: Request, res: Response) => {
  const id = getIdParam(req.params.id);
  const celeb = CelebrityService.getCelebrityById(id);
  if (!celeb) return res.status(404).json({ error: 'Celebrity not found' });
  return res.json(celeb);
});

apiRouter.put('/celebrities/:id/settings', (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const updated = CelebrityService.updateCelebritySettings(id, req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/celebrities/:id/media', (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const media = CelebrityService.addMedia(id, req.body);
    return res.status(201).json(media);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/celebrities/check-call-eligibility', (req: Request, res: Response) => {
  const { callerId, celebrityId } = req.body;
  const result = CelebrityService.validateCallEligibility(callerId, celebrityId);
  return res.json(result);
});

// ================= CUSTOMER SUPPORT ROUTES =================
apiRouter.post('/support/tickets', (req: Request, res: Response) => {
  try {
    const { userId, subject } = req.body;
    const ticket = SupportService.createTicket(userId, subject);
    return res.status(201).json(ticket);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/support/tickets', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (userId) {
    return res.json(SupportService.getTicketsForUser(userId as string));
  }
  return res.json(SupportService.getAllTickets());
});

apiRouter.get('/support/tickets/:ticketId/messages', (req: Request, res: Response) => {
  const ticketId = getIdParam(req.params.ticketId);
  const messages = SupportService.getMessages(ticketId);
  return res.json(messages);
});

apiRouter.post('/support/tickets/:ticketId/messages', (req: Request, res: Response) => {
  try {
    const ticketId = getIdParam(req.params.ticketId);
    const { senderId, message } = req.body;
    const msg = SupportService.addMessage(ticketId, senderId, message);
    return res.status(201).json(msg);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ================= SUPER ADMIN ROUTES =================
apiRouter.get('/admin/stats', (req: Request, res: Response) => {
  return res.json(AdminService.getPlatformStats());
});

apiRouter.post('/admin/users/:id/ban', (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const { isBanned } = req.body;
    const user = AdminService.toggleUserBan(id, !!isBanned);
    return res.json(user);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/users/:id/verify', (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const { isVerified } = req.body;
    const user = AdminService.verifyUser(id, !!isVerified);
    return res.json(user);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/users/:id/premium', (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const { isPremium } = req.body;
    const user = AdminService.toggleUserPremium(id, !!isPremium);
    return res.json(user);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
