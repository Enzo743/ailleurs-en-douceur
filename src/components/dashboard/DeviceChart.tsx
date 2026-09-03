'use client';

import React from 'react';
import AnalyticsChart from './AnalyticsChart';

interface DeviceData {
  device: string;
  pageviews: number;
  uniqueVisitors: number;
}

interface DeviceChartProps {
  data: DeviceData[];
  title?: string;
  height?: number;
}

export default function DeviceChart({
  data,
  title = 'Appareils utilisés',
  height = 300,
}: DeviceChartProps) {
  // Formater les données pour Chart.js
  const chartData = {
    labels: data.map(device => formatDeviceName(device.device)),
    datasets: [
      {
        label: 'Vues',
        data: data.map(device => device.pageviews),
        backgroundColor: [
          '#4a3f2f', // Desktop
          '#d4a373', // Mobile
          '#4caf50', // Tablet
          '#2196f3', // Other
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <AnalyticsChart
      type="pie"
      data={chartData}
      title={title}
      height={height}
      options={options}
    />
  );
}

function formatDeviceName(device: string) {
  const deviceMap: Record<string, string> = {
    'Desktop': 'Ordinateur',
    'Mobile': 'Mobile',
    'Tablet': 'Tablette',
    'Other': 'Autre',
  };
  return deviceMap[device] || device;
}