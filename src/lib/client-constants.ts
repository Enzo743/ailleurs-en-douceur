// Constants used in client components
// These constants are safe to be imported in client components

// ============================================================================
// Contact Request Status
// ============================================================================

export const CONTACT_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  FORM_SENT: 'Formulaire envoyé',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
} as const;

export const CONTACT_REQUEST_STATUS_COLORS: Record<string, string> = {
  PENDING: 'pending',
  FORM_SENT: 'form-sent',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ============================================================================
// Article Status
// ============================================================================

export const ARTICLE_STATUS_LABELS: Record<string, string> = {
  published: 'Publié',
  draft: 'Brouillon',
} as const;

export const ARTICLE_STATUS_COLORS: Record<string, string> = {
  published: 'published',
  draft: 'draft',
} as const;

// ============================================================================
// Form Status
// ============================================================================

export const FORM_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
} as const;

export const FORM_STATUS_COLORS: Record<string, string> = {
  active: 'active',
  inactive: 'inactive',
} as const;