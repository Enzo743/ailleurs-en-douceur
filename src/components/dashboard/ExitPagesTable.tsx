'use client';

import React from 'react';
import TopPagesTable from './TopPagesTable';

interface ExitPageData {
  page: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage?: number;
  entranceRate?: number;
  exitRate?: number;
  bounceRate?: number;
}

interface ExitPagesTableProps {
  data: ExitPageData[];
  title?: string;
  limit?: number;
  showAll?: boolean;
}

export default function ExitPagesTable({
  data,
  title = 'Pages de sortie',
  limit = 10,
  showAll = false,
}: ExitPagesTableProps) {
  return (
    <TopPagesTable
      data={data}
      title={title}
      limit={limit}
      showAll={showAll}
    />
  );
}