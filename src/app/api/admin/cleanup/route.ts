/**
 * Admin cleanup endpoint for Vercel Cron
 * Removes expired chat sessions
 */

import { cleanupExpiredSessions } from '../../../../../scripts/cleanup-expired-sessions';

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await cleanupExpiredSessions();
    return Response.json({
      success: true,
      cleaned: result.cleaned,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
