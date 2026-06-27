'use client';

import {
  CONTACT_REQUEST_STATUS_LABELS,
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_COLORS,
  CONTACT_REQUEST_STATUS_COLORS,
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS
} from '@/lib/client-constants';

interface StatusBadgeProps {
  status: string;
  type?: 'contact-request' | 'article' | 'appointment' | 'form';
}

export default function StatusBadge({ status, type = 'contact-request' }: StatusBadgeProps) {
  // Récupérer le libellé en fonction du type
  let label: string;
  let statusClass: string;
  
  switch (type) {
    case 'article':
      label = ARTICLE_STATUS_LABELS[status as keyof typeof ARTICLE_STATUS_LABELS] || status;
      statusClass = ARTICLE_STATUS_COLORS[status as keyof typeof ARTICLE_STATUS_COLORS] || status.toLowerCase().replace('_', '-');
      break;
    case 'form':
      label = FORM_STATUS_LABELS[status as keyof typeof FORM_STATUS_LABELS] || status;
      statusClass = FORM_STATUS_COLORS[status as keyof typeof FORM_STATUS_COLORS] || status.toLowerCase().replace('_', '-');
      break;
    case 'appointment':
    case 'contact-request':
    default:
      label = CONTACT_REQUEST_STATUS_LABELS[status as keyof typeof CONTACT_REQUEST_STATUS_LABELS] || status;
      statusClass = CONTACT_REQUEST_STATUS_COLORS[status as keyof typeof CONTACT_REQUEST_STATUS_COLORS] || status.toLowerCase().replace('_', '-');
      break;
  }

  return (
    <span className={`dashboard-status-badge ${statusClass}`}>
      {label}
    </span>
  );
}
