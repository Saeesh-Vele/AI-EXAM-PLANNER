'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import { useExamStore } from '@/lib/store/exam-store';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { safePercent, formatDateShort, daysBetween } from '@/lib/utils';
import {
  DIFFICULTY_LABELS,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
  type ConfidenceLevel,
} from '@/lib/types';
import { Calendar, Star } from 'lucide-react';

const CONFIDENCE_OPTIONS: ConfidenceLevel[] = [
  'not_started',
  'basic',
  'good',
  'strong',
];

export default function SubjectsPage() {
  const { state, setModuleConfidence } = useExamStore();

  return (
    <div className="flex flex-col h-full">
      <Header title="Subjects" subtitle="Track your syllabus mastery" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {state.subjects.map((subject) => {
          const strong = subject.modules.filter(
            (m) => m.confidence === 'strong'
          ).length;
          const total = subject.modules.length;
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

          const exam = state.exams.find(
            (e) => e.subjectCode === subject.code
          );
          const difficulty = state.difficultyRatings.find(
            (d) => d.subjectCode === subject.code
          );
          const daysLeft = exam
            ? daysBetween(state.currentDate, exam.date)
            : null;

          return (
            <div
              key={subject.code}
              className="glass-card glass-card-hover rounded-xl overflow-hidden"
              style={{ borderLeft: `4px solid ${subject.color}` }}
            >
              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold">{subject.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      {subject.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exam && (
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs ${
                          daysLeft !== null && daysLeft <= 3
                            ? 'border-red-500/30 text-red-400'
                            : daysLeft !== null && daysLeft <= 7
                            ? 'border-orange-500/30 text-orange-400'
                            : 'border-white/10'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDateShort(exam.date)}
                        {daysLeft !== null && ` (${daysLeft}d)`}
                      </Badge>
                    )}
                    {difficulty && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs border-white/10"
                      >
                        <Star className="w-3 h-3" />
                        {DIFFICULTY_LABELS[difficulty.rating]}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-1">
                  <Progress value={readiness} className="h-2 flex-1" />
                  <span className="text-sm font-semibold min-w-[3rem] text-right">
                    {readiness}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {strong}/{total} modules mastered • Readiness: {readiness}%
                </p>
              </div>

              {/* Modules */}
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/5 pt-4">
                {subject.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            CONFIDENCE_COLORS[mod.confidence],
                        }}
                      />
                      <span
                        className={`text-sm truncate ${
                          mod.confidence === 'strong'
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {mod.name}
                      </span>
                    </div>
                    <select
                      value={mod.confidence}
                      onChange={(e) =>
                        setModuleConfidence(
                          subject.code,
                          mod.id,
                          e.target.value as ConfidenceLevel
                        )
                      }
                      className="text-xs px-2 py-1 rounded-md border border-white/10 bg-white/5 cursor-pointer outline-none focus:border-primary/50 transition-colors flex-shrink-0"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
