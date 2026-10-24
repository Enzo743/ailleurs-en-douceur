// Constants for form fields
// These are used in both client and server components

// ============================================================================
// Field Types
// ============================================================================

const FIELD_TYPES = {
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
  sectionId?: string; // ID de la section à laquelle ce champ appartient
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

// ============================================================================
// Form Sections
// ============================================================================

export interface FormSection {
  id: string;
  name: string;
  description?: string;
  order: number;
  fieldIds: string[]; // IDs des champs appartenant à cette section
}

export const DEFAULT_SECTION: Omit<FormSection, 'id' | 'order' | 'fieldIds'> = {
  name: 'Nouvelle section',
  description: '',
} as const;
