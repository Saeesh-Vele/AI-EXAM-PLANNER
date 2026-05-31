'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime12h } from '@/lib/utils';
import { getSubjectByCode } from '@/lib/data/syllabus';
import { Clock, BookOpen, RefreshCw, FileText, Check } from 'lucide-react';
import type { StudyBlock, ExamEntry } from '@/lib/types';

interface DayDetailModalProps {
  date: string | null;
  blocks: StudyBlock[];
  exams: ExamEntry[];
  onClose: () => void;
  onCompleteBlock: (blockId: string) => void;
}

const typeConfig = {
  study: {
    icon: BookOpen,
    label: 'Study',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  revision: {
    icon: RefreshCw,
    label: 'Revision',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  mock: {
    icon: FileText,
    label: 'Mock Test',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  },
};

const priorityBadge = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/20',
  medium: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  low: 'bg-green-500/15 text-green-400 border-green-500/20',
};

export default function DayDetailModal({
  date,
  blocks,
  exams,
  onClose,
  onCompleteBlock,
}: DayDetailModalProps) {
  const isOpen = date !== null;
  const examToday = exams.find((e) => e.date === date);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="glass-card bg-background/80 backdrop-blur-2xl border-white/10 sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {date ? formatDate(date) : ''}
          </DialogTitle>
        </DialogHeader>

        {examToday && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center mb-2">
            📝 EXAM DAY: {examToday.subjectCode}
          </div>
        )}

        {blocks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {examToday
                ? 'No study blocks — exam day!'
                : 'No study blocks scheduled'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, i) => {
              const subject = getSubjectByCode(block.subjectCode);
              const typeInfo = typeConfig[block.type];
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={block.id}
                  className={`p-3 rounded-xl border border-white/5 animate-slide-up ${
                    block.blockCompleted
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-white/[0.03]'
                  }`}
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    borderLeft: `3px solid ${
                      block.blockCompleted
                        ? '#22c55e'
                        : (subject?.color ?? '#666')
                    }`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTime12h(block.startTime)} –{' '}
                        {formatTime12h(block.endTime)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({block.hours}h)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${priorityBadge[block.priority]}`}
                      >
                        {block.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${typeInfo.badge}`}
                      >
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject?.color }}
                    />
                    <span className="text-sm font-semibold">
                      {block.subjectCode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                    {block.moduleName}
                  </p>

                  {/* Mark Complete Button */}
                  <div className="mt-2 ml-4">
                    {block.blockCompleted ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCompleteBlock(block.id)}
                        className="h-7 text-xs gap-1 border-white/10 hover:border-green-500/30 hover:text-green-400"
                      >
                        <Check className="w-3 h-3" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-muted-foreground text-center">
                {blocks.length} study blocks •{' '}
                {blocks.reduce((sum, b) => sum + b.hours, 0)} hours total •{' '}
                {blocks.filter((b) => b.blockCompleted).length} completed
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
