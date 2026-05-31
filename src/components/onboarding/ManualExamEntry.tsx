'use client';

// ============================================================
// ExamFlow AI — Manual Exam Entry Component
// Allows users to manually enter exam dates when OCR fails.
// ============================================================

import React, { useState } from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { SEMESTER_6_SUBJECTS } from '@/lib/data/syllabus';
import { DEFAULT_EXAMS } from '@/lib/data/syllabus';
import { Calendar, PenLine, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExamEntry } from '@/lib/types';

export default function ManualExamEntry() {
  const { setExams } = useExamStore();

  const [entries, setEntries] = useState<ExamEntry[]>(
    SEMESTER_6_SUBJECTS.map((s) => ({
      subjectCode: s.code,
      subjectName: s.name,
      date: '',
    }))
  );

  const updateDate = (index: number, date: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], date };
      return next;
    });
  };

  const handleFillDefaults = () => {
    setEntries(
      DEFAULT_EXAMS.map((e) => ({ ...e }))
    );
  };

  const handleSave = () => {
    const filled = entries.filter((e) => e.date !== '');
    if (filled.length > 0) {
      setExams(filled);
    }
  };

  const filledCount = entries.filter((e) => e.date !== '').length;
  const allFilled = filledCount === entries.length;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <PenLine className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">
            Enter Exam Dates Manually
          </p>
          <p className="text-xs text-amber-300/70 mt-0.5">
            Fill in your exam dates below. You can also use the default schedule.
          </p>
        </div>
      </div>

      {/* Subject Entries */}
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const subject = SEMESTER_6_SUBJECTS.find((s) => s.code === entry.subjectCode);
          const hasDate = entry.date !== '';

          return (
            <div
              key={entry.subjectCode}
              className={`glass-card rounded-xl p-4 transition-all duration-300 ${
                hasDate ? 'border-green-500/20 bg-green-500/5' : ''
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                {/* Subject Color Dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject?.color ?? '#888' }}
                />

                {/* Subject Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {entry.subjectCode}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.subjectName}
                  </p>
                </div>

                {/* Date Input */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateDate(index, e.target.value)}
                    className="w-40 bg-white/5 border-white/10 text-sm"
                  />
                </div>

                {/* Check mark */}
                {hasDate && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleFillDefaults}
          className="flex-1 gap-2 border-white/10 hover:bg-white/5 text-sm"
        >
          <CalendarDays className="w-4 h-4" />
          Fill Default Dates (June 2026)
        </Button>

        <Button
          onClick={handleSave}
          disabled={filledCount === 0}
          className="flex-1 gap-2 gradient-accent text-white text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          Save {filledCount > 0 ? `(${filledCount} exam${filledCount !== 1 ? 's' : ''})` : ''}
        </Button>
      </div>

      {allFilled && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
          ✓ All {entries.length} exam dates entered. Proceed to review.
        </div>
      )}
    </div>
  );
}
