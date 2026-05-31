'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import StudyCalendar from '@/components/calendar/StudyCalendar';

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Study Calendar" subtitle="Your day-by-day study schedule" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <StudyCalendar />
      </div>
    </div>
  );
}
