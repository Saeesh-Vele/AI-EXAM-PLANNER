'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { daysBetween, safePercent } from '@/lib/utils';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  Target,
  AlertTriangle,
  Gauge,
} from 'lucide-react';
import { RISK_COLORS, type RiskLevel } from '@/lib/types';

export default function StatsCards() {
  const { state } = useExamStore();

  const totalModules = state.subjects.reduce(
    (s, sub) => s + sub.modules.length,
    0
  );
  const strongModules = state.subjects.reduce(
    (s, sub) =>
      s + sub.modules.filter((m) => m.confidence === 'strong').length,
    0
  );
  const remainingModules = totalModules - strongModules;
  const overallPercent = safePercent(strongModules, totalModules);

  // Find next exam
  const now = state.currentDate;
  const upcomingExams = state.exams
    .filter((e) => daysBetween(now, e.date) > 0)
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  const nextExamDays =
    upcomingExams.length > 0 ? daysBetween(now, upcomingExams[0].date) : 0;
  const nextExamName = upcomingExams[0]?.subjectCode ?? '—';

  // Highest risk
  const risks = state.studyPlan?.riskAssessments ?? [];
  const highestRisk = risks.length > 0 ? risks[0] : null;

  // Average readiness
  const readiness = state.studyPlan?.readinessScores ?? [];
  const avgReadiness =
    readiness.length > 0
      ? Math.round(
          readiness.reduce((sum, r) => sum + r.readinessPercent, 0) /
            readiness.length
        )
      : 0;

  // Today's tasks
  const todayBlocks =
    state.studyPlan?.blocks.filter(
      (b) => b.date === state.currentDate && !b.blockCompleted
    ) ?? [];

  // Weekly progress — completed blocks this week
  const completedThisWeek =
    state.studyPlan?.blocks.filter((b) => {
      const d = daysBetween(state.currentDate, b.date);
      return d >= -7 && d <= 0 && b.blockCompleted;
    }).length ?? 0;

  const statConfig = [
    {
      label: 'Next Exam',
      value: nextExamDays > 0 ? `${nextExamDays}d` : '—',
      subtitle: nextExamName,
      icon: Calendar,
      color: 'hsl(350, 80%, 55%)',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
    {
      label: 'Highest Risk',
      value: highestRisk?.subjectCode ?? '—',
      subtitle: highestRisk ? `Score: ${highestRisk.riskScore}` : 'N/A',
      icon: AlertTriangle,
      color: highestRisk ? RISK_COLORS[highestRisk.riskLevel] : 'hsl(0,0%,50%)',
      bg: highestRisk
        ? `${RISK_COLORS[highestRisk.riskLevel]}15`
        : 'rgba(128,128,128,0.1)',
    },
    {
      label: 'Modules Left',
      value: remainingModules,
      subtitle: `of ${totalModules} total`,
      icon: Target,
      color: 'hsl(271, 91%, 65%)',
      bg: 'rgba(168, 85, 247, 0.1)',
    },
    {
      label: 'Readiness',
      value: `${avgReadiness}%`,
      subtitle: 'avg across subjects',
      icon: Gauge,
      color: 'hsl(142, 71%, 45%)',
      bg: 'rgba(34, 197, 94, 0.1)',
    },
    {
      label: "Today's Tasks",
      value: todayBlocks.length,
      subtitle: `${todayBlocks.length * 2}h study`,
      icon: BookOpen,
      color: 'hsl(217, 91%, 60%)',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      label: 'Weekly Done',
      value: completedThisWeek,
      subtitle: 'blocks completed',
      icon: CheckCircle2,
      color: 'hsl(38, 90%, 55%)',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statConfig.map((stat, i) => (
        <div
          key={stat.label}
          className="stat-card glass-card glass-card-hover rounded-xl p-4 animate-slide-up"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: stat.bg }}
            >
              <stat.icon
                className="w-4 h-4"
                style={{ color: stat.color }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stat.label}
          </div>
          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
            {stat.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
