'use client';

import React from 'react';
import { useExamStore } from '@/lib/store/exam-store';
import { RISK_COLORS, RISK_LABELS, type SubjectRisk } from '@/lib/types';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

const riskIcons = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
  critical: AlertTriangle,
};

export default function RiskPanel() {
  const { state } = useExamStore();
  const risks = state.studyPlan?.riskAssessments ?? [];

  if (risks.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          Risk Assessment
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">
          Generate a study plan to see risk analysis
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-primary" />
        Risk Assessment
      </h3>

      <div className="space-y-3">
        {risks.map((risk, i) => {
          const Icon = riskIcons[risk.riskLevel];
          return (
            <div
              key={risk.subjectCode}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] animate-slide-up"
              style={{
                animationDelay: `${i * 0.05}s`,
                borderLeft: `3px solid ${risk.color}`,
              }}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: RISK_COLORS[risk.riskLevel] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{risk.subjectCode}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: RISK_COLORS[risk.riskLevel],
                      backgroundColor: `${RISK_COLORS[risk.riskLevel]}15`,
                    }}
                  >
                    {RISK_LABELS[risk.riskLevel]}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {risk.remainingModules} modules left • {risk.daysRemaining} days
                </p>
              </div>
              <div className="text-right">
                <span
                  className="text-lg font-bold"
                  style={{ color: RISK_COLORS[risk.riskLevel] }}
                >
                  {risk.riskScore}
                </span>
                <p className="text-[10px] text-muted-foreground">score</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
