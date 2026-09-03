'use client';

import React from 'react';
import AnalyticsCard from './AnalyticsCard';

interface BounceRateProps {
  bounceRate: number;
  className?: string;
}

export default function BounceRate({
  bounceRate,
  className = '',
}: BounceRateProps) {
  return (
    <AnalyticsCard
      title="Taux de rebond"
      value={`${bounceRate}%`}
      subtitle="Pourcentage de visiteurs qui quittent après une seule page"
      icon="📉"
      trendDirection={bounceRate < 50 ? 'up' : bounceRate > 70 ? 'down' : 'neutral'}
      className={className}
    />
  );
}