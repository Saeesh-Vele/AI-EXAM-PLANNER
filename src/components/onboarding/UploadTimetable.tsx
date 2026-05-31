'use client';

// ============================================================
// ExamFlow AI — Upload Timetable Component
// Pipeline: Tesseract.js (client OCR) → Groq (server parsing)
// No Gemini dependency. Never blocks the user.
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { DEFAULT_EXAMS } from '@/lib/data/syllabus';
import type { OCRProgress } from '@/lib/ai/tesseract-ocr';
import {
  Upload,
  Loader2,
  FileText,
  Wand2,
  AlertTriangle,
  Clock,
  PenLine,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ManualExamEntry from './ManualExamEntry';

// ---- Error Code → User Message Mapping ----

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT: 'AI parsing is temporarily rate limited. Please wait 30 seconds and try again.',
  QUOTA_EXCEEDED: 'API quota exceeded. Please check your API key limits or try later.',
  INVALID_INPUT: 'Could not extract readable text from the image. Try a clearer photo.',
  INVALID_FILE: 'Unsupported file format or file too large. Please use JPG, PNG, or PDF under 10 MB.',
  PARSE_ERROR: 'Could not extract exam dates from this image. Try a clearer photo or enter dates manually.',
  NETWORK_ERROR: 'Network connection issue. Please check your internet and try again.',
  API_ERROR: 'AI service encountered an error. Please try again in a moment.',
  API_NOT_CONFIGURED: 'AI service is not configured. Please contact the developer.',
  OCR_FAILED: 'Could not read text from the image. Try a clearer, well-lit photo.',
};

function getUserMessage(errorCode?: string, fallbackMsg?: string): string {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  return fallbackMsg || 'Extraction failed. Please try again or enter dates manually.';
}

// ---- OCR Progress Stages ----

const STAGE_LABELS: Record<string, string> = {
  loading: 'Loading OCR engine...',
  recognizing: 'Reading text from image...',
  parsing: 'AI is parsing exam dates...',
  done: 'Done!',
  error: 'Failed',
};

export default function UploadTimetable() {
  const { state, setExams } = useExamStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // UI mode
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Request lock ref
  const isProcessingRef = useRef(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setErrorCode(null);
    setOcrProgress(null);
    setCurrentStage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      const b64 = result.split(',')[1];
      setBase64Data(b64);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  // ---- Main Extraction Pipeline ----

  const handleExtract = async () => {
    if (!file || !base64Data) return;
    if (isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;

    setIsProcessing(true);
    setError(null);
    setErrorCode(null);
    setOcrProgress(null);

    try {
      setCurrentStage('ocr');
      
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'];
      
      let extractedText = '';
      let extractedConfidence = 100;

      if (imageExtensions.includes(ext)) {
        console.log("Detected file type:", ext);
        console.log("Extraction strategy: tesseract");
        
        const { extractTextFromImage } = await import('@/lib/ai/tesseract-ocr');
        const ocrResult = await extractTextFromImage(
          base64Data,
          file.type,
          (progress) => {
            setOcrProgress(progress);
          }
        );

        if (!ocrResult) {
          setErrorCode('OCR_FAILED');
          setError(getUserMessage('OCR_FAILED'));
          return;
        }
        
        extractedText = ocrResult.text;
        extractedConfidence = ocrResult.confidence;
        console.log(`[upload] OCR complete: ${ocrResult.wordCount} words, ${ocrResult.confidence}% confidence`);
      } else {
        // Document Extraction (PDF, DOCX)
        console.log("Detected file type:", ext);
        console.log("Extraction strategy:", ext === 'docx' ? 'mammoth' : 'pdf-parse');
        
        setOcrProgress({
          stage: 'recognizing',
          progress: 50,
          message: 'Extracting text from document...',
        });
        
        const formData = new FormData();
        formData.append('file', file);
        
        const docRes = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData,
        });
        
        const docData = await docRes.json();
        if (!docRes.ok) {
          setErrorCode('PARSE_ERROR');
          setError(getUserMessage('PARSE_ERROR', docData.error));
          return;
        }
        
        extractedText = docData.text;
        extractedConfidence = 100; // Perfect confidence for digital documents
      }

      // ---- Step 2: Send to Groq for parsing ----
      setCurrentStage('parsing');
      setOcrProgress({
        stage: 'recognizing',
        progress: 95,
        message: 'Sending to AI for parsing...',
      });

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText: extractedText,
          confidence: extractedConfidence,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const code = data.errorCode || 'API_ERROR';
        setErrorCode(code);
        setError(getUserMessage(code, data.error));
        return;
      }

      if (data.exams && Array.isArray(data.exams) && data.exams.length > 0) {
        setExams(data.exams);
        setCurrentStage('done');
        setOcrProgress({
          stage: 'done',
          progress: 100,
          message: `Extracted ${data.exams.length} exam${data.exams.length !== 1 ? 's' : ''} successfully!`,
        });

        // If low confidence, the ReviewExams step will handle corrections
        if (data.lowConfidence) {
          console.log('[upload] Low confidence extraction — user should review carefully');
        }
      } else {
        setErrorCode('PARSE_ERROR');
        setError('No exam data could be extracted. Try a clearer photo or enter dates manually.');
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      console.error('[upload] Pipeline error:', message);
      setErrorCode('NETWORK_ERROR');
      setError(getUserMessage('NETWORK_ERROR', message));
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  // ---- Defaults ----

  const handleUseDefaults = () => {
    setExams(DEFAULT_EXAMS);
    setShowManualEntry(false);
  };

  // ---- Render: Manual Entry Mode ----

  if (showManualEntry) {
    return (
      <div className="space-y-6">
        <ManualExamEntry />
        <button
          onClick={() => setShowManualEntry(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 w-full text-center"
        >
          ← Back to upload
        </button>
      </div>
    );
  }

  // ---- Render: Upload Mode ----

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">
          Upload Exam Timetable
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload a photo, screenshot, or PDF of your exam schedule
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone p-8 text-center ${dragOver ? 'drag-over' : ''} ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) document.getElementById('file-input')?.click();
        }}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {preview ? (
          <div className="space-y-3">
            <div className="relative mx-auto w-full max-w-xs h-48 rounded-lg overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Timetable preview"
                className="w-full h-full object-contain bg-black/20"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {file?.name} ({((file?.size ?? 0) / 1024).toFixed(0)} KB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PNG, JPG, PDF (max 10 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Extract Button */}
      {file && (
        <Button
          onClick={handleExtract}
          disabled={isProcessing}
          className="w-full gradient-accent text-white gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {currentStage === 'ocr'
                ? 'Reading text from image...'
                : currentStage === 'parsing'
                ? 'AI is parsing exam dates...'
                : 'Processing...'}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Extract Timetable
            </>
          )}
        </Button>
      )}

      {/* Progress Bar */}
      {isProcessing && ocrProgress && (
        <div className="space-y-2 animate-slide-up">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{ocrProgress.message}</span>
            <span>{ocrProgress.progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full gradient-accent transition-all duration-500 ease-out"
              style={{ width: `${ocrProgress.progress}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={currentStage === 'ocr' ? 'text-primary font-medium' : ocrProgress.progress > 90 ? 'text-green-400' : ''}>
              ① Read Text
            </span>
            <span className="flex-1 h-px bg-white/10" />
            <span className={currentStage === 'parsing' ? 'text-primary font-medium' : ''}>
              ② Parse Dates
            </span>
            <span className="flex-1 h-px bg-white/10" />
            <span className={currentStage === 'done' ? 'text-green-400 font-medium' : ''}>
              ③ Done
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isProcessing && (
        <div className={`p-4 rounded-xl text-sm ${
          errorCode === 'RATE_LIMIT'
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
            : 'bg-destructive/10 border border-destructive/20 text-destructive'
        }`}>
          <div className="flex items-start gap-3">
            {errorCode === 'RATE_LIMIT' ? (
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p>{error}</p>
              {errorCode === 'RATE_LIMIT' && (
                <p className="text-xs mt-2 opacity-70">
                  The server has already retried 3 times with backoff.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback Options (shown after failure) */}
      {error && !isProcessing && (
        <div className="space-y-3 animate-slide-up">
          <p className="text-xs text-muted-foreground text-center">
            You can still proceed:
          </p>

          <Button
            variant="outline"
            onClick={handleExtract}
            disabled={isProcessing}
            className="w-full gap-2 border-white/10 hover:bg-white/5"
          >
            <Wand2 className="w-4 h-4" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowManualEntry(true)}
            className="w-full gap-2 border-white/10 hover:bg-white/5"
          >
            <PenLine className="w-4 h-4" />
            Enter Exam Dates Manually
          </Button>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Manual Options (always visible) */}
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => setShowManualEntry(true)}
          className="w-full gap-2 border-white/10 hover:bg-white/5"
        >
          <PenLine className="w-4 h-4" />
          Enter Exam Dates Manually
        </Button>

        <Button
          variant="outline"
          onClick={handleUseDefaults}
          className="w-full gap-2 border-white/10 hover:bg-white/5"
        >
          <FileText className="w-4 h-4" />
          Use Default Exam Schedule (June 2026)
        </Button>
      </div>

      {/* Success Indicator */}
      {state.exams.length > 0 && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {state.exams.length} exams detected. Proceed to review.
        </div>
      )}
    </div>
  );
}
