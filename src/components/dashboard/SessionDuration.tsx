'use client';

import React from 'react';
import AnalyticsCard from './AnalyticsCard';

interface SessionDurationProps {
  avgSessionDuration: number; // en secondes
  className?: string;
}

export default function SessionDuration({
  avgSessionDuration,
  className = '',
}: SessionDurationProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <AnalyticsCard
      title="Durée moyenne des sessions"
      value={formatDuration(avgSessionDuration)}
      subtitle="Temps moyen passé par visiteur"
      icon="⏱️"
      trendDirection={avgSessionDuration > 300 ? 'up' : avgSessionDuration > 120 ? 'neutral' : 'down'}
      className={className}
    />
  );
}