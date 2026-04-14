/**
 * POST /api/jobs/:id/generate-description
 *
 * Generates an AI-polished professional job description from the raw email body
 * stored in job.description.  The AI output is saved to job.aiDescription and
 * returned so the job detail page can display it immediately.
 *
 * The raw email (job.description) is NEVER modified — only job.aiDescription changes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@inherenttech/db';

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

function buildPolishPrompt(rawEmail: string, jobTitle: string): string {
  return `You are a professional technical recruiter copywriter. Your task is to transform the raw email below into a clean, professional job description suitable for a staffing ATS (Ceipal).

RULES:
- Preserve ALL technical requirements, skills, years of experience, and qualifications verbatim.
- Keep the pay rate, contract type, duration, location, and visa requirements exactly as stated.
- Restructure the content into clearly labeled sections: Overview, Responsibilities, Required Skills, Nice to Have, Compensation & Terms.
- Write in a professional, direct tone. No fluff, no buzzwords.
- Do NOT invent or add any requirements not mentioned in the email.
- Output plain text only — no markdown, no HTML.

Job Title: ${jobTitle}

Raw Email:
${rawEmail.slice(0, 10000)}

Write the professional job description now:`;
}

async function callOllamaText(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        model:   OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream:  false,
        options: { temperature: 0.3, num_predict: 1500 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const json = await res.json() as { message: { content: string } };
    return json.message.content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const orgId = request.headers.get('x-org-id') || '';
    if (!orgId) return NextResponse.json({ error: 'x-org-id required' }, { status: 400 });

    const job = await prisma.jobOrder.findFirst({
      where: { id: params.id, orgId },
      select: { id: true, title: true, description: true },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    if (!job.description) {
      return NextResponse.json({ error: 'No raw email body to generate from' }, { status: 400 });
    }

    const aiDescription = await callOllamaText(
      buildPolishPrompt(job.description, job.title),
    );

    // Save it to the DB
    await prisma.jobOrder.update({
      where: { id: job.id },
      data:  { aiDescription },
    });

    return NextResponse.json({ aiDescription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
