'use client';

import React, { useCallback, useState } from 'react';
import Header from '@/components/layout/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import CompletionChart from '@/components/dashboard/CompletionChart';
import AIInsights from '@/components/dashboard/AIInsights';
import SubjectProgress from '@/components/dashboard/SubjectProgress';
import RiskPanel from '@/components/dashboard/RiskPanel';
import ReadinessChart from '@/components/dashboard/ReadinessChart';
import StudyCalendar from '@/components/calendar/StudyCalendar';
import { useExamStore } from '@/lib/store/exam-store';
import { generateStudyPlan } from '@/lib/engine/planning-engine';

export default function DashboardPage() {
  const { state, setStudyPlan } = useExamStore();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const plan = generateStudyPlan(
      state.subjects,
      state.exams,
      state.difficultyRatings,
      state.currentDate,
      state.dailyStudyHours
    );

    setStudyPlan(plan);
    setIsRegenerating(false);
  }, [state, setStudyPlan]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Mumbai University — CE Semester 6"
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar + Charts — 2 columns */}
          <div className="xl:col-span-2 space-y-6">
            <StudyCalendar />
            <CompletionChart />
          </div>

          {/* Sidebar — 1 column */}
          <div className="space-y-6">
            <RiskPanel />
            <ReadinessChart />
            <AIInsights />
            <SubjectProgress />
          </div>
        </div>
      </div>
    </div>
  );
}
