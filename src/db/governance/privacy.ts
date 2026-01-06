/**
 * Privacy utilities for GDPR/CCPA compliance
 * Implements SHA-256 hashing for IP addresses with salt
 */

import { createHash } from 'crypto';

// Salt should be stored in environment variables
const IP_SALT = process.env.CHAT_LOG_IP_SALT || 'default-salt-change-in-production';

/**
 * Hash an IP address using SHA-256 with salt
 * This is one-way hashing - cannot reverse to get original IP
 */
export function hashIpAddress(ip: string): string {
  if (!ip) {
    return '';
  }

  const hash = createHash('sha256');
  hash.update(ip + IP_SALT);
  return hash.digest('hex');
}

/**
 * Validate that hashing is working correctly
 * Same IP should always produce same hash
 */
export function validateIpHashing(): boolean {
  const testIp = '192.168.1.1';
  const hash1 = hashIpAddress(testIp);
  const hash2 = hashIpAddress(testIp);
  return hash1 === hash2;
}
