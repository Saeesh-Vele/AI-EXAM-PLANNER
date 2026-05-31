'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { safePercent } from '@/lib/utils';
import { CONFIDENCE_COLORS, CONFIDENCE_LABELS, type ConfidenceLevel } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export default function CompletionChart() {
  const { state } = useExamStore();

  // Per-subject confidence breakdown
  const subjectData = state.subjects.map((s) => {
    const strong = s.modules.filter((m) => m.confidence === 'strong').length;
    const good = s.modules.filter((m) => m.confidence === 'good').length;
    const basic = s.modules.filter((m) => m.confidence === 'basic').length;
    const notStarted = s.modules.filter(
      (m) => m.confidence === 'not_started'
    ).length;
    const total = s.modules.length;
    return {
      name: s.code,
      strong,
      good,
      basic,
      notStarted,
      total,
      fill: s.color,
    };
  });

  // Overall confidence distribution for donut
  const totalStrong = subjectData.reduce((s, d) => s + d.strong, 0);
  const totalGood = subjectData.reduce((s, d) => s + d.good, 0);
  const totalBasic = subjectData.reduce((s, d) => s + d.basic, 0);
  const totalNotStarted = subjectData.reduce((s, d) => s + d.notStarted, 0);
  const totalModules = subjectData.reduce((s, d) => s + d.total, 0);

  const donutData = [
    { name: 'Strong', value: totalStrong, fill: CONFIDENCE_COLORS.strong },
    { name: 'Good', value: totalGood, fill: CONFIDENCE_COLORS.good },
    { name: 'Basic', value: totalBasic, fill: CONFIDENCE_COLORS.basic },
    {
      name: 'Not Started',
      value: totalNotStarted,
      fill: CONFIDENCE_COLORS.not_started,
    },
  ].filter((d) => d.value > 0);

  const masteryPercent = safePercent(totalStrong, totalModules);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Stacked Bar — Confidence per subject */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">
          Confidence by Subject
        </h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={subjectData}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 40 }}
            >
              <XAxis type="number" domain={[0, 6]} hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.17 0.012 265)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey="strong"
                stackId="a"
                fill={CONFIDENCE_COLORS.strong}
                barSize={18}
                name="Strong"
              />
              <Bar
                dataKey="good"
                stackId="a"
                fill={CONFIDENCE_COLORS.good}
                barSize={18}
                name="Good"
              />
              <Bar
                dataKey="basic"
                stackId="a"
                fill={CONFIDENCE_COLORS.basic}
                barSize={18}
                name="Basic"
              />
              <Bar
                dataKey="notStarted"
                stackId="a"
                fill={CONFIDENCE_COLORS.not_started}
                barSize={18}
                name="Not Started"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut — Overall confidence distribution */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">
          Overall Confidence
        </h3>
        <div className="h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.17 0.012 265)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value: unknown) => [`${value} modules`]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {masteryPercent}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                Mastered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
