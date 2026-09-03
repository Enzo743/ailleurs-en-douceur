'use client';

import React from 'react';
import TopPagesTable from './TopPagesTable';

interface BlogArticleData {
  page: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage?: number;
  entranceRate?: number;
  exitRate?: number;
  bounceRate?: number;
}

interface BlogArticlesTableProps {
  data: BlogArticleData[];
  title?: string;
  limit?: number;
  showAll?: boolean;
}

export default function BlogArticlesTable({
  data,
  title = 'Articles de blog les plus lus',
  limit = 10,
  showAll = false,
}: BlogArticlesTableProps) {
  // Formater les URLs pour afficher uniquement le titre
  const formattedData = data.map(article => ({
    ...article,
    page: formatBlogUrl(article.page),
  }));

  return (
    <TopPagesTable
      data={formattedData}
      title={title}
      limit={limit}
      showAll={showAll}
    />
  );
}

function formatBlogUrl(url: string) {
  if (!url || !url.startsWith('/blog/')) {
    return url;
  }
  
  // Extraire le slug de l'article
  const parts = url.split('/').filter(Boolean);
  if (parts.length >= 2) {
    // Remplacer les tirets par des espaces et capitaliser
    const slug = parts[1];
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return url;
}