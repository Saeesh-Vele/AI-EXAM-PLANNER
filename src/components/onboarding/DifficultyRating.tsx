'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { DIFFICULTY_LABELS } from '@/lib/types';
import { Star, Zap } from 'lucide-react';

export default function DifficultyRating() {
  const { state, setDifficulty } = useExamStore();

  const getDifficultyColor = (rating: number) => {
    switch (rating) {
      case 1: return 'text-green-400';
      case 2: return 'text-emerald-400';
      case 3: return 'text-amber-400';
      case 4: return 'text-orange-400';
      case 5: return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getDifficultyBg = (rating: number) => {
    switch (rating) {
      case 1: return 'rgba(74, 222, 128, 0.1)';
      case 2: return 'rgba(52, 211, 153, 0.1)';
      case 3: return 'rgba(251, 191, 36, 0.1)';
      case 4: return 'rgba(251, 146, 60, 0.1)';
      case 5: return 'rgba(248, 113, 113, 0.1)';
      default: return 'rgba(255,255,255,0.03)';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">Difficulty Rating</h2>
        <p className="text-sm text-muted-foreground">
          Rate how difficult each subject is for you
        </p>
      </div>

      <div className="space-y-3">
        {state.subjects.map((subject, idx) => {
          const rating =
            state.difficultyRatings.find(
              (d) => d.subjectCode === subject.code
            )?.rating ?? 3;

          return (
            <div
              key={subject.code}
              className="glass-card glass-card-hover rounded-xl p-4 animate-slide-up"
              style={{
                animationDelay: `${idx * 0.05}s`,
                borderLeft: `3px solid ${subject.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold">{subject.code}</span>
                  <p className="text-xs text-muted-foreground">
                    {subject.name}
                  </p>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: getDifficultyBg(rating),
                  }}
                >
                  <span className={getDifficultyColor(rating)}>
                    {DIFFICULTY_LABELS[rating]}
                  </span>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setDifficulty(
                        subject.code,
                        star as 1 | 2 | 3 | 4 | 5
                      )
                    }
                    className="difficulty-star p-1"
                  >
                    <Star
                      className={`w-6 h-6 transition-all ${
                        star <= rating
                          ? `${getDifficultyColor(rating)} fill-current`
                          : 'text-white/10'
                      }`}
                    />
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-1.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Zap
                      key={i}
                      className={`w-3 h-3 ${getDifficultyColor(rating)} fill-current opacity-60`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
