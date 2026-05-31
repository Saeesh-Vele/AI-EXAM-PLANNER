// ============================================================
// ExamFlow AI — Priority Calculator (Module-Level)
// Formula: ModulePriority = DifficultyWeight × KnowledgeGap × ExamUrgency
// ============================================================

import {
  Subject,
  ExamEntry,
  DifficultyRating,
  SubjectPriority,
  ModulePriority,
  SubjectRisk,
  SubjectReadiness,
  ConfidenceLevel,
  CONFIDENCE_WEIGHTS,
  type RiskLevel,
} from '../types';
import { daysBetween, safePercent } from '../utils';

/**
 * Calculate module-level priorities.
 * ModulePriority = DifficultyWeight × KnowledgeGap × ExamUrgency
 */
export function calculateModulePriorities(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string
): ModulePriority[] {
  const priorities: ModulePriority[] = [];

  for (const subject of subjects) {
    const exam = exams.find((e) => e.subjectCode === subject.code);
    if (!exam) continue;

    const daysRemaining = daysBetween(currentDate, exam.date);
    if (daysRemaining <= 0) continue;

    const difficulty = difficultyRatings.find(
      (d) => d.subjectCode === subject.code
    );
    const difficultyWeight = difficulty?.rating ?? 3;

    // ExamUrgency increases as exam approaches
    const examUrgency = Math.max(1, 10 / daysRemaining);

    for (const mod of subject.modules) {
      const knowledgeGap = CONFIDENCE_WEIGHTS[mod.confidence];
      const priorityScore = difficultyWeight * knowledgeGap * examUrgency;

      priorities.push({
        subjectCode: subject.code,
        moduleId: mod.id,
        moduleName: mod.name,
        difficultyWeight,
        knowledgeGap,
        examUrgency,
        priorityScore,
        confidence: mod.confidence,
      });
    }
  }

  // Sort by priority score descending
  priorities.sort((a, b) => b.priorityScore - a.priorityScore);
  return priorities;
}

/**
 * Calculate subject-level priorities (aggregated from modules).
 */
export function calculatePriorities(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string
): SubjectPriority[] {
  const priorities: SubjectPriority[] = [];

  for (const subject of subjects) {
    const exam = exams.find((e) => e.subjectCode === subject.code);
    if (!exam) continue;

    const daysRemaining = daysBetween(currentDate, exam.date);
    if (daysRemaining <= 0) continue;

    const totalModules = subject.modules.length;
    const remainingModules = subject.modules.filter(
      (m) => m.confidence !== 'strong'
    ).length;

    const difficulty = difficultyRatings.find(
      (d) => d.subjectCode === subject.code
    );
    const difficultyWeight = difficulty?.rating ?? 3;

    // Average knowledge gap across modules
    const avgKnowledgeGap =
      totalModules > 0
        ? subject.modules.reduce(
            (sum, m) => sum + CONFIDENCE_WEIGHTS[m.confidence],
            0
          ) / totalModules
        : 0;

    const priorityScore =
      daysRemaining > 0
        ? (remainingModules * difficultyWeight * avgKnowledgeGap) / daysRemaining
        : remainingModules > 0
        ? 999
        : 0;

    priorities.push({
      subjectCode: subject.code,
      remainingModules,
      totalModules,
      difficultyWeight,
      daysRemaining,
      priorityScore,
      completionPercent: safePercent(totalModules - remainingModules, totalModules),
      avgKnowledgeGap,
    });
  }

  priorities.sort((a, b) => b.priorityScore - a.priorityScore);
  return priorities;
}

/**
 * Allocate study hours proportionally based on priority scores.
 */
export function allocateHours(
  priorities: SubjectPriority[],
  totalHours: number
): Map<string, number> {
  const allocation = new Map<string, number>();
  if (priorities.length === 0) return allocation;

  const totalScore = priorities.reduce((sum, p) => sum + p.priorityScore, 0);

  if (totalScore === 0) {
    const perSubject = totalHours / priorities.length;
    priorities.forEach((p) => allocation.set(p.subjectCode, perSubject));
    return allocation;
  }

  for (const p of priorities) {
    const hours = (p.priorityScore / totalScore) * totalHours;
    allocation.set(p.subjectCode, Math.max(0.5, hours));
  }

  // Normalize
  const allocated = Array.from(allocation.values()).reduce((a, b) => a + b, 0);
  if (allocated > totalHours) {
    const scale = totalHours / allocated;
    for (const [key, val] of allocation) {
      allocation.set(key, val * scale);
    }
  }

  return allocation;
}

/**
 * Calculate risk assessment per subject.
 */
export function calculateRisk(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string
): SubjectRisk[] {
  const risks: SubjectRisk[] = [];

  for (const subject of subjects) {
    const exam = exams.find((e) => e.subjectCode === subject.code);
    if (!exam) continue;

    const daysRemaining = Math.max(0, daysBetween(currentDate, exam.date));
    const totalModules = subject.modules.length;
    const remainingModules = subject.modules.filter(
      (m) => m.confidence !== 'strong'
    ).length;

    const avgConfidence =
      totalModules > 0
        ? subject.modules.reduce(
            (sum, m) => sum + (4 - CONFIDENCE_WEIGHTS[m.confidence]),
            0
          ) / (totalModules * 3) // normalized to 0–1
        : 0;

    const difficulty = difficultyRatings.find(
      (d) => d.subjectCode === subject.code
    );
    const diffWeight = difficulty?.rating ?? 3;

    // Risk formula: more remaining + harder + closer exam = higher risk
    let riskScore: number;
    if (daysRemaining === 0) {
      riskScore = remainingModules > 0 ? 100 : 0;
    } else {
      const completionFactor = remainingModules / totalModules; // 0–1
      const urgencyFactor = Math.min(1, 5 / daysRemaining);    // 0–1
      const diffFactor = diffWeight / 5;                        // 0–1
      riskScore = Math.round(
        (completionFactor * 40 + urgencyFactor * 35 + diffFactor * 15 + (1 - avgConfidence) * 10)
      );
    }

    let riskLevel: RiskLevel;
    if (riskScore <= 25) riskLevel = 'low';
    else if (riskScore <= 50) riskLevel = 'medium';
    else if (riskScore <= 75) riskLevel = 'high';
    else riskLevel = 'critical';

    risks.push({
      subjectCode: subject.code,
      subjectName: subject.name,
      riskLevel,
      riskScore,
      remainingModules,
      daysRemaining,
      avgConfidence,
      color: subject.color,
    });
  }

  risks.sort((a, b) => b.riskScore - a.riskScore);
  return risks;
}

/**
 * Calculate readiness score per subject.
 */
export function calculateReadiness(
  subjects: Subject[],
  exams: ExamEntry[]
): SubjectReadiness[] {
  const scores: SubjectReadiness[] = [];

  for (const subject of subjects) {
    const exam = exams.find((e) => e.subjectCode === subject.code);
    if (!exam) continue;

    const total = subject.modules.length;
    const strong = subject.modules.filter((m) => m.confidence === 'strong').length;
    const good = subject.modules.filter((m) => m.confidence === 'good').length;
    const basic = subject.modules.filter((m) => m.confidence === 'basic').length;
    const notStarted = subject.modules.filter((m) => m.confidence === 'not_started').length;

    // Readiness: strong=100%, good=70%, basic=30%, not_started=0%
    const readiness =
      total > 0
        ? Math.round(
            ((strong * 100 + good * 70 + basic * 30 + notStarted * 0) / (total * 100)) * 100
          )
        : 0;

    scores.push({
      subjectCode: subject.code,
      subjectName: subject.name,
      readinessPercent: readiness,
      strongModules: strong,
      goodModules: good,
      basicModules: basic,
      notStartedModules: notStarted,
      totalModules: total,
      color: subject.color,
    });
  }

  return scores;
}
