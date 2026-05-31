'use client';

// ============================================================
// ApiKeyModal is DEPRECATED.
// API keys are now configured via server-side environment variables.
// This component is kept as a no-op to avoid import errors.
// See: Settings page (/dashboard/settings) for configuration status.
// ============================================================

import React from 'react';

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApiKeyModal({ open, onOpenChange }: ApiKeyModalProps) {
  // No-op — keys are now server-side via process.env
  return null;
}
