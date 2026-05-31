// ============================================================
// ExamFlow AI — Planning Engine Orchestrator
// ============================================================

import {
  Subject,
  ExamEntry,
  DifficultyRating,
  StudyPlan,
  AIInsight,
  StudyBlock,
  CalendarEvent,
} from '../types';
import { buildFullSchedule } from './schedule-builder';
import {
  calculatePriorities,
  calculateRisk,
  calculateReadiness,
} from './priority-calculator';
import { generateId, daysBetween, toISODateTime, safePercent } from '../utils';

/**
 * Generate the complete study plan with risk and readiness scores.
 */
export function generateStudyPlan(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string,
  dailyHours: number
): StudyPlan {
  const schedule = buildFullSchedule(
    subjects,
    exams,
    difficultyRatings,
    currentDate,
    dailyHours
  );

  const allBlocks: StudyBlock[] = [];
  for (const day of schedule) {
    allBlocks.push(...day.blocks);
  }

  const insights = generateInsights(
    subjects,
    exams,
    difficultyRatings,
    currentDate,
    dailyHours
  );

  const riskAssessments = calculateRisk(subjects, exams, difficultyRatings, currentDate);
  const readinessScores = calculateReadiness(subjects, exams);

  return {
    blocks: allBlocks,
    insights,
    riskAssessments,
    readinessScores,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Replan from a specific date forward (for adaptive replanning).
 * Preserves completed blocks before the date.
 */
export function replanFromDate(
  existingPlan: StudyPlan,
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  fromDate: string,
  dailyHours: number
): StudyPlan {
  // Keep completed blocks and blocks before fromDate
  const preservedBlocks = existingPlan.blocks.filter(
    (b) => b.blockCompleted || b.date < fromDate
  );

  // Rebuild schedule from fromDate forward
  const newSchedule = buildFullSchedule(
    subjects,
    exams,
    difficultyRatings,
    fromDate,
    dailyHours
  );

  const newBlocks: StudyBlock[] = [];
  for (const day of newSchedule) {
    newBlocks.push(...day.blocks);
  }

  const insights = generateInsights(
    subjects,
    exams,
    difficultyRatings,
    fromDate,
    dailyHours
  );

  const riskAssessments = calculateRisk(subjects, exams, difficultyRatings, fromDate);
  const readinessScores = calculateReadiness(subjects, exams);

  return {
    blocks: [...preservedBlocks, ...newBlocks],
    insights,
    riskAssessments,
    readinessScores,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate analytical insights based on current state.
 */
function generateInsights(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string,
  dailyHours: number
): AIInsight[] {
  const insights: AIInsight[] = [];
  const priorities = calculatePriorities(
    subjects,
    exams,
    difficultyRatings,
    currentDate
  );
  const risks = calculateRisk(subjects, exams, difficultyRatings, currentDate);
  const readiness = calculateReadiness(subjects, exams);

  // Highest risk subject
  if (risks.length > 0) {
    const highest = risks[0];
    if (highest.riskLevel === 'critical' || highest.riskLevel === 'high') {
      insights.push({
        id: generateId(),
        type: 'danger',
        message: `${highest.subjectName} is ${highest.riskLevel} risk with ${highest.remainingModules} modules remaining and only ${highest.daysRemaining} days until the exam.`,
        subjectCode: highest.subjectCode,
      });
    }
  }

  // Subjects on track
  for (const r of readiness) {
    if (r.readinessPercent >= 80) {
      insights.push({
        id: generateId(),
        type: 'success',
        message: `${r.subjectName} readiness is at ${r.readinessPercent}%. You're well-prepared.`,
        subjectCode: r.subjectCode,
      });
    }
  }

  // Subjects with low readiness
  for (const r of readiness) {
    if (r.readinessPercent < 40 && r.notStartedModules > 0) {
      insights.push({
        id: generateId(),
        type: 'warning',
        message: `${r.subjectName} readiness is only ${r.readinessPercent}% with ${r.notStartedModules} modules not started. Prioritize these immediately.`,
        subjectCode: r.subjectCode,
      });
    }
  }

  // Tight exam gaps
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (let i = 0; i < sortedExams.length - 1; i++) {
    const gap = daysBetween(sortedExams[i].date, sortedExams[i + 1].date);
    if (gap <= 3) {
      insights.push({
        id: generateId(),
        type: 'warning',
        message: `Only ${gap} day${gap === 1 ? '' : 's'} between ${sortedExams[i].subjectCode} and ${sortedExams[i + 1].subjectCode} exams. Study focus will shift immediately after ${sortedExams[i].subjectCode}.`,
      });
    }
  }

  // Overall recommendation
  const totalRemaining = subjects.reduce(
    (sum, s) => sum + s.modules.filter((m) => m.confidence !== 'strong').length,
    0
  );
  const totalModules = subjects.reduce((sum, s) => sum + s.modules.length, 0);
  const overallPercent = safePercent(totalModules - totalRemaining, totalModules);

  if (overallPercent < 50) {
    insights.push({
      id: generateId(),
      type: 'info',
      message: `Overall completion is ${overallPercent}%. Consider increasing daily study hours from ${dailyHours}h to ${Math.min(dailyHours + 2, 14)}h.`,
    });
  }

  return insights;
}

/**
 * Convert study blocks to FullCalendar events with proper colors.
 * Red=urgent, Orange=pending, Green=completed, Blue=revision, Purple=mock
 */
export function blocksToCalendarEvents(
  blocks: StudyBlock[],
  exams: ExamEntry[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const block of blocks) {
    let bgColor: string;
    let borderColor: string;

    if (block.blockCompleted) {
      bgColor = '#22c55e';
      borderColor = '#16a34a';
    } else if (block.type === 'revision') {
      bgColor = '#3b82f6';
      borderColor = '#2563eb';
    } else if (block.type === 'mock') {
      bgColor = '#a855f7';
      borderColor = '#9333ea';
    } else if (block.priority === 'urgent') {
      bgColor = '#ef4444';
      borderColor = '#dc2626';
    } else if (block.priority === 'medium') {
      bgColor = '#f97316';
      borderColor = '#ea580c';
    } else {
      bgColor = block.color;
      borderColor = block.color;
    }

    events.push({
      id: block.id,
      title: `${block.subjectCode} — ${block.moduleName}`,
      start: toISODateTime(block.date, block.startTime),
      end: toISODateTime(block.date, block.endTime),
      backgroundColor: bgColor,
      borderColor,
      textColor: '#ffffff',
      extendedProps: {
        subjectCode: block.subjectCode,
        moduleId: block.moduleId,
        moduleName: block.moduleName,
        type: block.type,
        priority: block.priority,
        hours: block.hours,
        blockCompleted: block.blockCompleted,
      },
    });
  }

  // Add exam day markers
  for (const exam of exams) {
    events.push({
      id: `exam-${exam.subjectCode}`,
      title: `📝 EXAM: ${exam.subjectCode}`,
      start: `${exam.date}T00:00:00`,
      end: `${exam.date}T23:59:59`,
      backgroundColor: '#dc2626',
      borderColor: '#b91c1c',
      textColor: '#ffffff',
      extendedProps: {
        subjectCode: exam.subjectCode,
        moduleId: '',
        moduleName: 'Exam Day',
        type: 'study' as const,
        priority: 'urgent' as const,
        hours: 0,
        blockCompleted: false,
      },
    });
  }

  return events;
}
