import 'server-only';

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
// Contact Request Status
// ============================================================================

export const CONTACT_REQUEST_STATUS = {
  PENDING: 'PENDING',
  FORM_SENT: 'FORM_SENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContactRequestStatus = keyof typeof CONTACT_REQUEST_STATUS;

/**
 * Libellés lisibles pour les statuts de demande de contact
 */
export const CONTACT_REQUEST_STATUS_LABELS: Record<string, string> = {
  [CONTACT_REQUEST_STATUS.PENDING]: 'En attente',
  [CONTACT_REQUEST_STATUS.FORM_SENT]: 'Formulaire envoyé',
  [CONTACT_REQUEST_STATUS.COMPLETED]: 'Complété',
  [CONTACT_REQUEST_STATUS.CANCELLED]: 'Annulé',
};

// ============================================================================
// Appointment Status
// ============================================================================

export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;

// ============================================================================
// Form Field Types
// ============================================================================

export const FIELD_TYPES = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
  DATE: 'DATE',
  NUMBER: 'NUMBER',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

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

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  SESSION_REQUIRED: 'Une session valide est requise',
  UNAUTHORIZED: 'Non autorisé',
  
  // Validation
  FIELD_REQUIRED: (field: string) => `Le champ ${field} est requis`,
  INVALID_EMAIL: 'Veuillez fournir un email valide',
  INVALID_FORMAT: (field: string, format: string) => `Le champ ${field} doit être au format ${format}`,
  
  // File uploads
  NO_FILE_SELECTED: 'Aucun fichier sélectionné',
  FILE_TOO_LARGE: (maxSize: string) => `Fichier trop volumineux (max ${maxSize})`,
  INVALID_FILE_TYPE: (types: string) => `Format non autorisé (${types})`,
  
  // Database
  NOT_FOUND: (entity: string) => `${entity} non trouvé(e)`,
  ALREADY_EXISTS: (entity: string) => `${entity} existe déjà`,
  UNIQUE_CONSTRAINT: (field: string) => `Ce ${field} est déjà utilisé`,
  
  // Generic
  INTERNAL_ERROR: 'Une erreur est survenue. Veuillez réessayer plus tard.',
  INVALID_REQUEST: 'Requête invalide',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  CREATED: (entity: string) => `${entity} créé(e) avec succès`,
  UPDATED: (entity: string) => `${entity} mis(e) à jour avec succès`,
  DELETED: (entity: string) => `${entity} supprimé(e) avec succès`,
  SENT: (entity: string) => `${entity} envoyé(e) avec succès`,
  ASSIGNED: 'Associé avec succès',
  TOGGLED: (status: string) => `${status === 'true' ? 'Activé' : 'Désactivé'} avec succès`,
} as const;
