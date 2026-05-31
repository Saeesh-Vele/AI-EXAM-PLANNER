// ============================================================
// ExamFlow AI — AI Prompt Templates
// ============================================================

import { Subject, ExamEntry, DifficultyRating } from '../types';

export function buildStudyPlanPrompt(
  subjects: Subject[],
  exams: ExamEntry[],
  difficultyRatings: DifficultyRating[],
  currentDate: string,
  dailyHours: number
): string {
  const subjectDetails = subjects
    .map((s) => {
      const exam = exams.find((e) => e.subjectCode === s.code);
      const difficulty = difficultyRatings.find(
        (d) => d.subjectCode === s.code
      );
      const mastered = s.modules.filter((m) => m.confidence === 'strong').map((m) => m.name);
      const inProgress = s.modules.filter((m) => m.confidence === 'good' || m.confidence === 'basic').map((m) => `${m.name} (${m.confidence})`);
      const remaining = s.modules.filter((m) => m.confidence === 'not_started').map((m) => m.name);
      return `
Subject: ${s.name} (${s.code})
Exam Date: ${exam?.date ?? 'Not set'}
Difficulty: ${difficulty?.rating ?? 3}/5
Mastered Modules: ${mastered.length > 0 ? mastered.join(', ') : 'None'}
In Progress: ${inProgress.length > 0 ? inProgress.join(', ') : 'None'}
Not Started: ${remaining.length > 0 ? remaining.join(', ') : 'All started'}`;
    })
    .join('\n');

  return `You are an expert academic study planner for Mumbai University Computer Engineering Semester 6 exams.

Current Date: ${currentDate}
Daily Available Study Hours: ${dailyHours}

Subjects and Status:
${subjectDetails}

Generate a comprehensive study plan with the following:

1. **Daily Plan**: For each day from ${currentDate} until the last exam, provide specific study blocks with:
   - Subject code
   - Module/topic to study
   - Duration (in hours)
   - Type: "study", "revision", or "mock"
   - Priority: "urgent", "medium", or "low"

2. **Key Rules**:
   - Harder subjects get more study hours
   - Closer exams get higher priority
   - After each exam, immediately focus on the next exam
   - Reserve the day before each exam for full revision
   - If the gap between two exams is ≤ 3 days, allocate 90-100% of study time to the upcoming exam
   - Every remaining module MUST be scheduled before its exam
   - Don't overload any single day beyond ${dailyHours} hours

3. **Insights**: Provide 5-8 actionable recommendations about the student's study situation.

Respond ONLY with valid JSON in this exact format:
{
  "dailyPlan": [
    {
      "date": "YYYY-MM-DD",
      "blocks": [
        {
          "subjectCode": "CODE",
          "moduleName": "Module Name",
          "hours": 2,
          "type": "study|revision|mock",
          "priority": "urgent|medium|low"
        }
      ]
    }
  ],
  "insights": [
    {
      "type": "warning|success|info|danger",
      "message": "Insight text",
      "subjectCode": "CODE (optional)"
    }
  ],
  "revisionStrategy": "Brief description of revision approach",
  "examGapStrategy": "Brief description of how exam gaps will be utilized"
}`;
}

// buildOCRPrompt removed — OCR now uses Groq with an inline prompt in app/api/ocr/route.ts
