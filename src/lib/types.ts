// ============================================================
// ExamFlow AI — Core Type Definitions
// ============================================================

// ---- Confidence Levels ----

export type ConfidenceLevel = 'not_started' | 'basic' | 'good' | 'strong';

export const CONFIDENCE_WEIGHTS: Record<ConfidenceLevel, number> = {
  not_started: 4,
  basic: 3,
  good: 2,
  strong: 1,
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  not_started: 'Not Started',
  basic: 'Basic Understanding',
  good: 'Good Understanding',
  strong: 'Strong Understanding',
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  not_started: '#ef4444',
  basic: '#f97316',
  good: '#3b82f6',
  strong: '#22c55e',
};

// ---- Data Models ----

export interface Module {
  id: string;
  name: string;
  confidence: ConfidenceLevel;
  /** Derived convenience — true when confidence === 'strong' */
  completed: boolean;
}

export interface Subject {
  code: string;
  name: string;
  shortName: string;
  modules: Module[];
  color: string;
  bgColor: string;
}

export interface ExamEntry {
  subjectCode: string;
  subjectName: string;
  date: string; // YYYY-MM-DD
}

export interface DifficultyRating {
  subjectCode: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

// ---- Study Blocks ----

export type StudyBlockType = 'study' | 'revision' | 'mock';
export type PriorityLevel = 'urgent' | 'medium' | 'low';

export interface StudyBlock {
  id: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleName: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  hours: number;
  type: StudyBlockType;
  priority: PriorityLevel;
  color: string;
  blockCompleted: boolean;
}

// ---- Module Priority ----

export interface ModulePriority {
  subjectCode: string;
  moduleId: string;
  moduleName: string;
  difficultyWeight: number;
  knowledgeGap: number;
  examUrgency: number;
  priorityScore: number;
  confidence: ConfidenceLevel;
}

// ---- Subject Priority ----

export interface SubjectPriority {
  subjectCode: string;
  remainingModules: number;
  totalModules: number;
  difficultyWeight: number;
  daysRemaining: number;
  priorityScore: number;
  completionPercent: number;
  avgKnowledgeGap: number;
}

// ---- Risk & Readiness ----

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SubjectRisk {
  subjectCode: string;
  subjectName: string;
  riskLevel: RiskLevel;
  riskScore: number;       // 0–100
  remainingModules: number;
  daysRemaining: number;
  avgConfidence: number;
  color: string;
}

export interface SubjectReadiness {
  subjectCode: string;
  subjectName: string;
  readinessPercent: number; // 0–100
  strongModules: number;
  goodModules: number;
  basicModules: number;
  notStartedModules: number;
  totalModules: number;
  color: string;
}

// ---- Study Plan ----

export interface StudyPlan {
  blocks: StudyBlock[];
  insights: AIInsight[];
  riskAssessments: SubjectRisk[];
  readinessScores: SubjectReadiness[];
  generatedAt: string;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  message: string;
  subjectCode?: string;
}

// ---- Day Schedule ----

export interface DaySchedule {
  date: string;
  blocks: StudyBlock[];
  totalHours: number;
  isExamDay: boolean;
  examSubject?: string;
}

// ---- Calendar Event ----

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    subjectCode: string;
    moduleId: string;
    moduleName: string;
    type: StudyBlockType;
    priority: PriorityLevel;
    hours: number;
    blockCompleted: boolean;
  };
}

// ---- App State ----

export interface ExamStoreState {
  exams: ExamEntry[];
  currentDate: string;
  dailyStudyHours: number;
  subjects: Subject[];
  difficultyRatings: DifficultyRating[];
  studyPlan: StudyPlan | null;
  onboardingComplete: boolean;
}

// ---- Constants ----

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
  study: '',
  revision: '#3b82f6',
  mock: '#a855f7',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical',
};
