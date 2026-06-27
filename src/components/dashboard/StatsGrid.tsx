'use client';

import StatCard from './StatCard';
import styles from './stats-grid.module.scss';

interface StatItem {
  value: string | number;
  label: string;
  className?: string;
}

interface StatsGridProps {
  items: StatItem[];
}

export default function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className={styles['stats-grid']}>
      {items.map((item, index) => (
        <StatCard
          key={index}
          value={item.value}
          label={item.label}
          className={item.className}
        />
      ))}
    </div>
  );
}
