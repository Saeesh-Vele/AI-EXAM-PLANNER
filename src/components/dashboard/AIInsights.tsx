'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  AlertOctagon,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import type { AIInsight } from '@/lib/types';

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  danger: AlertOctagon,
};

const colorMap = {
  warning: 'text-amber-400',
  success: 'text-green-400',
  info: 'text-blue-400',
  danger: 'text-red-400',
};

export default function AIInsights() {
  const { state } = useExamStore();
  const insights = state.studyPlan?.insights ?? [];

  if (insights.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Recommendations</h3>
        </div>
        <div className="text-center py-6">
          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted-foreground">
            Generate a study plan to see AI insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">AI Recommendations</h3>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <div
              key={insight.id || i}
              className={`p-3 rounded-lg bg-white/[0.02] insight-${insight.type} animate-slide-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorMap[insight.type]}`}
                />
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {insight.message}
                </p>
              </div>
              {insight.subjectCode && (
                <span className="inline-block mt-1.5 ml-6 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                  {insight.subjectCode}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
