// ============================================================
// ExamFlow AI — AI Status Check API Route
// Returns whether API keys are configured (not the keys themselves)
// ============================================================

import { NextResponse } from 'next/server';
import { isGroqConfigured } from '@/lib/ai/config';

export async function GET() {
  return NextResponse.json({
    groq: isGroqConfigured(),
  });
}
