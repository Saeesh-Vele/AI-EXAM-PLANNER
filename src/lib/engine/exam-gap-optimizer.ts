// ============================================================
// ExamFlow AI — Exam Gap Optimizer
// The most critical scheduling logic.
// ============================================================

import { Subject, ExamEntry, DifficultyRating, SubjectPriority, StudyBlockType } from '../types';
import { daysBetween } from '../utils';
import { calculatePriorities, allocateHours } from './priority-calculator';

export interface GapAllocation {
  subjectCode: string;
  hours: number;
  percentage: number;
}

/**
 * Determines block type distribution for a study day.
 * Last 2 days: 70% revision, 20% mock, 10% weak topics
 * Last day: 100% revision
 */
export function getBlockTypeForDay(
  daysToExam: number,
  blockIndex: number,
  totalBlocks: number
): StudyBlockType {
  if (daysToExam === 1) {
    // Last day before exam — 100% revision
    return 'revision';
  }

  if (daysToExam === 2) {
    // 2 days before exam — 70% revision, 20% mock, 10% weak topics (study)
    const revisionBlocks = Math.max(1, Math.round(totalBlocks * 0.7));
    const mockBlocks = Math.max(0, Math.round(totalBlocks * 0.2));

    if (blockIndex < revisionBlocks) return 'revision';
    if (blockIndex < revisionBlocks + mockBlocks) return 'mock';
    return 'study'; // weak topics
  }

  if (daysToExam <= 3) {
    // 3 days — mostly revision with some mock
    const revisionBlocks = Math.max(1, Math.round(totalBlocks * 0.6));
    if (blockIndex < revisionBlocks) return 'revision';
    if (blockIndex < revisionBlocks + 1) return 'mock';
    return 'study';
  }

  return 'study';
}

/**
 * Determine how to allocate study hours for a given date,
 * with special handling for exam gaps.
 *
 * Key rules:
 * - gap ≤ 3 days: 90-100% to next exam subject ONLY
 * - gap 4-5 days: 70-80% to next exam, remainder to second nearest
 * - gap > 5 days: normal priority-based distribution
 * - Never waste gap time on distant subjects
 */
export function optimizeForExamGap(
  date: string,
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  dailyHours: number
): GapAllocation[] {
  // Sort exams by date
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find upcoming exams after this date
  const upcomingExams = sortedExams.filter(
    (e) => daysBetween(date, e.date) > 0
  );

  if (upcomingExams.length === 0) return [];

  const nextExam = upcomingExams[0];
  const daysToNext = daysBetween(date, nextExam.date);
  const nextSubject = subjects.find((s) => s.code === nextExam.subjectCode);

  if (!nextSubject) return [];

  // -----------------------------------------------------------
  // TIGHT GAP: ≤ 3 days — 90-100% focus on NEXT exam ONLY
  // -----------------------------------------------------------
  if (daysToNext <= 3) {
    const focusPercent = daysToNext === 1 ? 1.0 : 0.9 + (0.1 * (3 - daysToNext)) / 2;
    const focusHours = dailyHours * focusPercent;
    const remainingHours = dailyHours - focusHours;

    const allocations: GapAllocation[] = [
      {
        subjectCode: nextExam.subjectCode,
        hours: focusHours,
        percentage: focusPercent * 100,
      },
    ];

    // Only give remaining to second nearest if meaningful
    if (remainingHours > 0.25 && upcomingExams.length > 1) {
      allocations.push({
        subjectCode: upcomingExams[1].subjectCode,
        hours: remainingHours,
        percentage: (1 - focusPercent) * 100,
      });
    }

    return allocations;
  }

  // -----------------------------------------------------------
  // MEDIUM GAP: 4-5 days — 70-80% to next exam
  // -----------------------------------------------------------
  if (daysToNext <= 5) {
    const focusPercent = 0.7 + (0.1 * (5 - daysToNext)) / 2;
    const focusHours = dailyHours * focusPercent;
    const remainingHours = dailyHours - focusHours;

    const allocations: GapAllocation[] = [
      {
        subjectCode: nextExam.subjectCode,
        hours: focusHours,
        percentage: focusPercent * 100,
      },
    ];

    if (remainingHours > 0.25) {
      const otherExams = upcomingExams.slice(1);
      if (otherExams.length > 0) {
        const otherSubjects = subjects.filter((s) =>
          otherExams.some((e) => e.subjectCode === s.code)
        );
        const otherPriorities = calculatePriorities(
          otherSubjects,
          otherExams,
          difficultyRatings,
          date
        );
        const otherAlloc = allocateHours(otherPriorities, remainingHours);
        for (const [code, hours] of otherAlloc) {
          allocations.push({
            subjectCode: code,
            hours,
            percentage: (hours / dailyHours) * 100,
          });
        }
      }
    }

    return allocations;
  }

  // -----------------------------------------------------------
  // NORMAL: > 5 days — priority-based allocation
  // -----------------------------------------------------------
  const priorities = calculatePriorities(
    subjects,
    exams,
    difficultyRatings,
    date
  );

  const hourAlloc = allocateHours(priorities, dailyHours);
  const allocations: GapAllocation[] = [];

  for (const [code, hours] of hourAlloc) {
    allocations.push({
      subjectCode: code,
      hours,
      percentage: (hours / dailyHours) * 100,
    });
  }

  return allocations;
}

/**
 * Check if a date is the day before an exam (revision day).
 */
export function isRevisionDay(date: string, exams: ExamEntry[]): ExamEntry | null {
  for (const exam of exams) {
    const gap = daysBetween(date, exam.date);
    if (gap === 1) return exam;
  }
  return null;
}

/**
 * Check if a date is within last 2 days before an exam.
 */
export function isPreExamPeriod(date: string, exams: ExamEntry[]): { exam: ExamEntry; daysToExam: number } | null {
  for (const exam of exams) {
    const gap = daysBetween(date, exam.date);
    if (gap >= 1 && gap <= 2) return { exam, daysToExam: gap };
  }
  return null;
}

/**
 * Check if a date is an exam day.
 */
export function isExamDay(date: string, exams: ExamEntry[]): ExamEntry | null {
  for (const exam of exams) {
    if (date === exam.date) return exam;
  }
  return null;
}
