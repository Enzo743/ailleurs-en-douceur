'use client';

import React from 'react';
import styles from './referrers-table.module.scss';

interface ReferrerData {
  referrer: string;
  pageviews: number;
  uniqueVisitors: number;
}

interface ReferrersTableProps {
  data: ReferrerData[];
  title?: string;
  limit?: number;
  showAll?: boolean;
}

export default function ReferrersTable({
  data,
  title = 'Sources de trafic',
  limit = 10,
  showAll = false,
}: ReferrersTableProps) {
  const displayData = showAll ? data : data.slice(0, limit);

  const formatReferrer = (referrer: string) => {
    if (!referrer || referrer === 'Direct') return 'Direct';
    if (referrer === 'google') return 'Google';
    if (referrer === 'facebook') return 'Facebook';
    if (referrer === 'instagram') return 'Instagram';
    if (referrer === 'bing') return 'Bing';
    if (referrer === 'yahoo') return 'Yahoo';
    
    // Extraire le domaine
    try {
      const url = new URL(referrer);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return referrer;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString('fr-FR');
  };

  const getReferrerIcon = (referrer: string) => {
    const formatted = formatReferrer(referrer);
    const icons: Record<string, string> = {
      'Google': '🔍',
      'Facebook': '📘',
      'Instagram': '📷',
      'Bing': '🔎',
      'Yahoo': '🟣',
      'Direct': '🏠',
    };
    return icons[formatted] || '🌐';
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
              <th className={styles.referrerColumn}>Source de trafic</th>
              <th className={styles.viewsColumn}>Vues</th>
              <th className={styles.visitorsColumn}>Visiteurs</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((referrer, index) => (
              <tr key={`${referrer.referrer}-${index}`} className={styles.tableRow}>
                <td className={styles.rankCell}>{index + 1}</td>
                <td className={styles.referrerCell}>
                  <span className={styles.referrerIcon}>{getReferrerIcon(referrer.referrer)}</span>
                  <span className={styles.referrerName}>{formatReferrer(referrer.referrer)}</span>
                </td>
                <td className={styles.viewsCell}>{formatNumber(referrer.pageviews)}</td>
                <td className={styles.visitorsCell}>{formatNumber(referrer.uniqueVisitors)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}