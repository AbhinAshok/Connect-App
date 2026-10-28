import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/inMemoryDb';
import { CelebrityProfile, CelebrityMedia, User } from '../types';

export class CelebrityService {
  static getAllCelebrities(): Array<{ user: User; profile: CelebrityProfile }> {
    const list: Array<{ user: User; profile: CelebrityProfile }> = [];

    for (const [userId, profile] of db.celebrities.entries()) {
      const user = db.getUserById(userId);
      if (user && !user.isBanned) {
        list.push({ user, profile });
      }
    }

    return list;
  }

  static getCelebrityById(userId: string): { user: User; profile: CelebrityProfile } | null {
    const user = db.getUserById(userId);
    const profile = db.celebrities.get(userId);
    if (!user || !profile) return null;
    return { user, profile };
  }

  static updateCelebritySettings(
    userId: string,
    settings: {
      isAvailableForCalls?: boolean;
      audioRatePerMinute?: number;
      videoRatePerMinute?: number;
      category?: string;
      stageName?: string;
    }
  ): CelebrityProfile {
    const profile = db.celebrities.get(userId);
    if (!profile) throw new Error('Celebrity profile not found');

    if (settings.isAvailableForCalls !== undefined) profile.isAvailableForCalls = settings.isAvailableForCalls;
    if (settings.audioRatePerMinute !== undefined) profile.audioRatePerMinute = settings.audioRatePerMinute;
    if (settings.videoRatePerMinute !== undefined) profile.videoRatePerMinute = settings.videoRatePerMinute;
    if (settings.category !== undefined) profile.category = settings.category;
    if (settings.stageName !== undefined) profile.stageName = settings.stageName;

    return profile;
  }

  static addMedia(userId: string, mediaData: { type: 'IMAGE' | 'VIDEO'; url: string; caption?: string }): CelebrityMedia {
    const profile = db.celebrities.get(userId);
    if (!profile) throw new Error('Celebrity profile not found');

    const newMedia: CelebrityMedia = {
      id: `med_${uuidv4().substring(0, 8)}`,
      celebrityId: userId,
      type: mediaData.type,
      url: mediaData.url,
      caption: mediaData.caption,
      createdAt: new Date().toISOString(),
    };

    profile.media.unshift(newMedia);
    return newMedia;
  }

  /**
   * Validate if user is eligible to initiate a celebrity call (Must be Premium)
   */
  static validateCallEligibility(callerId: string, celebrityId: string): { eligible: boolean; reason?: string } {
    const caller = db.getUserById(callerId);
    if (!caller) return { eligible: false, reason: 'Caller not found' };

    if (!caller.isPremium) {
      return {
        eligible: false,
        reason: 'Celebrity calling is a Premium feature. Please upgrade to a Premium account to connect with celebrities.',
      };
    }

    const { profile } = this.getCelebrityById(celebrityId) || {};
    if (!profile || !profile.isAvailableForCalls) {
      return { eligible: false, reason: 'This celebrity is currently busy or offline for calls.' };
    }

    return { eligible: true };
  }
}
