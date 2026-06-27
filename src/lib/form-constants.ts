// Constants for form fields
// These are used in both client and server components

// ============================================================================
// Field Types
// ============================================================================

export const FIELD_TYPES = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  NUMBER: 'NUMBER',
  EMAIL: 'EMAIL',
  SELECT: 'SELECT',
  MULTISELECT: 'MULTISELECT',
  CHECKBOX: 'CHECKBOX',
  DATE: 'DATE',
} as const;

/**
 * Options pour le select des types de champ
 */
export const FIELD_TYPE_OPTIONS = [
  { value: 'TEXT', label: 'Texte court' },
  { value: 'TEXTAREA', label: 'Texte long' },
  { value: 'NUMBER', label: 'Nombre' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SELECT', label: 'Sélection unique' },
  { value: 'MULTISELECT', label: 'Sélection multiple' },
  { value: 'CHECKBOX', label: 'Case à cocher' },
  { value: 'DATE', label: 'Date' },
] as const;

/**
 * Libellés lisibles pour les types de champs
 */
export const FIELD_TYPE_LABELS: Record<string, string> = {
  [FIELD_TYPES.TEXT]: 'Texte court',
  [FIELD_TYPES.TEXTAREA]: 'Texte long',
  [FIELD_TYPES.NUMBER]: 'Nombre',
  [FIELD_TYPES.EMAIL]: 'Email',
  [FIELD_TYPES.SELECT]: 'Sélection unique',
  [FIELD_TYPES.MULTISELECT]: 'Sélection multiple',
  [FIELD_TYPES.CHECKBOX]: 'Case à cocher',
  [FIELD_TYPES.DATE]: 'Date',
} as const;

// ============================================================================
// Default Form Field
// ============================================================================

export interface FormField {
  id: string;
  label: string;
  key: string;
  type: typeof FIELD_TYPES[keyof typeof FIELD_TYPES];
  placeholder?: string;
  required: boolean;
  options: string[];
  defaultValue?: string;
  order: number;
}

export const DEFAULT_FIELD: Omit<FormField, 'id' | 'order'> = {
  label: '',
  key: '',
  type: 'TEXT',
  placeholder: '',
  required: false,
  options: [],
  defaultValue: '',
} as const;

// Générer un ID unique pour les champs
let fieldIdCounter = 0;

export const generateFieldId = (): string => {
  return `field-${Date.now()}-${++fieldIdCounter}`;
};

export const resetFieldIdCounter = (): void => {
  fieldIdCounter = 0;
};
