'use client';

import React from 'react';
import AnalyticsCard from './AnalyticsCard';
import styles from './conversion-rate.module.scss';

interface ConversionRateProps {
  conversionRate: number;
  totalUniqueVisitors: number;
  formSubmissions: number;
  className?: string;
}

export default function ConversionRate({
  conversionRate,
  totalUniqueVisitors,
  formSubmissions,
  className = '',
}: ConversionRateProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString('fr-FR');
  };

  return (
    <div className={`${styles.conversionRate} ${className}`}>
      <AnalyticsCard
        title="Taux de conversion"
        value={`${conversionRate}%`}
        subtitle={`${formatNumber(formSubmissions)} soumissions / ${formatNumber(totalUniqueVisitors)} visiteurs`}
        icon="📈"
        trendDirection={conversionRate > 0 ? 'up' : 'neutral'}
      />
      
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Soumissions:</span>
          <span className={styles.detailValue}>{formatNumber(formSubmissions)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Visiteurs uniques:</span>
          <span className={styles.detailValue}>{formatNumber(totalUniqueVisitors)}</span>
        </div>
      </div>
    </div>
  );
}