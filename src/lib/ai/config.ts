// ============================================================
// ExamFlow AI — Server-Side AI Configuration
// This file runs ONLY on the server. Never import in client code.
// ============================================================

/**
 * Server-side AI configuration.
 * Reads API keys from environment variables — never from client requests.
 */
export function getAIConfig() {
  return {
    groqApiKey: process.env.GROQ_API_KEY ?? '',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  };
}

/**
 * Validate that required environment variables are set.
 * Returns an array of missing variable names (empty = all configured).
 */
export function validateAIConfig(): string[] {
  const missing: string[] = [];

  if (!process.env.GROQ_API_KEY) {
    missing.push('GROQ_API_KEY');
  }

  if (!process.env.GEMINI_API_KEY) {
    missing.push('GEMINI_API_KEY');
  }

  return missing;
}

/**
 * Check if a specific AI service is configured.
 */
export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
