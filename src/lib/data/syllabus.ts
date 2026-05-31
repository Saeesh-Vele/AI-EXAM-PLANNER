// ============================================================
// ExamFlow AI — Hardcoded Syllabus Data
// Mumbai University Computer Engineering — Semester 6
// ============================================================

import { Subject, Module, ConfidenceLevel } from '../types';

function mod(id: string, name: string): Module {
  return { id, name, confidence: 'not_started' as ConfidenceLevel, completed: false };
}

export const SEMESTER_6_SUBJECTS: Subject[] = [
  {
    code: 'SPCC',
    name: 'System Programming and Compiler Construction',
    shortName: 'Sys. Prog. & CC',
    color: 'hsl(350, 80%, 55%)',
    bgColor: 'hsla(350, 80%, 55%, 0.15)',
    modules: [
      mod('spcc-1', 'Introduction to System Software'),
      mod('spcc-2', 'Assemblers'),
      mod('spcc-3', 'Macros and Macro Processor'),
      mod('spcc-4', 'Loaders and Linkers'),
      mod('spcc-5', 'Compiler Analysis Phase'),
      mod('spcc-6', 'Compiler Synthesis Phase'),
    ],
  },
  {
    code: 'CSS',
    name: 'Cryptography and System Security',
    shortName: 'Crypto & Security',
    color: 'hsl(200, 80%, 55%)',
    bgColor: 'hsla(200, 80%, 55%, 0.15)',
    modules: [
      mod('css-1', 'Number Theory and Basic Cryptography'),
      mod('css-2', 'Symmetric and Asymmetric Cryptography'),
      mod('css-3', 'Cryptographic Hash Functions'),
      mod('css-4', 'Authentication Protocols'),
      mod('css-5', 'Network Security'),
      mod('css-6', 'System Security'),
    ],
  },
  {
    code: 'MC',
    name: 'Mobile Computing',
    shortName: 'Mobile Comp.',
    color: 'hsl(142, 70%, 45%)',
    bgColor: 'hsla(142, 70%, 45%, 0.15)',
    modules: [
      mod('mc-1', 'Introduction to Mobile Computing'),
      mod('mc-2', 'GSM Mobile Services'),
      mod('mc-3', 'Mobile Networking'),
      mod('mc-4', 'Wireless LAN'),
      mod('mc-5', 'Mobility Management'),
      mod('mc-6', 'LTE and 5G'),
    ],
  },
  {
    code: 'AI',
    name: 'Artificial Intelligence',
    shortName: 'AI',
    color: 'hsl(271, 80%, 60%)',
    bgColor: 'hsla(271, 80%, 60%, 0.15)',
    modules: [
      mod('ai-1', 'Introduction to Artificial Intelligence'),
      mod('ai-2', 'Intelligent Agents'),
      mod('ai-3', 'Problem Solving'),
      mod('ai-4', 'Knowledge and Reasoning'),
      mod('ai-5', 'Planning and Learning'),
      mod('ai-6', 'AI Applications'),
    ],
  },
  {
    code: 'QA',
    name: 'Quantitative Analysis',
    shortName: 'Quant. Analysis',
    color: 'hsl(38, 90%, 55%)',
    bgColor: 'hsla(38, 90%, 55%, 0.15)',
    modules: [
      mod('qa-1', 'Introduction to Statistics'),
      mod('qa-2', 'Data Collection and Sampling'),
      mod('qa-3', 'Regression'),
      mod('qa-4', 'Multiple Linear Regression'),
      mod('qa-5', 'Statistical Inference'),
      mod('qa-6', 'Hypothesis Testing'),
    ],
  },
];

export const DEFAULT_DIFFICULTY_RATINGS = [
  { subjectCode: 'SPCC', rating: 4 as const },
  { subjectCode: 'CSS', rating: 4 as const },
  { subjectCode: 'MC', rating: 2 as const },
  { subjectCode: 'AI', rating: 5 as const },
  { subjectCode: 'QA', rating: 2 as const },
];

export const DEFAULT_EXAMS = [
  { subjectCode: 'SPCC', subjectName: 'System Programming and Compiler Construction', date: '2026-06-10' },
  { subjectCode: 'CSS', subjectName: 'Cryptography and System Security', date: '2026-06-14' },
  { subjectCode: 'MC', subjectName: 'Mobile Computing', date: '2026-06-18' },
  { subjectCode: 'AI', subjectName: 'Artificial Intelligence', date: '2026-06-21' },
  { subjectCode: 'QA', subjectName: 'Quantitative Analysis', date: '2026-06-25' },
];

export function getSubjectByCode(code: string): Subject | undefined {
  return SEMESTER_6_SUBJECTS.find((s) => s.code === code);
}

export function getSubjectColor(code: string): string {
  return getSubjectByCode(code)?.color ?? 'hsl(0, 0%, 50%)';
}

export function getSubjectBgColor(code: string): string {
  return getSubjectByCode(code)?.bgColor ?? 'hsla(0, 0%, 50%, 0.15)';
}
