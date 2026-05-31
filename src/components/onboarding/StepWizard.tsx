'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamStore } from '@/lib/store/exam-store';
import { generateStudyPlan } from '@/lib/engine/planning-engine';
import UploadTimetable from './UploadTimetable';
import ReviewExams from './ReviewExams';
import StudentInputs from './StudentInputs';
import SyllabusCompletion from './SyllabusCompletion';
import DifficultyRating from './DifficultyRating';
import { GraduationCap, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { title: 'Upload Timetable', desc: 'Upload your exam schedule' },
  { title: 'Review Exams', desc: 'Verify extracted exam dates' },
  { title: 'Study Hours', desc: 'Set your daily availability' },
  { title: 'Syllabus Status', desc: 'Mark completed modules' },
  { title: 'Difficulty Rating', desc: 'Rate subject difficulty' },
];

export default function StepWizard() {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { state, setStudyPlan, completeOnboarding } = useExamStore();

  const canProceed = () => {
    switch (step) {
      case 0:
        return state.exams.length > 0;
      case 1:
        return state.exams.length > 0 && state.exams.every((e) => e.date);
      case 2:
        return state.dailyStudyHours > 0;
      case 3:
        return true;
      case 4:
        return state.difficultyRatings.length === 5;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Generate plan using the client-side engine
    const plan = generateStudyPlan(
      state.subjects,
      state.exams,
      state.difficultyRatings,
      state.currentDate,
      state.dailyStudyHours
    );

    setStudyPlan(plan);
    completeOnboarding();
    setIsGenerating(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]"
          style={{ background: 'oklch(0.65 0.2 264)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-[120px]"
          style={{ background: 'oklch(0.6 0.22 300)' }}
        />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4 glow-primary">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            ExamFlow AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Mumbai University — Computer Engineering — Semester 6
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div
                  className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step
                      ? 'gradient-accent text-white'
                      : i === step
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-white/5 text-muted-foreground'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-500 ${
                      i < step
                        ? 'bg-primary'
                        : 'bg-white/10'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{STEPS[step].title}</p>
            <p className="text-xs text-muted-foreground">
              {STEPS[step].desc}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && <UploadTimetable />}
              {step === 1 && <ReviewExams />}
              {step === 2 && <StudentInputs />}
              {step === 3 && <SyllabusCompletion />}
              {step === 4 && <DifficultyRating />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="gap-2 gradient-accent text-white px-6"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Generating Plan...
              </>
            ) : step === STEPS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Study Plan
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
