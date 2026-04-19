import { NextRequest, NextResponse } from 'next/server';
import { agentEvents } from '../../../../lib/agent-hooks';

/**
 * POST /api/candidates/parse-resume
 *
 * Accepts a resume file (PDF/DOCX) and uses Claude AI to extract structured candidate data.
 * Requires ANTHROPIC_API_KEY env var.
 *
 * Body: FormData with 'file' field
 * Returns: Parsed candidate data
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' }, { status: 400 });
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    let textContent = '';

    if (file.type === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else if (file.type === 'application/pdf') {
      // For PDFs, send as base64 to Claude's vision capability
      textContent = `[PDF Resume - ${file.name}]`;
    } else {
      // For DOCX, extract text (basic approach)
      textContent = buffer.toString('utf-8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    // Build the Claude API request
    const messages: any[] = [];

    if (file.type === 'application/pdf') {
      // Use vision for PDF
      messages.push({
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: buffer.toString('base64'),
            },
          },
          {
            type: 'text',
            text: PARSE_PROMPT,
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: `Here is a resume to parse:\n\n${textContent}\n\n${PARSE_PROMPT}`,
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return NextResponse.json({ error: 'Failed to parse resume' }, { status: 502 });
    }

    const result = await response.json();
    const aiText = result.content?.[0]?.text || '';

    // Extract JSON from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response', raw: aiText }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Trigger agent event for resume parsed (if candidateId provided)
    const candidateId = request.headers.get('x-candidate-id');
    const orgId = request.headers.get('x-org-id') || '';
    const userId = request.headers.get('x-user-id') || '';

    if (candidateId && orgId) {
      agentEvents.resumeParsed(
        candidateId,
        {
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          skills: parsed.skills || [],
          yearsOfExperience: parsed.yearsOfExperience,
          currentTitle: parsed.currentTitle,
          currentCompany: parsed.currentCompany,
          education: parsed.education,
          workHistory: parsed.workHistory,
          confidence: parsed.confidence || 'medium',
        },
        orgId,
        userId
      );
    }

    return NextResponse.json({
      success: true,
      parsed,
      confidence: parsed.confidence || 'medium',
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Resume parse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const PARSE_PROMPT = `Parse this resume and extract the following information as a JSON object. Be thorough and accurate. If a field cannot be determined, use null.

Return ONLY a valid JSON object with these fields:
{
  "firstName": "string",
  "lastName": "string",
  "email": "string or null",
  "phone": "string or null",
  "currentTitle": "string or null",
  "currentCompany": "string or null",
  "location": "string or null (city, state format)",
  "linkedinUrl": "string or null",
  "yearsOfExperience": number or null,
  "skills": ["array", "of", "technical", "skills"],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string or null"
    }
  ],
  "workHistory": [
    {
      "title": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string or Present",
      "highlights": ["string"]
    }
  ],
  "certifications": ["string"],
  "suggestedVisaStatus": "US_CITIZEN | GREEN_CARD | H1B | OPT | CPT | L1 | TN | OTHER | null (infer from work authorization section if present)",
  "suggestedRate": number or null (hourly rate estimate in USD based on experience and skills),
  "summary": "2-3 sentence professional summary",
  "confidence": "high | medium | low"
}`;
