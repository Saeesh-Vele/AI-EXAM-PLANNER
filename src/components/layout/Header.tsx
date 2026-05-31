'use client';

import React from 'react';
import { Settings, RefreshCw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function Header({
  title,
  subtitle,
  onRegenerate,
  isRegenerating,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="gap-2 glass-card border-white/10 hover:border-primary/30"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`}
            />
            {isRegenerating ? 'Generating...' : 'Regenerate Plan'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
        </Button>

        <Link href="/dashboard/settings">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
