'use client';

import React from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement } from 'chart.js';
import styles from './analytics-chart.module.scss';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

interface AnalyticsChartProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: ChartData;
  title?: string;
  height?: number;
  options?: any;
  className?: string;
}

export default function AnalyticsChart({
  type,
  data,
  title,
  height = 300,
  options = {},
  className = '',
}: AnalyticsChartProps) {
  // Options par défaut
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: number) => {
            // Formater les grands nombres
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          },
        },
      },
    },
  };

  // Couleurs par défaut
  const defaultColors = {
    primary: '#4a3f2f',
    secondary: '#d4a373',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#c62828',
    info: '#2196f3',
  };

  // Appliquer les couleurs par défaut si non spécifiées
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || defaultColors.primary,
      borderColor: dataset.borderColor || defaultColors.primary,
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  // Options spécifiques selon le type de graphique
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: '600',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
  };

  // Rendu selon le type de graphique
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} height={height} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} height={height} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} height={height} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} height={height} />;
      default:
        return <Bar data={chartData} options={chartOptions} height={height} />;
    }
  };

  return (
    <div className={`${styles.analyticsChart} ${className}`}>
      <div className={styles.chartContainer}>
        {renderChart()}
      </div>
    </div>
  );
}