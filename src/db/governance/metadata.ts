/**
 * Client metadata extraction utilities
 */

import { UAParser } from 'ua-parser-js';

export interface ClientMetadata {
  userAgent: string;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | null;
}

export interface GeoMetadata {
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

/**
 * Parse user agent string to extract browser/OS/device info
 */
export function parseUserAgent(userAgentString: string): ClientMetadata {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  return {
    userAgent: userAgentString,
    browserName: result.browser.name || null,
    browserVersion: result.browser.version || null,
    osName: result.os.name || null,
    osVersion: result.os.version || null,
    deviceType: determineDeviceType(result),
  };
}

function determineDeviceType(result: any): ClientMetadata['deviceType'] {
  if (result.device.type === 'mobile') return 'mobile';
  if (result.device.type === 'tablet') return 'tablet';
  if (result.cpu.architecture || result.os.name) return 'desktop';
  return 'bot';
}

/**
 * Extract geo data from Edge runtime request
 * NOTE: This requires Edge Runtime or external geo-IP service
 *
 * Option 1: Use Vercel Edge Runtime (change route.ts to export const runtime = 'edge')
 * Option 2: Use external service like ipapi.co, ip-api.com, or maxmind
 */
export async function extractGeoMetadata(request: Request): Promise<GeoMetadata> {
  // Option 1: Vercel Edge Runtime (if available)
  if ('geo' in request) {
    const geo = (request as any).geo;
    return {
      countryCode: geo?.country || null,
      region: geo?.region || null,
      city: geo?.city || null,
      latitude: geo?.latitude ? parseFloat(geo.latitude) : null,
      longitude: geo?.longitude ? parseFloat(geo.longitude) : null,
      timezone: null, // Not available in Vercel geo
    };
  }

  // Option 2: Fallback - no geo data without Edge runtime
  // Could implement external geo-IP service here if needed
  return {
    countryCode: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
    timezone: null,
  };
}

/**
 * Extract IP address from request headers
 * Handles various proxy headers (x-forwarded-for, x-real-ip)
 */
export function extractIpAddress(request: Request): string {
  // Try various headers in order of preference
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}
