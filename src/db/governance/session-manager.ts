/**
 * Session management for chat conversations
 * Handles session ID generation and retrieval from cookies/headers
 */

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const SESSION_COOKIE_NAME = 'chat-session-id';
const SESSION_HEADER_NAME = 'x-chat-session-id';
const SESSION_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

/**
 * Get or create a session ID for the current request
 * Priority: Header > Cookie > New UUID
 */
export async function getOrCreateSessionId(request: Request): Promise<string> {
  // Check header first (for API clients)
  const headerSessionId = request.headers.get(SESSION_HEADER_NAME);
  if (headerSessionId) {
    return headerSessionId;
  }

  // Check cookie
  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (cookieSessionId) {
    return cookieSessionId;
  }

  // Generate new session ID
  return randomUUID();
}

/**
 * Set session ID in response cookies
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
}
