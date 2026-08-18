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
  RANGE_NUMBER: 'RANGE_NUMBER',
  RANGE_DATE: 'RANGE_DATE',
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
  { value: 'RANGE_NUMBER', label: 'Plage de nombres' },
  { value: 'RANGE_DATE', label: 'Plage de dates' },
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
  [FIELD_TYPES.RANGE_NUMBER]: 'Plage de nombres',
  [FIELD_TYPES.RANGE_DATE]: 'Plage de dates',
} as const;

// ============================================================================
// Default Form Field
// ============================================================================

export interface FormField {
  id: string;
  label: string;
  key?: string; // Généré automatiquement en backend
  type: typeof FIELD_TYPES[keyof typeof FIELD_TYPES];
  placeholder?: string;
  required: boolean;
  allowOtherOption: boolean;
  options: string[];
  defaultValue?: string;
  minValue?: number | string; // Pour RANGE_NUMBER et RANGE_DATE
  maxValue?: number | string; // Pour RANGE_NUMBER et RANGE_DATE
  order: number;
}

export const DEFAULT_FIELD: Omit<FormField, 'id' | 'order'> = {
  label: '',
  key: '',
  type: 'TEXT',
  placeholder: '',
  required: false,
  allowOtherOption: false,
  options: [],
  defaultValue: '',
  minValue: undefined,
  maxValue: undefined,
} as const;

// Générer un ID unique pour les champs
let fieldIdCounter = 0;

export const generateFieldId = (): string => {
  return `field-${Date.now()}-${++fieldIdCounter}`;
};

export const resetFieldIdCounter = (): void => {
  fieldIdCounter = 0;
};
