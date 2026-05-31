// ============================================================
// ExamFlow AI — Hardcoded Syllabus Data
// Mumbai University Computer Engineering — Semester 6
// ============================================================

import { Subject } from '../types';

export const SEMESTER_6_SUBJECTS: Subject[] = [
  {
    code: 'SPCC',
    name: 'System Programming and Compiler Construction',
    shortName: 'Sys. Prog. & CC',
    color: 'hsl(350, 80%, 55%)',
    bgColor: 'hsla(350, 80%, 55%, 0.15)',
    modules: [
      { id: 'spcc-1', name: 'Introduction to System Software', completed: false },
      { id: 'spcc-2', name: 'Assemblers', completed: false },
      { id: 'spcc-3', name: 'Macros and Macro Processor', completed: false },
      { id: 'spcc-4', name: 'Loaders and Linkers', completed: false },
      { id: 'spcc-5', name: 'Compiler Analysis Phase', completed: false },
      { id: 'spcc-6', name: 'Compiler Synthesis Phase', completed: false },
    ],
  },
  {
    code: 'CSS',
    name: 'Cryptography and System Security',
    shortName: 'Crypto & Security',
    color: 'hsl(200, 80%, 55%)',
    bgColor: 'hsla(200, 80%, 55%, 0.15)',
    modules: [
      { id: 'css-1', name: 'Number Theory and Basic Cryptography', completed: false },
      { id: 'css-2', name: 'Symmetric and Asymmetric Cryptography', completed: false },
      { id: 'css-3', name: 'Cryptographic Hash Functions', completed: false },
      { id: 'css-4', name: 'Authentication Protocols', completed: false },
      { id: 'css-5', name: 'Network Security', completed: false },
      { id: 'css-6', name: 'System Security', completed: false },
    ],
  },
  {
    code: 'MC',
    name: 'Mobile Computing',
    shortName: 'Mobile Comp.',
    color: 'hsl(142, 70%, 45%)',
    bgColor: 'hsla(142, 70%, 45%, 0.15)',
    modules: [
      { id: 'mc-1', name: 'Introduction to Mobile Computing', completed: false },
      { id: 'mc-2', name: 'GSM Mobile Services', completed: false },
      { id: 'mc-3', name: 'Mobile Networking', completed: false },
      { id: 'mc-4', name: 'Wireless LAN', completed: false },
      { id: 'mc-5', name: 'Mobility Management', completed: false },
      { id: 'mc-6', name: 'LTE and 5G', completed: false },
    ],
  },
  {
    code: 'AI',
    name: 'Artificial Intelligence',
    shortName: 'AI',
    color: 'hsl(271, 80%, 60%)',
    bgColor: 'hsla(271, 80%, 60%, 0.15)',
    modules: [
      { id: 'ai-1', name: 'Introduction to Artificial Intelligence', completed: false },
      { id: 'ai-2', name: 'Intelligent Agents', completed: false },
      { id: 'ai-3', name: 'Problem Solving', completed: false },
      { id: 'ai-4', name: 'Knowledge and Reasoning', completed: false },
      { id: 'ai-5', name: 'Planning and Learning', completed: false },
      { id: 'ai-6', name: 'AI Applications', completed: false },
    ],
  },
  {
    code: 'QA',
    name: 'Quantitative Analysis',
    shortName: 'Quant. Analysis',
    color: 'hsl(38, 90%, 55%)',
    bgColor: 'hsla(38, 90%, 55%, 0.15)',
    modules: [
      { id: 'qa-1', name: 'Introduction to Statistics', completed: false },
      { id: 'qa-2', name: 'Data Collection and Sampling', completed: false },
      { id: 'qa-3', name: 'Regression', completed: false },
      { id: 'qa-4', name: 'Multiple Linear Regression', completed: false },
      { id: 'qa-5', name: 'Statistical Inference', completed: false },
      { id: 'qa-6', name: 'Hypothesis Testing', completed: false },
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
