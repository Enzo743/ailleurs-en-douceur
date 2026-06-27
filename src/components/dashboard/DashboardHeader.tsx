'use client';

import Link from 'next/link';
import styles from './dashboard-header.module.scss';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
  } & ({ href: string } | { onClick: () => void });
}

export default function DashboardHeader({ title, subtitle, actionButton }: DashboardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles['header-left']}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actionButton && (
        <div className={styles['header-right']}>
          {'href' in actionButton ? (
            <Link href={actionButton.href} className={styles['create-button']}>
              {actionButton.label}
            </Link>
          ) : (
            <button onClick={actionButton.onClick} className={styles['create-button']}>
              {actionButton.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
