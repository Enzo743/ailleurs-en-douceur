'use client';

import React from 'react';
import TopPagesTable from './TopPagesTable';

interface LandingPageData {
  page: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage?: number;
  entranceRate?: number;
  exitRate?: number;
  bounceRate?: number;
}

interface LandingPagesTableProps {
  data: LandingPageData[];
  title?: string;
  limit?: number;
  showAll?: boolean;
}

export default function LandingPagesTable({
  data,
  title = 'Pages d\'entrée',
  limit = 10,
  showAll = false,
}: LandingPagesTableProps) {
  return (
    <TopPagesTable
      data={data}
      title={title}
      limit={limit}
      showAll={showAll}
    />
  );
}