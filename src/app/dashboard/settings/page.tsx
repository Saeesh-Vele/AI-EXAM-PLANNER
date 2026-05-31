'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useExamStore } from '@/lib/store/exam-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Key,
  ExternalLink,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

interface AIStatus {
  groq: boolean;
}

export default function SettingsPage() {
  const { state, setCurrentDate, setDailyHours, resetStore } = useExamStore();
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Check API key configuration status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/ai-status');
        if (res.ok) {
          const data = await res.json();
          setAIStatus(data);
        }
      } catch {
        // Silently fail — status unknown
      } finally {
        setStatusLoading(false);
      }
    }
    checkStatus();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Configure your exam planner" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl space-y-6">
        {/* API Key Status */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Services</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            API keys are configured via server-side environment variables for
            security. They are never exposed to the browser.
          </p>

          {statusLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking configuration...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Groq Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Groq (LLaMA)</span>
                  <span className="text-[10px] text-muted-foreground">
                    Study plan generation
                  </span>
                </div>
                {aiStatus?.groq ? (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Configured
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs">
                    <XCircle className="w-4 h-4" />
                    Not configured
                  </div>
                )}
              </div>

              {/* Tesseract.js Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tesseract.js</span>
                  <span className="text-[10px] text-muted-foreground">
                    Timetable OCR (client-side)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-green-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Built-in
                </div>
              </div>

              {/* Setup Instructions */}
              {!aiStatus?.groq && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <p className="text-amber-400 font-medium">Setup Required</p>
                  <p className="text-muted-foreground">
                    Add your API key to the{' '}
                    <code className="px-1 py-0.5 rounded bg-white/5 text-amber-300">
                      .env.local
                    </code>{' '}
                    file in the project root:
                  </p>
                  <pre className="p-2 rounded bg-black/20 text-[11px] text-muted-foreground overflow-x-auto">
{`GROQ_API_KEY=gsk_your_key_here`}
                  </pre>
                  <div className="flex gap-3 pt-1">
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Get Groq key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Study Settings */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Study Configuration
          </h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Current Date</Label>
            <Input
              type="date"
              value={state.currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Daily Study Hours</Label>
              <span className="text-sm font-bold gradient-text">
                {state.dailyStudyHours}h
              </span>
            </div>
            <Slider
              value={[state.dailyStudyHours]}
              onValueChange={(val) => setDailyHours(Array.isArray(val) ? val[0] : val)}
              min={2}
              max={14}
              step={1}
            />
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Danger Zone */}
        <div className="glass-card rounded-xl p-5 space-y-3 border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </h3>
          <p className="text-xs text-muted-foreground">
            Clear all data and start fresh. This cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to reset all data? This cannot be undone.'
                )
              ) {
                resetStore();
                window.location.href = '/';
              }
            }}
            className="w-full"
          >
            Reset All Data
          </Button>
        </div>
      </div>
    </div>
  );
}
