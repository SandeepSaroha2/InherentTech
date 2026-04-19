import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/email/stats
 * Get email campaign and delivery statistics for an organization
 *
 * Query params:
 * - days?: number - Stats for last N days (default: 30)
 * - campaignId?: string - Stats for specific campaign
 *
 * Returns:
 * {
 *   totalSent: number
 *   totalDelivered: number
 *   totalBounced: number
 *   totalOpened: number
 *   totalReplied: number
 *   deliveryRate: number (%)
 *   bounceRate: number (%)
 *   openRate: number (%)
 *   replyRate: number (%)
 *   byStatus: object
 *   topCampaigns: array
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const campaignId = searchParams.get('campaignId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing x-org-id header' },
        { status: 400 }
      );
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Get email logs for the period
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        orgId,
        createdAt: { gte: dateFrom },
      },
    });

    // Get outreach campaign stats if campaignId provided
    let campaignStats = null;
    if (campaignId) {
      campaignStats = await prisma.outreachCampaign.findUnique({
        where: { id: campaignId },
      });
    }

    // Get outreach messages for campaign if available
    let outreachMessages: any[] = [];
    if (campaignId) {
      outreachMessages = await prisma.outreachMessage.findMany({
        where: { campaignId },
      });
    }

    // Calculate statistics
    const statuses = {
      sent: emailLogs.filter(l => l.status === 'sent').length,
      delivered: emailLogs.filter(l => l.status === 'delivered').length,
      bounced: emailLogs.filter(l => l.status === 'bounced').length,
      complained: emailLogs.filter(l => l.status === 'complained').length,
      delayed: emailLogs.filter(l => l.status === 'delayed').length,
      failed: emailLogs.filter(l => l.status === 'failed').length,
    };

    const outreachStats = {
      opened: outreachMessages.filter(m => m.openedAt).length,
      replied: outreachMessages.filter(m => m.repliedAt).length,
    };

    const totalSent = emailLogs.length;
    const totalDelivered = statuses.delivered;
    const totalBounced = statuses.bounced;
    const totalOpened = outreachStats.opened;
    const totalReplied = outreachStats.replied;

    return NextResponse.json({
      period: {
        days,
        from: dateFrom.toISOString(),
        to: new Date().toISOString(),
      },
      totals: {
        sent: totalSent,
        delivered: totalDelivered,
        bounced: totalBounced,
        opened: totalOpened,
        replied: totalReplied,
      },
      rates: {
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
      },
      byStatus: statuses,
      campaign: campaignStats ? {
        id: campaignStats.id,
        name: campaignStats.name,
        status: campaignStats.status,
        sentCount: campaignStats.sentCount,
        openCount: campaignStats.openCount,
        replyCount: campaignStats.replyCount,
      } : null,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
