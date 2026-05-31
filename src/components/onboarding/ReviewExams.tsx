'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { SEMESTER_6_SUBJECTS } from '@/lib/data/syllabus';
import { formatDateShort } from '@/lib/utils';
import { Calendar, Pencil, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ReviewExams() {
  const { state, setExams } = useExamStore();

  const updateExam = (index: number, field: string, value: string) => {
    const updated = [...state.exams];
    if (field === 'date') {
      updated[index] = { ...updated[index], date: value };
    } else if (field === 'subjectCode') {
      const subject = SEMESTER_6_SUBJECTS.find((s) => s.code === value);
      updated[index] = {
        ...updated[index],
        subjectCode: value,
        subjectName: subject?.name ?? value,
      };
    }
    setExams(updated);
  };

  const removeExam = (index: number) => {
    setExams(state.exams.filter((_, i) => i !== index));
  };

  const addExam = () => {
    const usedCodes = state.exams.map((e) => e.subjectCode);
    const available = SEMESTER_6_SUBJECTS.find(
      (s) => !usedCodes.includes(s.code)
    );
    if (available) {
      setExams([
        ...state.exams,
        {
          subjectCode: available.code,
          subjectName: available.name,
          date: '',
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">Review Exam Schedule</h2>
        <p className="text-sm text-muted-foreground">
          Verify the extracted dates and make corrections if needed
        </p>
      </div>

      <div className="space-y-3">
        {state.exams.map((exam, index) => {
          const subject = SEMESTER_6_SUBJECTS.find(
            (s) => s.code === exam.subjectCode
          );

          return (
            <div
              key={`${exam.subjectCode}-${index}`}
              className="glass-card glass-card-hover rounded-xl p-4 animate-slide-up"
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
                  <div className="flex items-center gap-2">
                    <select
                      value={exam.subjectCode}
                      onChange={(e) =>
                        updateExam(index, 'subjectCode', e.target.value)
                      }
                      className="bg-transparent text-sm font-semibold border-none outline-none cursor-pointer"
                    >
                      {SEMESTER_6_SUBJECTS.map((s) => (
                        <option
                          key={s.code}
                          value={s.code}
                          className="bg-card text-foreground"
                        >
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {subject?.name}
                  </p>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={exam.date}
                    onChange={(e) => updateExam(index, 'date', e.target.value)}
                    className="w-40 bg-white/5 border-white/10 text-sm"
                  />
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeExam(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {exam.date && (
                <div className="mt-2 ml-7">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {formatDateShort(exam.date)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.exams.length < 5 && (
        <Button
          variant="outline"
          onClick={addExam}
          className="w-full gap-2 border-dashed border-white/10"
        >
          <Plus className="w-4 h-4" />
          Add Exam
        </Button>
      )}
    </div>
  );
}
