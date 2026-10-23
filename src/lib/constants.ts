// import 'server-only';

// ============================================================================
// Package Types
// ============================================================================

/**
 * Types de packages disponibles
 */
export const PACKAGE_TYPES = {
  ESCAPADE_EN_DOUCUR: 'escapade-en-douceur',
  VOYAGE_SUR_MESURE: 'voyage-sur-mesure',
  VOYAGE_DE_NOCES: 'voyage-de-noces',
} as const;

/**
 * Libellés lisibles pour les types de packages
 */
export const PACKAGE_LABELS: Record<string, string> = {
  [PACKAGE_TYPES.ESCAPADE_EN_DOUCUR]: 'Escapade en douceur',
  [PACKAGE_TYPES.VOYAGE_SUR_MESURE]: 'Voyage sur-mesure',
  [PACKAGE_TYPES.VOYAGE_DE_NOCES]: 'Voyage de noces',
};

/**
 * Récupère le libellé lisible pour un type de package
 */
export function getPackageLabel(value: string): string {
  return PACKAGE_LABELS[value] || value;
}

// ============================================================================
// Package Types Options
// ============================================================================

/**
 * Options pour le select des types de package
 */
export const PACKAGE_TYPE_OPTIONS = [
  { value: 'escapade-en-douceur', label: 'Escapade en douceur' },
  { value: 'voyage-sur-mesure', label: 'Voyage sur-mesure' },
  { value: 'voyage-de-noces', label: 'Voyage de noces' },
] as const;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_VALUES = {
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  
  // File uploads
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 Mo
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  
  // Timeouts
  DEFAULT_TIMEOUT: 5000, // 5 secondes
  
  // Dates
  DEFAULT_TIMEZONE: 'Europe/Paris',
} as const;


