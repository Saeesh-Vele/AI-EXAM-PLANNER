'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { Progress } from '@/components/ui/progress';
import { safePercent } from '@/lib/utils';
import {
  BookOpen,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import {
  type ConfidenceLevel,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
} from '@/lib/types';

const CONFIDENCE_OPTIONS: ConfidenceLevel[] = [
  'not_started',
  'basic',
  'good',
  'strong',
];

export default function SyllabusCompletion() {
  const { state, setModuleConfidence } = useExamStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">Syllabus Status</h2>
        <p className="text-sm text-muted-foreground">
          Rate your understanding of each module
        </p>
      </div>

      {/* Overall Progress */}
      {(() => {
        const total = state.subjects.reduce(
          (s, sub) => s + sub.modules.length,
          0
        );
        const strong = state.subjects.reduce(
          (s, sub) =>
            s + sub.modules.filter((m) => m.confidence === 'strong').length,
          0
        );
        const pct = safePercent(strong, total);
        return (
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  Overall Mastery
                </span>
                <span className="text-sm text-muted-foreground">
                  {strong}/{total} modules strong
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            <span className="text-lg font-bold gradient-text">{pct}%</span>
          </div>
        );
      })()}

      {/* Subjects */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {state.subjects.map((subject) => {
          const strong = subject.modules.filter(
            (m) => m.confidence === 'strong'
          ).length;
          const total = subject.modules.length;
          const pct = safePercent(strong, total);

          return (
            <details
              key={subject.code}
              className="glass-card rounded-xl overflow-hidden group"
              open
            >
              <summary className="flex items-center gap-3 p-4 cursor-pointer select-none list-none">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {subject.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {strong}/{total} mastered
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {subject.name}
                  </p>
                  <Progress value={pct} className="h-1.5 mt-2" />
                </div>
                {pct === 100 && (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                )}
              </summary>

              <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                {subject.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`text-sm flex-1 ${
                        mod.confidence === 'strong'
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {mod.name}
                    </span>
                    <select
                      value={mod.confidence}
                      onChange={(e) =>
                        setModuleConfidence(
                          subject.code,
                          mod.id,
                          e.target.value as ConfidenceLevel
                        )
                      }
                      className="text-xs px-2 py-1 rounded-md border border-white/10 bg-white/5 cursor-pointer outline-none focus:border-primary/50 transition-colors"
                      style={{
                        color: CONFIDENCE_COLORS[mod.confidence],
                      }}
                    >
                      {CONFIDENCE_OPTIONS.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          className="bg-card text-foreground"
                        >
                          {CONFIDENCE_LABELS[opt]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
