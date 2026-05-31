'use client';

// ============================================================
// ExamFlow AI — State Management (React Context + localStorage)
// API keys are NOT stored here — they are server-side only.
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  ExamEntry,
  DifficultyRating,
  StudyPlan,
  ExamStoreState,
  ConfidenceLevel,
} from '../types';
import { SEMESTER_6_SUBJECTS, DEFAULT_DIFFICULTY_RATINGS } from '../data/syllabus';
import { todayISO } from '../utils';

// ---- Default State ----

const defaultState: ExamStoreState = {
  exams: [],
  currentDate: todayISO(),
  dailyStudyHours: 8,
  subjects: SEMESTER_6_SUBJECTS.map((s) => ({
    ...s,
    modules: s.modules.map((m) => ({ ...m })),
  })),
  difficultyRatings: DEFAULT_DIFFICULTY_RATINGS.map((d) => ({ ...d })),
  studyPlan: null,
  onboardingComplete: false,
};

// ---- Actions ----

type Action =
  | { type: 'SET_EXAMS'; payload: ExamEntry[] }
  | { type: 'SET_CURRENT_DATE'; payload: string }
  | { type: 'SET_DAILY_HOURS'; payload: number }
  | { type: 'SET_MODULE_CONFIDENCE'; payload: { subjectCode: string; moduleId: string; confidence: ConfidenceLevel } }
  | { type: 'SET_DIFFICULTY'; payload: DifficultyRating }
  | { type: 'SET_STUDY_PLAN'; payload: StudyPlan }
  | { type: 'COMPLETE_BLOCK'; payload: string }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<ExamStoreState> }
  | { type: 'RESET' };

function reducer(state: ExamStoreState, action: Action): ExamStoreState {
  switch (action.type) {
    case 'SET_EXAMS':
      return { ...state, exams: action.payload };

    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload };

    case 'SET_DAILY_HOURS':
      return { ...state, dailyStudyHours: action.payload };

    case 'SET_MODULE_CONFIDENCE': {
      const { subjectCode, moduleId, confidence } = action.payload;
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.code === subjectCode
            ? {
                ...s,
                modules: s.modules.map((m) =>
                  m.id === moduleId
                    ? { ...m, confidence, completed: confidence === 'strong' }
                    : m
                ),
              }
            : s
        ),
      };
    }

    case 'SET_DIFFICULTY': {
      const existing = state.difficultyRatings.findIndex(
        (d) => d.subjectCode === action.payload.subjectCode
      );
      const newRatings = [...state.difficultyRatings];
      if (existing >= 0) {
        newRatings[existing] = action.payload;
      } else {
        newRatings.push(action.payload);
      }
      return { ...state, difficultyRatings: newRatings };
    }

    case 'SET_STUDY_PLAN':
      return { ...state, studyPlan: action.payload };

    case 'COMPLETE_BLOCK': {
      if (!state.studyPlan) return state;
      const blockId = action.payload;
      return {
        ...state,
        studyPlan: {
          ...state.studyPlan,
          blocks: state.studyPlan.blocks.map((b) =>
            b.id === blockId ? { ...b, blockCompleted: true } : b
          ),
        },
      };
    }

    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, onboardingComplete: action.payload };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    case 'RESET':
      return { ...defaultState };

    default:
      return state;
  }
}

// ---- Context ----

interface ExamStoreContextType {
  state: ExamStoreState;
  dispatch: React.Dispatch<Action>;
  setExams: (exams: ExamEntry[]) => void;
  setCurrentDate: (date: string) => void;
  setDailyHours: (hours: number) => void;
  setModuleConfidence: (subjectCode: string, moduleId: string, confidence: ConfidenceLevel) => void;
  setDifficulty: (subjectCode: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  setStudyPlan: (plan: StudyPlan) => void;
  completeBlock: (blockId: string) => void;
  completeOnboarding: () => void;
  resetStore: () => void;
}

const StoreContext = createContext<ExamStoreContextType | null>(null);

const STORAGE_KEY = 'examflow-ai-state';

export function ExamStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const setExams = useCallback(
    (exams: ExamEntry[]) => dispatch({ type: 'SET_EXAMS', payload: exams }),
    []
  );

  const setCurrentDate = useCallback(
    (date: string) => dispatch({ type: 'SET_CURRENT_DATE', payload: date }),
    []
  );

  const setDailyHours = useCallback(
    (hours: number) => dispatch({ type: 'SET_DAILY_HOURS', payload: hours }),
    []
  );

  const setModuleConfidence = useCallback(
    (subjectCode: string, moduleId: string, confidence: ConfidenceLevel) =>
      dispatch({ type: 'SET_MODULE_CONFIDENCE', payload: { subjectCode, moduleId, confidence } }),
    []
  );

  const setDifficulty = useCallback(
    (subjectCode: string, rating: 1 | 2 | 3 | 4 | 5) =>
      dispatch({
        type: 'SET_DIFFICULTY',
        payload: { subjectCode, rating },
      }),
    []
  );

  const setStudyPlan = useCallback(
    (plan: StudyPlan) => dispatch({ type: 'SET_STUDY_PLAN', payload: plan }),
    []
  );

  const completeBlock = useCallback(
    (blockId: string) => dispatch({ type: 'COMPLETE_BLOCK', payload: blockId }),
    []
  );

  const completeOnboarding = useCallback(
    () => dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true }),
    []
  );

  const resetStore = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <StoreContext.Provider
      value={{
        state,
        dispatch,
        setExams,
        setCurrentDate,
        setDailyHours,
        setModuleConfidence,
        setDifficulty,
        setStudyPlan,
        completeBlock,
        completeOnboarding,
        resetStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useExamStore(): ExamStoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useExamStore must be used within ExamStoreProvider');
  }
  return context;
}
