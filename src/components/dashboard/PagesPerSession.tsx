'use client';

import React from 'react';
import AnalyticsCard from './AnalyticsCard';

interface PagesPerSessionProps {
  avgPagesPerSession: number;
  className?: string;
}

export default function PagesPerSession({
  avgPagesPerSession,
  className = '',
}: PagesPerSessionProps) {
  return (
    <AnalyticsCard
      title="Pages par session"
      value={avgPagesPerSession.toFixed(2)}
      subtitle="Nombre moyen de pages consultées par visite"
      icon="📄"
      trendDirection={avgPagesPerSession > 3 ? 'up' : avgPagesPerSession > 2 ? 'neutral' : 'down'}
      className={className}
    />
  );
}