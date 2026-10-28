import jwt from 'jsonwebtoken';
import { db } from '../db/inMemoryDb';
import { User, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'friend-app-super-secret-key-2026';

export class AuthService {
  static sendOtp(phone: string): { success: boolean; message: string; testOtp?: string } {
    // Standard mock OTP is 123456 for effortless local dev & testing
    const otp = '123456';
    db.otpStore.set(phone, otp);
    console.log(`[AUTH] Sent OTP ${otp} to phone ${phone}`);
    return {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      testOtp: otp, // surfaced for immediate dev testability
    };
  }

  static verifyOtp(phone: string, otp: string): { token: string; user: User; isNewUser: boolean } {
    const validOtp = db.otpStore.get(phone) || '123456';
    if (otp !== validOtp && otp !== '123456') {
      throw new Error('Invalid OTP provided');
    }

    let isNewUser = false;
    let user = db.getUserByPhone(phone);

    if (!user) {
      isNewUser = true;
      user = {
        id: `usr_${uuidv4().substring(0, 8)}`,
        phone,
        name: `Friend_${phone.slice(-4)}`,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${phone}`,
        role: 'USER',
        status: 'ONLINE',
        isVerified: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
        isPremium: false,
      };
      db.addUser(user);
    }

    if (user.isBanned) {
      throw new Error('This account has been suspended by administration.');
    }

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { token, user, isNewUser };
  }

  static verifyToken(token: string): { id: string; phone: string; role: UserRole } {
    return jwt.verify(token, JWT_SECRET) as { id: string; phone: string; role: UserRole };
  }
}
