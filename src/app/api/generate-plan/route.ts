// ============================================================
// ExamFlow AI — Generate Plan API Route (Groq)
// API key is read from server-side environment variables.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { buildStudyPlanPrompt } from '@/lib/ai/prompts';
import { getAIConfig } from '@/lib/ai/config';

export async function POST(request: NextRequest) {
  try {
    const { groqApiKey } = getAIConfig();

    if (!groqApiKey) {
      console.error('[generate-plan] GROQ_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please add API keys to environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { subjects, exams, difficultyRatings, currentDate, dailyHours } = body;

    const prompt = buildStudyPlanPrompt(
      subjects,
      exams,
      difficultyRatings,
      currentDate,
      dailyHours
    );

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert academic study planner. Respond ONLY with valid JSON. No markdown, no extra text.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[generate-plan] Groq API error:', error);
      return NextResponse.json(
        { error: 'AI plan generation failed. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    try {
      const plan = JSON.parse(content);
      return NextResponse.json({ plan });
    } catch {
      console.error('[generate-plan] Failed to parse AI response');
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 422 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-plan] Error:', message);
    return NextResponse.json(
      { error: 'Plan generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
