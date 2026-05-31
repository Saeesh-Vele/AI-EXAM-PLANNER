'use client';

import { ExamStoreProvider, useExamStore } from '@/lib/store/exam-store';
import StepWizard from '@/components/onboarding/StepWizard';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

function HomeContent() {
  const { state } = useExamStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl gradient-accent animate-pulse" />
      </div>
    );
  }

  if (state.onboardingComplete && state.studyPlan) {
    // Use window.location for client-side navigation to dashboard
    window.location.href = '/dashboard';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl gradient-accent animate-pulse" />
      </div>
    );
  }

  return <StepWizard />;
}

export default function Home() {
  return (
    <ExamStoreProvider>
      <HomeContent />
    </ExamStoreProvider>
  );
}
