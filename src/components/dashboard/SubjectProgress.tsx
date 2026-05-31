'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { safePercent } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CONFIDENCE_COLORS } from '@/lib/types';

export default function SubjectProgress() {
  const { state } = useExamStore();

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">Subject Progress</h3>

      <div className="space-y-4">
        {state.subjects.map((subject) => {
          const strong = subject.modules.filter(
            (m) => m.confidence === 'strong'
          ).length;
          const good = subject.modules.filter(
            (m) => m.confidence === 'good'
          ).length;
          const total = subject.modules.length;
          // weighted: strong=100%, good=70%, basic=30%
          const readiness =
            total > 0
              ? Math.round(
                  ((subject.modules.reduce((sum, m) => {
                    if (m.confidence === 'strong') return sum + 100;
                    if (m.confidence === 'good') return sum + 70;
                    if (m.confidence === 'basic') return sum + 30;
                    return sum;
                  }, 0)) / (total * 100)) * 100
                )
              : 0;

          return (
            <div key={subject.code} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm font-medium">{subject.code}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {strong}/{total} mastered • {readiness}%
                </span>
              </div>
              <div className="relative">
                <Progress value={readiness} className="h-2" />
                <div
                  className="absolute inset-0 h-2 rounded-full overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${subject.color} ${readiness}%, transparent ${readiness}%)`,
                    opacity: 0.3,
                  }}
                />
              </div>
              {/* Confidence dots */}
              <div className="flex items-center gap-1 mt-1">
                {subject.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: CONFIDENCE_COLORS[mod.confidence],
                    }}
                    title={`${mod.name}: ${mod.confidence}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
