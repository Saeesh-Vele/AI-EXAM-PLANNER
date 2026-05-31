// ============================================================
// ExamFlow AI — Schedule Builder
// Converts priority allocations into module-level time blocks.
// ============================================================

import {
  Subject,
  ExamEntry,
  DifficultyRating,
  StudyBlock,
  StudyBlockType,
  PriorityLevel,
  DaySchedule,
  CONFIDENCE_WEIGHTS,
} from '../types';
import { generateId, minutesToTime, addDays, daysBetween } from '../utils';
import {
  optimizeForExamGap,
  isExamDay,
  isPreExamPeriod,
  getBlockTypeForDay,
} from './exam-gap-optimizer';
import { calculateModulePriorities } from './priority-calculator';
import { getSubjectColor } from '../data/syllabus';

const BLOCK_DURATION_MINUTES = 120;  // 2 hours per block
const BREAK_DURATION_MINUTES = 30;   // 30 min between blocks
const START_HOUR = 9;
const START_MINUTES = START_HOUR * 60;

/**
 * Build the schedule for a single day with module-level allocation.
 */
export function buildDaySchedule(
  date: string,
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  dailyHours: number
): DaySchedule {
  // Check if it's an exam day
  const examDay = isExamDay(date, exams);
  if (examDay) {
    return {
      date,
      blocks: [],
      totalHours: 0,
      isExamDay: true,
      examSubject: examDay.subjectCode,
    };
  }

  // Get gap-optimized allocations
  const allocations = optimizeForExamGap(
    date,
    subjects,
    exams,
    difficultyRatings,
    dailyHours
  );

  if (allocations.length === 0) {
    return { date, blocks: [], totalHours: 0, isExamDay: false };
  }

  // Get module-level priorities for picking specific modules
  const modulePriorities = calculateModulePriorities(
    subjects,
    exams,
    difficultyRatings,
    date
  );

  // Check pre-exam period
  const preExam = isPreExamPeriod(date, exams);

  const blocks: StudyBlock[] = [];
  let currentMinutes = START_MINUTES;
  const totalBlocks = Math.floor(dailyHours / 2);
  let remainingBlocks = totalBlocks;

  // Track which modules have been assigned this day
  const assignedModuleIds = new Set<string>();

  for (const alloc of allocations) {
    const subject = subjects.find((s) => s.code === alloc.subjectCode);
    if (!subject || remainingBlocks <= 0) continue;

    const subjectBlocks = Math.max(
      1,
      Math.round((alloc.hours / dailyHours) * totalBlocks)
    );
    const actualBlocks = Math.min(subjectBlocks, remainingBlocks);

    // Get this subject's modules sorted by priority
    const subjectModulePriorities = modulePriorities.filter(
      (mp) => mp.subjectCode === alloc.subjectCode
    );

    // Find days to this subject's exam
    const exam = exams.find((e) => e.subjectCode === alloc.subjectCode);
    const daysToExam = exam ? daysBetween(date, exam.date) : 999;

    for (let i = 0; i < actualBlocks; i++) {
      if (currentMinutes >= 23 * 60) break; // Don't schedule past 11 PM

      // Determine block type based on exam proximity
      let blockType: StudyBlockType;
      if (preExam && preExam.exam.subjectCode === alloc.subjectCode) {
        blockType = getBlockTypeForDay(preExam.daysToExam, i, actualBlocks);
      } else if (daysToExam <= 3) {
        blockType = getBlockTypeForDay(daysToExam, i, actualBlocks);
      } else {
        blockType = 'study';
      }

      // Pick the best module for this block
      let moduleId: string;
      let moduleName: string;

      if (blockType === 'revision') {
        // For revision, pick the weakest module (highest knowledge gap)
        const weakModules = subjectModulePriorities.filter(
          (mp) => !assignedModuleIds.has(mp.moduleId)
        );
        const pickRevision = weakModules.length > 0 ? weakModules[0] : subjectModulePriorities[0];
        moduleId = pickRevision?.moduleId ?? subject.modules[0]?.id ?? '';
        moduleName = pickRevision
          ? `Revision: ${pickRevision.moduleName}`
          : `${subject.code} Full Revision`;
      } else if (blockType === 'mock') {
        moduleId = `mock-${subject.code}`;
        moduleName = `${subject.code} Mock Paper Practice`;
      } else {
        // For study, pick highest priority unassigned module
        const unassigned = subjectModulePriorities.filter(
          (mp) => !assignedModuleIds.has(mp.moduleId) && mp.confidence !== 'strong'
        );
        const pick = unassigned.length > 0
          ? unassigned[0]
          : subjectModulePriorities.filter((mp) => mp.confidence !== 'strong')[0];

        if (pick) {
          moduleId = pick.moduleId;
          moduleName = pick.moduleName;
          assignedModuleIds.add(pick.moduleId);
        } else {
          // All modules strong — switch to revision
          blockType = 'revision';
          moduleId = subject.modules[0]?.id ?? '';
          moduleName = `${subject.code} Full Revision`;
        }
      }

      // Determine priority level
      let priority: PriorityLevel = 'low';
      if (daysToExam <= 3) priority = 'urgent';
      else if (daysToExam <= 7) priority = 'medium';

      // Determine color
      let color = getSubjectColor(alloc.subjectCode);
      if (blockType === 'revision') color = '#3b82f6';
      if (blockType === 'mock') color = '#a855f7';

      blocks.push({
        id: generateId(),
        subjectCode: alloc.subjectCode,
        subjectName: subject.name,
        moduleId,
        moduleName,
        date,
        startTime: minutesToTime(currentMinutes),
        endTime: minutesToTime(currentMinutes + BLOCK_DURATION_MINUTES),
        hours: 2,
        type: blockType,
        priority,
        color,
        blockCompleted: false,
      });

      currentMinutes += BLOCK_DURATION_MINUTES + BREAK_DURATION_MINUTES;
      remainingBlocks--;
    }
  }

  return {
    date,
    blocks,
    totalHours: blocks.length * 2,
    isExamDay: false,
  };
}

/**
 * Build the complete schedule from current date to last exam.
 */
export function buildFullSchedule(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string,
  dailyHours: number
): DaySchedule[] {
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedExams.length === 0) return [];

  const lastExamDate = sortedExams[sortedExams.length - 1].date;
  const totalDays = daysBetween(currentDate, lastExamDate);
  const schedule: DaySchedule[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(currentDate, i);
    const daySchedule = buildDaySchedule(
      date,
      subjects,
      exams,
      difficultyRatings,
      dailyHours
    );
    schedule.push(daySchedule);
  }

  return schedule;
}
