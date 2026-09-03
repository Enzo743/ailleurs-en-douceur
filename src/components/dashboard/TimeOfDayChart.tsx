'use client';

import React from 'react';
import AnalyticsChart from './AnalyticsChart';

interface TimeOfDayData {
  hour: number;
  pageviews: number;
  uniqueVisitors: number;
}

interface TimeOfDayChartProps {
  data: TimeOfDayData[];
  title?: string;
  height?: number;
}

export default function TimeOfDayChart({
  data,
  title = 'Heures de pointe',
  height = 300,
}: TimeOfDayChartProps) {
  // Trier par heure
  const sortedData = [...data].sort((a, b) => a.hour - b.hour);

  // Formater les labels (heures)
  const labels = sortedData.map(item => `${item.hour}h`);

  // Formater les données pour Chart.js
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Vues',
        data: sortedData.map(item => item.pageviews),
        backgroundColor: 'rgba(74, 63, 47, 0.8)',
        borderColor: '#4a3f2f',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
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
      type="bar"
      data={chartData}
      title={title}
      height={height}
      options={options}
    />
  );
}