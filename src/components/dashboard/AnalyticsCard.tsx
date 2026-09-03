'use client';

import React from 'react';
import styles from './analytics-card.module.scss';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection = 'neutral',
  className = '',
}: AnalyticsCardProps) {
  return (
    <div className={`${styles.analyticsCard} ${className}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          {icon && <span className={styles.cardIcon}>{icon}</span>}
          <span>{title}</span>
        </div>
        {trend !== undefined && (
          <div className={`${styles.cardTrend} ${styles[trendDirection]}`}>
            {trendDirection === 'up' && '↑'}
            {trendDirection === 'down' && '↓'}
            {trendDirection === 'neutral' && '→'}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className={styles.cardValue}>{value}</div>
      
      {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
    </div>
  );
}