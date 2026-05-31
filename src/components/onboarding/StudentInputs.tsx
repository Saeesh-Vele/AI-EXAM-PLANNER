'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, CalendarDays, Sun, Moon } from 'lucide-react';

export default function StudentInputs() {
  const { state, setCurrentDate, setDailyHours } = useExamStore();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">Your Study Setup</h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your schedule so we can optimize the plan
        </p>
      </div>

      {/* Current Date */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <Label className="text-sm font-medium">Current Date</Label>
            <p className="text-xs text-muted-foreground">
              When do you want to start studying?
            </p>
          </div>
        </div>
        <Input
          type="date"
          value={state.currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="bg-white/5 border-white/10"
        />
      </div>

      {/* Daily Study Hours */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Daily Study Hours</Label>
            <p className="text-xs text-muted-foreground">
              How many hours can you study each day?
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold gradient-text">
              {state.dailyStudyHours}
            </span>
            <span className="text-sm text-muted-foreground ml-1">hrs</span>
          </div>
        </div>

        <Slider
          value={[state.dailyStudyHours]}
          onValueChange={(val) => setDailyHours(Array.isArray(val) ? val[0] : val)}
          min={2}
          max={14}
          step={1}
          className="py-2"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>2 hrs</span>
          <span>14 hrs</span>
        </div>

        {/* Visual time blocks */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {Array.from({ length: Math.floor(state.dailyStudyHours / 2) }).map(
            (_, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
                style={{
                  background:
                    i < 2
                      ? 'rgba(59, 130, 246, 0.15)'
                      : i < 4
                      ? 'rgba(168, 85, 247, 0.15)'
                      : 'rgba(34, 197, 94, 0.15)',
                  color:
                    i < 2
                      ? 'rgb(96, 165, 250)'
                      : i < 4
                      ? 'rgb(192, 132, 252)'
                      : 'rgb(74, 222, 128)',
                }}
              >
                {i < Math.floor(state.dailyStudyHours / 4) ? (
                  <Sun className="w-3 h-3" />
                ) : (
                  <Moon className="w-3 h-3" />
                )}
                Block {i + 1}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
