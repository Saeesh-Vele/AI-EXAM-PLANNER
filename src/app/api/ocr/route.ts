// ============================================================
// ExamFlow AI — OCR API Route (Groq Text Parsing)
// Receives raw OCR text from client-side Tesseract.js,
// sends it to Groq for structured exam date extraction.
// No Gemini dependency.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAIConfig } from '@/lib/ai/config';

// ---- Error Codes ----

type OCRErrorCode =
  | 'RATE_LIMIT'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_INPUT'
  | 'PARSE_ERROR'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'API_NOT_CONFIGURED';

const ERROR_MESSAGES: Record<OCRErrorCode, string> = {
  RATE_LIMIT: 'Groq is currently rate limited. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'Groq API quota exceeded. Please check your API key limits.',
  INVALID_INPUT: 'No OCR text provided. Please try uploading the image again.',
  PARSE_ERROR: 'Could not extract exam data from the text. Try a clearer photo.',
  NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
  API_ERROR: 'AI parsing service returned an unexpected error. Please try again.',
  API_NOT_CONFIGURED: 'AI service is not configured. Please add GROQ_API_KEY to environment variables.',
};

// ---- Config ----

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ---- Prompt ----

function buildGroqParsingPrompt(ocrText: string): string {
  return `You are parsing raw OCR text from a Mumbai University Computer Engineering Semester 6 exam timetable.

The timetable contains EXACTLY 5 subjects. You MUST find all 5.

The OCR text is noisy — expect misspellings, merged words, broken lines, and garbled characters.

SUBJECT IDENTIFICATION TABLE:
| Code | Course Code | Full Name | Common OCR Variants |
|------|-------------|-----------|---------------------|
| SPCC | CSC601 | System Programming and Compiler Construction | system program, compiler, SPCC, CSC601, sys prog |
| CSS  | CSC602 | Cryptography and System Security | cryptograph, system security, CSS, CSC602, crypto |
| MC   | CSC603 | Mobile Computing | mobile comput, MC, CSC603, mob comp, mobile |
| AI   | CSC604 | Artificial Intelligence | artificial intell, AI, CSC604, artif intel |
| QA   | CSDLO6013 | Quantitative Analysis | quantitative analy, QA, CSDLO6013, quant anal, optional course |

INSTRUCTIONS:
1. Scan the ENTIRE text for each of the 5 subjects above.
2. Match subjects by ANY of: subject code, course code, full name, or OCR variants.
3. For each subject, find the associated exam date on the SAME line or nearby.
4. Convert ALL dates to YYYY-MM-DD format. Handle formats like:
   - "Monday ,11 May ,2026" → 2026-05-11
   - "11/05/2026" → 2026-05-11
   - "May 11, 2026" → 2026-05-11
   - "Wednesday , 13 May ,2026" → 2026-05-13
5. If a subject appears with a course code like CSC603, it IS one of the 5 subjects — match it.
6. The last row often has "Department Level Optional Course" — that is QA (Quantitative Analysis).
7. You MUST return all 5 subjects. If you find fewer than 5, re-scan the text more carefully.
8. Do NOT invent dates. Only use dates found in the text.

OCR Text:
"""
${ocrText}
"""

Respond with a JSON object containing an "exams" array with EXACTLY the subjects you found.
Example:
{"exams": [
  {"subjectCode": "SPCC", "subjectName": "System Programming and Compiler Construction", "date": "2026-05-11"},
  {"subjectCode": "CSS", "subjectName": "Cryptography and System Security", "date": "2026-05-13"},
  {"subjectCode": "MC", "subjectName": "Mobile Computing", "date": "2026-05-15"},
  {"subjectCode": "AI", "subjectName": "Artificial Intelligence", "date": "2026-05-18"},
  {"subjectCode": "QA", "subjectName": "Quantitative Analysis", "date": "2026-05-20"}
]}

Return ONLY valid JSON. No markdown, no explanation.`;
}

// ---- Helpers ----

function errorResponse(errorCode: OCRErrorCode, status: number) {
  return NextResponse.json(
    {
      success: false,
      errorCode,
      error: ERROR_MESSAGES[errorCode],
    },
    { status }
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Regex Fallback Parsing ----

function fallbackExtractDates(ocrText: string) {
  // Match dates like 11 May 2026, 11/05/2026, May 11, 2026, etc.
  // Month names (abbreviated or full)
  const dateRegex = /\d{1,2}\s*[,\-]?\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[,\-]?\s*\d{2,4}/gi;
  const matches = [...ocrText.matchAll(dateRegex)];
  
  if (matches.length === 0) return [];
  
  const subjects = ['SPCC', 'CSS', 'MC', 'AI', 'QA'];
  const subjectNames = [
    'System Programming and Compiler Construction',
    'Cryptography and System Security',
    'Mobile Computing',
    'Artificial Intelligence',
    'Quantitative Analysis'
  ];
  
  const exams = [];
  for (let i = 0; i < Math.min(matches.length, subjects.length); i++) {
    const dateStr = matches[i][0];
    const dateObj = new Date(dateStr);
    let formattedDate = '';
    
    if (!isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      formattedDate = `${yyyy}-${mm}-${dd}`;
    } else {
      formattedDate = '2026-05-01'; // Fallback
    }
    
    exams.push({
      subjectCode: subjects[i],
      subjectName: subjectNames[i],
      date: formattedDate
    });
  }
  return exams;
}

// ---- Route Handler ----

export async function POST(request: NextRequest) {
  console.log('[ocr] ========== OCR Parse Request Received ==========');

  try {
    // 1. Validate API key
    const { groqApiKey } = getAIConfig();

    // We no longer fail immediately if no API key; we try the regex fallback instead
    const canUseGroq = Boolean(groqApiKey);

    // 2. Parse request body
    let body: { ocrText?: string; confidence?: number };
    try {
      body = await request.json();
    } catch {
      console.error('[ocr] Failed to parse request body');
      return errorResponse('INVALID_INPUT', 400);
    }

    const { ocrText, confidence } = body;

    if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length < 10) {
      console.error('[ocr] Missing or too short OCR text');
      return errorResponse('INVALID_INPUT', 400);
    }

    console.log(`[ocr] OCR text length: ${ocrText.length} chars, confidence: ${confidence ?? 'unknown'}`);
    console.log(`[ocr] FULL OCR TEXT:\n${ocrText}`);

    // If Groq is not configured, go straight to fallback
    if (!canUseGroq) {
      console.log('[ocr] Groq not configured, using regex fallback');
      const fallbackExams = fallbackExtractDates(ocrText);
      if (fallbackExams.length > 0) {
        return NextResponse.json({
          success: true,
          exams: fallbackExams,
          lowConfidence: true,
          ocrConfidence: confidence,
          extractedCount: fallbackExams.length,
        });
      }
      return errorResponse('API_NOT_CONFIGURED', 503);
    }

    // 3. Build prompt and call Groq with retry
    const prompt = buildGroqParsingPrompt(ocrText.trim());

    const groqPayload = JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction assistant. You extract structured data from noisy OCR text. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    let lastError: string = '';
    let lastStatus: number = 500;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? 4000;
        console.log(`[ocr] Retry ${attempt}/${MAX_RETRIES} after ${delayMs}ms...`);
        await sleep(delayMs);
      }

      console.log(`[ocr] Groq request attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`,
          },
          body: groqPayload,
        });

        console.log(`[ocr] Groq response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content ?? '';

          console.log(`[ocr] Groq response content length: ${content.length}`);
          console.log(`[ocr] Groq raw response: ${content.substring(0, 500)}`);

          // Parse the JSON response — handle both array and object formats
          try {
            let parsed = JSON.parse(content);

            // If Groq wrapped it in an object (due to json_object mode), extract the array
            if (!Array.isArray(parsed)) {
              // Look for an array property
              const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
              if (arrayKey) {
                parsed = parsed[arrayKey];
              } else {
                console.error('[ocr] Groq response is not an array and has no array property');
                throw new Error('PARSE_ERROR');
              }
            }

            // Validate and normalize the exam entries
            const exams = parsed
              .filter((e: Record<string, unknown>) =>
                e &&
                typeof e.subjectCode === 'string' &&
                typeof e.date === 'string' &&
                /^\d{4}-\d{2}-\d{2}$/.test(e.date as string)
              )
              .map((e: Record<string, unknown>) => ({
                subjectCode: e.subjectCode as string,
                subjectName: (e.subjectName as string) || '',
                date: e.date as string,
              }));

            console.log(`[ocr] Successfully extracted ${exams.length} exams via Groq`);

            // If Groq found exams, return them
            if (exams.length > 0) {
              const isLowConfidence = (confidence !== undefined && confidence < 60) || exams.length < 3;
              return NextResponse.json({
                success: true,
                exams,
                lowConfidence: isLowConfidence,
                ocrConfidence: confidence,
                extractedCount: exams.length,
              });
            } else {
              // Groq found 0 exams — throw to trigger fallback
              throw new Error('ZERO_EXAMS');
            }

          } catch (parseErr) {
            console.error('[ocr] JSON parse error or zero exams on Groq response:', parseErr);
            console.error('[ocr] Raw content:', content.substring(0, 500));
            // Break out of retry loop for parse errors, let the fallback handle it
            break;
          }
        }

        // Non-OK response
        const responseText = await response.text();
        lastStatus = response.status;
        lastError = responseText;

        console.error(`[ocr] Groq API error (${response.status}):`, responseText.substring(0, 500));

        // Retry on 429 and 503
        if (response.status === 429 || response.status === 503) {
          if (attempt < MAX_RETRIES) {
            continue;
          }
          console.error(`[ocr] All ${MAX_RETRIES} retries exhausted for status ${response.status}`);
          break; // Break instead of returning to hit fallback
        }

        if (response.status === 401 || response.status === 403) {
          break; // Break instead of returning to hit fallback
        }

        break; // Any other status -> break and hit fallback

      } catch (fetchErr) {
        const fetchMessage = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error';
        console.error(`[ocr] Network error on attempt ${attempt + 1}:`, fetchMessage);
        lastError = fetchMessage;
        lastStatus = 502;

        if (attempt < MAX_RETRIES) {
          continue;
        }

        break; // Break instead of returning to hit fallback
      }
    }

    // --- FALLBACK TRIGGERED ---
    console.log('[ocr] Groq extraction failed or returned 0 exams. Falling back to Regex parsing.');
    const fallbackExams = fallbackExtractDates(ocrText);
    
    if (fallbackExams.length > 0) {
      console.log(`[ocr] Fallback successfully mapped ${fallbackExams.length} dates.`);
      return NextResponse.json({
        success: true,
        exams: fallbackExams,
        lowConfidence: true, // Always low confidence for fallback so user is forced to review
        ocrConfidence: confidence,
        extractedCount: fallbackExams.length,
      });
    }

    console.error('[ocr] Both Groq and Regex fallback failed to extract data. Last Error:', lastError);
    return errorResponse('PARSE_ERROR', lastStatus);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ocr] Unhandled error:', message);
    return NextResponse.json(
      {
        success: false,
        errorCode: 'API_ERROR' as OCRErrorCode,
        error: 'OCR processing failed unexpectedly. Please try again.',
      },
      { status: 500 }
    );
  }
}
