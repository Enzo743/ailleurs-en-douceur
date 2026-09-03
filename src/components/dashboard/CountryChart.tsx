'use client';

import React from 'react';
import AnalyticsChart from './AnalyticsChart';

interface CountryData {
  country: string;
  pageviews: number;
  uniqueVisitors: number;
}

interface CountryChartProps {
  data: CountryData[];
  title?: string;
  height?: number;
  limit?: number;
}

export default function CountryChart({
  data,
  title = 'Localisation géographique',
  height = 300,
  limit = 10,
}: CountryChartProps) {
  // Trier par vues et limiter
  const sortedData = [...data]
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);

  // Formater les noms de pays
  const labels = sortedData.map(country => formatCountryName(country.country));
  
  // Formater les données pour Chart.js
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Vues',
        data: sortedData.map(country => country.pageviews),
        backgroundColor: [
          '#4a3f2f', '#d4a373', '#4caf50', '#2196f3', '#ff9800',
          '#c62828', '#9c27b0', '#607d8b', '#795548', '#e91e63',
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

function formatCountryName(country: string) {
  if (!country) return 'Inconnu';
  
  const countryMap: Record<string, string> = {
    'FR': 'France',
    'BE': 'Belgique',
    'CH': 'Suisse',
    'CA': 'Canada',
    'US': 'États-Unis',
    'GB': 'Royaume-Uni',
    'DE': 'Allemagne',
    'ES': 'Espagne',
    'IT': 'Italie',
    'NL': 'Pays-Bas',
    'Unknown': 'Inconnu',
  };
  
  return countryMap[country] || country;
}