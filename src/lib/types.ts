// ============================================================
// ExamFlow AI — Core Type Definitions
// ============================================================

export interface Module {
  id: string;
  name: string;
  completed: boolean;
}

export interface Subject {
  code: string;
  name: string;
  shortName: string;
  modules: Module[];
  color: string;       // HSL color for calendar events
  bgColor: string;     // Background color variant
}

export interface ExamEntry {
  subjectCode: string;
  subjectName: string;
  date: string; // ISO date string YYYY-MM-DD
}

export interface DifficultyRating {
  subjectCode: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export type StudyBlockType = 'study' | 'revision' | 'mock';
export type PriorityLevel = 'urgent' | 'medium' | 'low';

export interface StudyBlock {
  id: string;
  subjectCode: string;
  subjectName: string;
  moduleName: string;
  date: string;        // ISO date string YYYY-MM-DD
  startTime: string;   // HH:mm format
  endTime: string;     // HH:mm format
  type: StudyBlockType;
  priority: PriorityLevel;
  color: string;
}

export interface StudyPlan {
  blocks: StudyBlock[];
  insights: AIInsight[];
  generatedAt: string;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  message: string;
  subjectCode?: string;
}

export interface SubjectPriority {
  subjectCode: string;
  remainingModules: number;
  totalModules: number;
  difficultyWeight: number;
  daysRemaining: number;
  priorityScore: number;
  completionPercent: number;
}

export interface DaySchedule {
  date: string;
  blocks: StudyBlock[];
  totalHours: number;
  isExamDay: boolean;
  examSubject?: string;
}

export interface ExamStoreState {
  // Step 1 & 2: Exam timetable
  exams: ExamEntry[];

  // Step 3: Student inputs
  currentDate: string;
  dailyStudyHours: number;

  // Step 4: Syllabus completion
  subjects: Subject[];

  // Step 5: Difficulty ratings
  difficultyRatings: DifficultyRating[];

  // Generated plan
  studyPlan: StudyPlan | null;

  // App state
  onboardingComplete: boolean;
  apiKeys: {
    groq: string;
    gemini: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;        // ISO datetime
  end: string;           // ISO datetime
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    subjectCode: string;
    moduleName: string;
    type: StudyBlockType;
    priority: PriorityLevel;
  };
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  urgent: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
};

export const BLOCK_TYPE_COLORS: Record<StudyBlockType, string> = {
  study: '',       // Uses subject color
  revision: '#3b82f6',
  mock: '#a855f7',
};
