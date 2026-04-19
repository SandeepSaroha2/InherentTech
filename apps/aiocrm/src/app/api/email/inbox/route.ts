import { NextRequest, NextResponse } from 'next/server';
import { fetchInbox, fetchThread, type InboxMessage, type InboxThread } from '@inherenttech/db';
import { prisma } from '@inherenttech/db';

/**
 * GET /api/email/inbox
 * Fetch inbox messages via Gmail API
 *
 * Query params:
 * - maxResults?: number (default: 20)
 * - query?: string (Gmail search query, e.g., "from:user@example.com")
 * - threadId?: string (fetch specific thread instead of inbox list)
 *
 * Requires:
 * - Authorization header with Gmail OAuth token
 * - OR x-gmail-access-token header
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const query = searchParams.get('query') || undefined;
    const threadId = searchParams.get('threadId') || undefined;

    // Get Gmail access token from headers or request
    const accessToken =
      request.headers.get('Authorization')?.replace('Bearer ', '') ||
      request.headers.get('x-gmail-access-token') ||
      '';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Gmail access token required. Pass as Authorization header or x-gmail-access-token.' },
        { status: 401 }
      );
    }

    // Fetch specific thread if requested
    if (threadId) {
      const thread = await fetchThread(accessToken, threadId);
      if (!thread) {
        return NextResponse.json(
          { error: `Thread not found: ${threadId}` },
          { status: 404 }
        );
      }
      return NextResponse.json(thread);
    }

    // Fetch inbox messages
    const messages = await fetchInbox(accessToken, maxResults, query);

    return NextResponse.json({
      messages,
      count: messages.length,
      maxResults,
      query: query || 'all',
    });
  } catch (error: any) {
    console.error('Inbox fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inbox' },
      { status: error.message?.includes('401') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/email/inbox/sync
 * Sync Gmail inbox to local cache (future feature)
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';
    const accessToken =
      request.headers.get('Authorization')?.replace('Bearer ', '') ||
      request.headers.get('x-gmail-access-token') ||
      '';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Gmail access token required' },
        { status: 401 }
      );
    }

    // Fetch recent messages
    const messages = await fetchInbox(accessToken, 50);

    // TODO: Store in InboxMessage table for caching
    // This would allow offline access and search

    return NextResponse.json({
      synced: messages.length,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Inbox sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync inbox' },
      { status: 500 }
    );
  }
}
