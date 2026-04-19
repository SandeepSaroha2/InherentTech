import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplates, getEmailTemplate } from '@inherenttech/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/email/templates
 * List all available email templates
 *
 * Query params:
 * - id?: string - Get a specific template by ID
 *
 * Returns:
 * {
 *   templates: Array<{
 *     id: string
 *     name: string
 *     subject: string
 *     variables: string[]
 *   }>
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (templateId) {
      // Get specific template
      const template = getEmailTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        template: {
          id: template.id,
          name: template.name,
          subject: template.subject,
          html: template.html,
          variables: template.variables,
        },
      });
    }

    // List all templates
    const templates = getEmailTemplates();

    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        variables: t.variables,
      })),
      total: templates.length,
    });
  } catch (error: any) {
    console.error('Templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
