'use client';

import React, { useState, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useExamStore } from '@/lib/store/exam-store';
import {
  blocksToCalendarEvents,
  replanFromDate,
  generateStudyPlan,
} from '@/lib/engine/planning-engine';
import DayDetailModal from './DayDetailModal';
import type { EventClickArg } from '@fullcalendar/core';
import type { StudyBlock } from '@/lib/types';

export default function StudyCalendar() {
  const { state, completeBlock, setStudyPlan } = useExamStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<StudyBlock[]>([]);

  const events = useMemo(() => {
    if (!state.studyPlan) return [];
    return blocksToCalendarEvents(state.studyPlan.blocks, state.exams);
  }, [state.studyPlan, state.exams]);

  const handleDateClick = (info: { dateStr: string }) => {
    const blocks =
      state.studyPlan?.blocks.filter((b) => b.date === info.dateStr) ?? [];
    if (blocks.length > 0) {
      setSelectedDate(info.dateStr);
      setSelectedBlocks(blocks);
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    const date = info.event.startStr.split('T')[0];
    const blocks =
      state.studyPlan?.blocks.filter((b) => b.date === date) ?? [];
    setSelectedDate(date);
    setSelectedBlocks(blocks);
  };

  const handleCompleteBlock = useCallback(
    (blockId: string) => {
      // Mark block as completed in store
      completeBlock(blockId);

      // Trigger adaptive replanning from today
      if (state.studyPlan) {
        const updatedPlan = replanFromDate(
          { ...state.studyPlan, blocks: state.studyPlan.blocks.map(b => b.id === blockId ? { ...b, blockCompleted: true } : b) },
          state.subjects,
          state.exams,
          state.difficultyRatings,
          state.currentDate,
          state.dailyStudyHours
        );
        setStudyPlan(updatedPlan);
      }

      // Update modal state
      setSelectedBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, blockCompleted: true } : b))
      );
    },
    [completeBlock, setStudyPlan, state]
  );

  return (
    <div className="glass-card rounded-xl p-5">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={3}
        weekends={true}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
      />

      <DayDetailModal
        date={selectedDate}
        blocks={selectedBlocks}
        exams={state.exams}
        onClose={() => {
          setSelectedDate(null);
          setSelectedBlocks([]);
        }}
        onCompleteBlock={handleCompleteBlock}
      />
    </div>
  );
}
