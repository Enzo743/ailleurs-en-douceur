'use client';

import React from 'react';
import AnalyticsChart from './AnalyticsChart';

interface VisitData {
  date: string;
  value: number;
}

interface VisitsChartProps {
  pageviews: VisitData[];
  uniqueVisitors: VisitData[];
  sessions: VisitData[];
  title?: string;
  height?: number;
  days?: number;
}

export default function VisitsChart({
  pageviews,
  uniqueVisitors,
  sessions,
  title = 'Évolution des visites',
  height = 350,
  days = 30,
}: VisitsChartProps) {
  // Formater les dates pour l'axe X
  const labels = pageviews.map(data => {
    const date = new Date(data.date);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  });

  // Formater les données pour Chart.js
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Vues',
        data: pageviews.map(data => data.value),
        backgroundColor: 'rgba(74, 63, 47, 0.2)',
        borderColor: '#4a3f2f',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Visiteurs uniques',
        data: uniqueVisitors.map(data => data.value),
        backgroundColor: 'rgba(212, 163, 115, 0.2)',
        borderColor: '#d4a373',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Sessions',
        data: sessions.map(data => data.value),
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4caf50',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value.toLocaleString('fr-FR')}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value.toLocaleString('fr-FR');
          },
        },
      },
    },
  };

  return (
    <AnalyticsChart
      type="line"
      data={chartData}
      title={title}
      height={height}
      options={options}
    />
  );
}