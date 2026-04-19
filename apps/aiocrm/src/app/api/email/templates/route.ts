import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplates } from '@inherenttech/db';

/**
 * GET /api/email/templates
 * List all available email templates
 */
export async function GET(request: NextRequest) {
  try {
    // Get built-in templates
    const builtIn = getEmailTemplates();

    return NextResponse.json({
      builtIn: builtIn.map(t => ({ ...t, isCustom: false })),
      custom: [],
      total: builtIn.length,
    });
  } catch (error: any) {
    console.error('Template list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/templates
 * Create a custom email template (placeholder — no DB table yet)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.subject || !body.html) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, html' },
        { status: 400 }
      );
    }

    const variables = extractVariables(body.html);

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        name: body.name,
        subject: body.subject,
        html: body.html,
        variables,
        isCustom: true,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}

/**
 * Extract {{variable}} placeholders from HTML template
 */
function extractVariables(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ''))));
}
