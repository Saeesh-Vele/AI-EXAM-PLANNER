'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Gauge } from 'lucide-react';

export default function ReadinessChart() {
  const { state } = useExamStore();
  const readiness = state.studyPlan?.readinessScores ?? [];

  if (readiness.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Exam Readiness
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">
          Generate a study plan to see readiness scores
        </p>
      </div>
    );
  }

  const data = readiness.map((r) => ({
    name: r.subjectCode,
    readiness: r.readinessPercent,
    fill: r.color,
  }));

  const avgReadiness =
    readiness.length > 0
      ? Math.round(
          readiness.reduce((sum, r) => sum + r.readinessPercent, 0) /
            readiness.length
        )
      : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Exam Readiness
        </h3>
        <div className="text-right">
          <span className="text-xl font-bold gradient-text">{avgReadiness}%</span>
          <p className="text-[10px] text-muted-foreground">avg readiness</p>
        </div>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{
                background: 'oklch(0.17 0.012 265)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value: unknown) => [`${value}%`, 'Readiness']}
            />
            <Bar dataKey="readiness" radius={[6, 6, 0, 0]} barSize={32}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-subject detail */}
      <div className="mt-3 space-y-2">
        {readiness.map((r) => (
          <div key={r.subjectCode} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-muted-foreground">{r.subjectCode}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-green-400">{r.strongModules}S</span>
              <span className="text-blue-400">{r.goodModules}G</span>
              <span className="text-orange-400">{r.basicModules}B</span>
              <span className="text-red-400">{r.notStartedModules}N</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
