'use client';

import styles from './stat-card.module.scss';

interface StatCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export default function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={styles['stat-card']}>
      <h3 className={`${styles['stat-value']} ${className || ''}`}>
        {value}
      </h3>
      <p className={styles['stat-label']}>{label}</p>
    </div>
  );
}
