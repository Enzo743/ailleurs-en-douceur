'use client';

import React from 'react';
import styles from './top-pages-table.module.scss';

interface PageData {
  page: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage?: number;
  entranceRate?: number;
  exitRate?: number;
  bounceRate?: number;
}

interface TopPagesTableProps {
  data: PageData[];
  title?: string;
  limit?: number;
  showAll?: boolean;
}

export default function TopPagesTable({
  data,
  title = 'Pages les plus consultées',
  limit = 10,
  showAll = false,
}: TopPagesTableProps) {
  const displayData = showAll ? data : data.slice(0, limit);

  const formatPageUrl = (url: string) => {
    if (!url || url === '/') return 'Accueil';
    if (url.startsWith('/blog/')) {
      const parts = url.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return decodeURIComponent(parts[1]) || url;
      }
    }
    return url.replace(/^\//, '').replace(/\/$/, '') || 'Accueil';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString('fr-FR');
  };

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (!value) return '—';
    return `${value.toFixed(1)}%`;
  };

  if (!displayData || displayData.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>{title}</h3>
        </div>
        <div className={styles.emptyState}>
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>{title}</h3>
        {!showAll && data.length > limit && (
          <span className={styles.showAllHint}>Top {limit}</span>
        )}
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={`${styles.table} dashboard-table`}>
          <thead>
            <tr>
              <th className={styles.rankColumn}>#</th>
              <th className={styles.pageColumn}>Page</th>
              <th className={styles.viewsColumn}>Vues</th>
              <th className={styles.visitorsColumn}>Visiteurs</th>
              <th className={styles.timeColumn}>Temps moyen</th>
              <th className={styles.rateColumn}>Taux de rebond</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((page, index) => (
              <tr key={`${page.page}-${index}`} className={styles.tableRow}>
                <td className={styles.rankCell}>{index + 1}</td>
                <td className={styles.pageCell}>
                  <a href={page.page} className={styles.pageLink} target="_blank" rel="noopener noreferrer">
                    {formatPageUrl(page.page)}
                  </a>
                </td>
                <td className={styles.viewsCell}>{formatNumber(page.pageviews)}</td>
                <td className={styles.visitorsCell}>{formatNumber(page.uniqueVisitors)}</td>
                <td className={styles.timeCell}>{formatTime(page.avgTimeOnPage)}</td>
                <td className={styles.rateCell}>{formatPercentage(page.bounceRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}