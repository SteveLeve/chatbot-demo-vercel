/**
 * Cleanup script for expired chat sessions
 * Run this via cron job or Vercel Cron
 */

import { config } from 'dotenv';
import { db } from '../src/db';
import { chatSessions } from '../src/db/schema';
import { lt, and, eq } from 'drizzle-orm';

config({ path: '.env.local' });

export async function cleanupExpiredSessions() {
  const now = new Date();

  console.log(`[Cleanup] Starting cleanup at ${now.toISOString()}`);

  try {
    // Find expired sessions
    const expiredSessions = await db.query.chatSessions.findMany({
      where: and(
        lt(chatSessions.expiresAt, now),
        eq(chatSessions.isActive, true)
      ),
    });

    console.log(`[Cleanup] Found ${expiredSessions.length} expired sessions`);

    if (expiredSessions.length === 0) {
      console.log('[Cleanup] No sessions to clean up');
      return { cleaned: 0 };
    }

    // Mark sessions as inactive (soft delete)
    const result = await db.update(chatSessions)
      .set({ isActive: false })
      .where(and(
        lt(chatSessions.expiresAt, now),
        eq(chatSessions.isActive, true)
      ))
      .returning({ id: chatSessions.id });

    console.log(`[Cleanup] Marked ${result.length} sessions as inactive`);

    // Optional: Hard delete after 30 days of being inactive
    // const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // await db.delete(chatSessions).where(
    //   and(
    //     eq(chatSessions.isActive, false),
    //     lt(chatSessions.expiresAt, thirtyDaysAgo)
    //   )
    // );

    console.log('[Cleanup] Cleanup completed successfully');
    return { cleaned: result.length };
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  cleanupExpiredSessions()
    .then((result) => {
      console.log(`Cleanup complete: ${result.cleaned} sessions marked inactive`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
