/**
 * SMTP Client — xgnmail.com
 *
 * Singleton nodemailer transporter configured from SMTP_* env vars.
 * Used as the primary email transport across all apps.
 */
import nodemailer, { Transporter } from 'nodemailer';

let _transporter: Transporter | null = null;

export function getSmtpTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP_HOST, SMTP_USER, or SMTP_PASS environment variables');
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,        // true for SSL/465, false for STARTTLS/587
    requireTLS: port === 587,    // enforce STARTTLS upgrade on port 587
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return _transporter;
}

export function resetSmtpTransporter(): void {
  _transporter = null;
}

export const SMTP_FROM = process.env.SMTP_FROM || 'noreply@xgnmail.com';
