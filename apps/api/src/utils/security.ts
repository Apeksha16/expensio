import bcrypt from 'bcryptjs';
import { AppError } from './errors.js';

// Simple in-memory rate limiter store for MPIN attempts
const mpinLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate a secure bcrypt hash for a given MPIN.
 */
export function hashMpin(mpin: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(mpin, salt);
}

/**
 * Verify an input MPIN against the stored bcrypt hash.
 */
export function verifyMpin(inputMpin: string, storedMpin: string): boolean {
  if (!storedMpin) {
    return false;
  }
  return bcrypt.compareSync(inputMpin, storedMpin);
}

/**
 * Enforce rate limiting for MPIN updates to prevent brute force.
 * Maximum of 5 attempts within a 15-minute sliding window.
 */
export function mpinRateLimiter(userId: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes window
  const maxRequests = 5; // Max 5 attempts per window

  const record = mpinLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    mpinLimitStore.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (record.count >= maxRequests) {
    const minutesLeft = Math.ceil((record.resetTime - now) / 60000);
    throw new AppError(
      429,
      `Too many MPIN attempts. Please try again in ${minutesLeft} minutes.`,
      'TOO_MANY_REQUESTS'
    );
  }

  record.count += 1;
}

/**
 * Clear the rate limit history for a user upon successful authentication/update.
 */
export function clearMpinRateLimit(userId: string): void {
  mpinLimitStore.delete(userId);
}
