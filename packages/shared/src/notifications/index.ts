/**
 * Unified Notification System
 *
 * Routes notifications across channels: in-app, email, Slack, push.
 * Each notification specifies which channels it should be delivered to.
 */

export type NotificationChannel = 'in_app' | 'email' | 'slack' | 'push';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationPayload {
  orgId: string;
  userId: string;          // target user
  title: string;
  message: string;
  type: string;            // 'submission_update', 'invoice_paid', 'agent_action', etc.
  priority: NotificationPriority;
  channels: NotificationChannel[];
  actionUrl?: string;      // deep link to relevant page
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  channel: NotificationChannel;
  enabled: boolean;
  types: string[];         // which notification types on this channel
}

// Notification type registry
export const NOTIFICATION_TYPES = {
  // ATS
  SUBMISSION_STATUS: { type: 'submission_status', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'medium' as NotificationPriority },
  INTERVIEW_SCHEDULED: { type: 'interview_scheduled', defaultChannels: ['in_app', 'email', 'slack'] as NotificationChannel[], priority: 'high' as NotificationPriority },
  TIMESHEET_SUBMITTED: { type: 'timesheet_submitted', defaultChannels: ['in_app'] as NotificationChannel[], priority: 'low' as NotificationPriority },
  TIMESHEET_APPROVED: { type: 'timesheet_approved', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'medium' as NotificationPriority },
  INVOICE_PAID: { type: 'invoice_paid', defaultChannels: ['in_app', 'email', 'slack'] as NotificationChannel[], priority: 'high' as NotificationPriority },
  PLACEMENT_ENDING: { type: 'placement_ending', defaultChannels: ['in_app', 'email', 'slack'] as NotificationChannel[], priority: 'urgent' as NotificationPriority },

  // CRM
  NEW_LEAD: { type: 'new_lead', defaultChannels: ['in_app', 'slack'] as NotificationChannel[], priority: 'medium' as NotificationPriority },
  LEAD_WON: { type: 'lead_won', defaultChannels: ['in_app', 'email', 'slack'] as NotificationChannel[], priority: 'high' as NotificationPriority },
  LEAD_LOST: { type: 'lead_lost', defaultChannels: ['in_app'] as NotificationChannel[], priority: 'medium' as NotificationPriority },

  // KudoDoc
  SIGNATURE_REQUESTED: { type: 'signature_requested', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'high' as NotificationPriority },
  DOCUMENT_SIGNED: { type: 'document_signed', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'medium' as NotificationPriority },
  SIGNATURE_DECLINED: { type: 'signature_declined', defaultChannels: ['in_app', 'email', 'slack'] as NotificationChannel[], priority: 'urgent' as NotificationPriority },

  // AI Agents
  AGENT_ACTION_PENDING: { type: 'agent_action_pending', defaultChannels: ['in_app'] as NotificationChannel[], priority: 'medium' as NotificationPriority },
  AGENT_COMPLETED: { type: 'agent_completed', defaultChannels: ['in_app'] as NotificationChannel[], priority: 'low' as NotificationPriority },
  AGENT_FAILED: { type: 'agent_failed', defaultChannels: ['in_app', 'slack'] as NotificationChannel[], priority: 'high' as NotificationPriority },

  // Billing
  TRIAL_ENDING: { type: 'trial_ending', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'urgent' as NotificationPriority },
  PAYMENT_FAILED: { type: 'payment_failed', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'urgent' as NotificationPriority },
  PLAN_UPGRADED: { type: 'plan_upgraded', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'medium' as NotificationPriority },
  USAGE_LIMIT_WARNING: { type: 'usage_limit_warning', defaultChannels: ['in_app', 'email'] as NotificationChannel[], priority: 'high' as NotificationPriority },
} as const;

// Dispatch a notification across channels
export async function sendNotification(payload: NotificationPayload): Promise<{ channelResults: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};

  for (const channel of payload.channels) {
    try {
      switch (channel) {
        case 'in_app':
          // Write to Notification table in DB
          results.in_app = true;
          break;
        case 'email':
          // Send via XGNMail/Resend
          results.email = true;
          break;
        case 'slack':
          // Post to Slack webhook
          results.slack = true;
          break;
        case 'push':
          // Send push notification (Capacitor/Web Push)
          results.push = true;
          break;
      }
    } catch {
      results[channel] = false;
    }
  }

  return { channelResults: results };
}

// Build notification from a known type
export function createNotification(
  typeKey: keyof typeof NOTIFICATION_TYPES,
  orgId: string,
  userId: string,
  title: string,
  message: string,
  actionUrl?: string,
  metadata?: Record<string, any>,
): NotificationPayload {
  const notifType = NOTIFICATION_TYPES[typeKey];
  return {
    orgId,
    userId,
    title,
    message,
    type: notifType.type,
    priority: notifType.priority,
    channels: [...notifType.defaultChannels],
    actionUrl,
    metadata,
  };
}
