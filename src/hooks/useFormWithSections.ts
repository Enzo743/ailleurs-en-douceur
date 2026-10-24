'use client';

import { useState, useCallback } from 'react';
import { 
  FormField, 
  FormSection, 
  DEFAULT_FIELD, 
  DEFAULT_SECTION,
} from '@/lib/form-constants';

// Compteurs au niveau du module pour générer des IDs uniques de manière stable
let moduleFieldIdCounter = 0;
let moduleSectionIdCounter = 0;

interface UseFormWithSectionsProps {
  initialFields?: FormField[];
  initialSections?: FormSection[];
}

interface UseFormWithSectionsReturn {
  // Champs
  fields: FormField[];
  fieldErrors: Record<string, string>;
  
  // Sections
  sections: FormSection[];
  sectionErrors: Record<string, string>;
  expandedSections: Set<string>;
  
  // Actions pour les champs
  setFields: (fields: FormField[] | ((prev: FormField[]) => FormField[])) => void;
  addField: (sectionId?: string) => void;
  removeField: (fieldId: string, minFields?: number) => boolean;
  handleFieldChange: (
    fieldId: string,
    property: keyof FormField,
    value: string | string[] | boolean | number
  ) => void;
  addOption: (fieldId: string) => void;
  removeOption: (fieldId: string, optionIndex: number) => void;
  updateOption: (fieldId: string, optionIndex: number, newValue: string) => void;
  moveFieldUp: (fieldId: string) => void;
  moveFieldDown: (fieldId: string) => void;
  assignFieldToSection: (fieldId: string, sectionId: string | null) => void;
  
  // Actions pour les sections
  setSections: (sections: FormSection[] | ((prev: FormSection[]) => FormSection[])) => void;
  addSection: () => void;
  removeSection: (sectionId: string) => boolean;
  handleSectionChange: (
    sectionId: string,
    property: keyof Omit<FormSection, 'id' | 'order' | 'fieldIds'>,
    value: string
  ) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  toggleSectionExpand: (sectionId: string) => void;
  
  // Validation
  validateFields: () => boolean;
  validateSections: () => boolean;
  validateAll: () => boolean;
  setFieldErrors: (errors: Record<string, string>) => void;
  setSectionErrors: (errors: Record<string, string>) => void;
  
  // Getters
  getFieldsForSection: (sectionId: string) => FormField[];
  getUnassignedFields: () => FormField[];
  getSectionById: (sectionId: string) => FormSection | undefined;
}

export function useFormWithSections({
  initialFields = [],
  initialSections = [],
}: UseFormWithSectionsProps = {}): UseFormWithSectionsReturn {
  // Compteurs au niveau du module pour générer des IDs uniques
  // (hors du rendu React, cf. clôtures du compilateur)
  const generateLocalFieldId = useCallback(() => {
    return `field-${++moduleFieldIdCounter}`;
  }, []);

  const generateLocalSectionId = useCallback(() => {
    return `section-${++moduleSectionIdCounter}`;
  }, []);

  // État initial des sections : sections fournies, sinon une section par défaut
  // regroupant les champs initiaux s'il y en a
  const initialSectionsState = (): FormSection[] => {
    if (initialSections.length > 0) {
      return initialSections;
    }
    if (initialFields.length > 0) {
      // Si on a des champs initiaux mais pas de sections, créer une section par défaut
      return [{
        ...DEFAULT_SECTION,
        id: generateLocalSectionId(),
        order: 0,
        fieldIds: initialFields.map(f => f.id),
      }];
    }
    return [{
      ...DEFAULT_SECTION,
      id: generateLocalSectionId(),
      order: 0,
      fieldIds: [],
    }];
  };

  // États pour les champs
  const [fields, setFields] = useState<FormField[]>(() => {
    if (initialFields.length > 0) {
      return initialFields;
    }
    return [{
      ...DEFAULT_FIELD,
      id: generateLocalFieldId(),
      order: 0,
    }];
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // États pour les sections
  const [sections, setSections] = useState<FormSection[]>(initialSectionsState);

  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  
  // Sections expandées
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // ============================================================================
  // Actions pour les champs
  // ============================================================================

  const addField = useCallback((sectionId?: string) => {
    const newField: FormField = {
      ...DEFAULT_FIELD,
      id: generateLocalFieldId(),
      order: fields.length,
      sectionId: sectionId || undefined,
    };
    setFields((prev) => [...prev, newField]);
    
    // Si une section est spécifiée, ajouter le champ à cette section
    if (sectionId) {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, fieldIds: [...section.fieldIds, newField.id] }
            : section
        )
      );
    }
  }, [fields.length, generateLocalFieldId]);

  const removeField = useCallback(
    (fieldId: string, minFields: number = 1) => {
      if (fields.length <= minFields) {
        return false;
      }

      // Retirer le champ de toutes les sections
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          fieldIds: section.fieldIds.filter(id => id !== fieldId),
        }))
      );

      setFields((prev) => {
        const newFields = prev.filter((field) => field.id !== fieldId);
        return newFields.map((field, index) => ({ ...field, order: index }));
      });
      return true;
    },
    [fields.length]
  );

  const handleFieldChange = useCallback(
    (
      fieldId: string,
      property: keyof FormField,
      value: string | string[] | boolean | number
    ) => {
      setFields((prev) =>
        prev.map((field) =>
          field.id === fieldId ? { ...field, [property]: value } : field
        )
      );

      // Supprimer l'erreur de champ si elle existe
      if (fieldErrors[`${fieldId}-${property}`]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`${fieldId}-${property}`];
          return newErrors;
        });
      }
    },
    [fieldErrors]
  );

  const addOption = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, options: [...field.options, `Option ${field.options.length + 1}`] }
          : field
      )
    );
  }, []);

  const removeOption = useCallback((fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, options: field.options.filter((_, i) => i !== optionIndex) }
          : field
      )
    );
  }, []);

  const updateOption = useCallback(
    (fieldId: string, optionIndex: number, newValue: string) => {
      setFields((prev) =>
        prev.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options: field.options.map((opt, i) =>
                  i === optionIndex ? newValue : opt
                ),
              }
            : field
        )
      );
    },
    []
  );

  const moveFieldUp = useCallback((fieldId: string) => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      if (index <= 0) return prev;

      const newFields = [...prev];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      return newFields.map((field, i) => ({ ...field, order: i }));
    });
  }, []);

  const moveFieldDown = useCallback((fieldId: string) => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      if (index >= prev.length - 1) return prev;

      const newFields = [...prev];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields.map((field, i) => ({ ...field, order: i }));
    });
  }, []);

  const assignFieldToSection = useCallback((fieldId: string, sectionId: string | null) => {
    // Mettre à jour le champ
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, sectionId: sectionId ?? undefined } : field
      )
    );

    // Mettre à jour les sections
    setSections((prev) => {
      // Retirer le champ de toutes les sections
      const updatedSections = prev.map(section => ({
        ...section,
        fieldIds: section.fieldIds.filter(id => id !== fieldId),
      }));

      // Si sectionId est null, ne pas assigner à une section
      if (sectionId === null) {
        return updatedSections;
      }

      // Ajouter le champ à la section spécifiée
      return updatedSections.map(section =>
        section.id === sectionId
          ? { ...section, fieldIds: [...section.fieldIds, fieldId] }
          : section
      );
    });
  }, []);

  // ============================================================================
  // Actions pour les sections
  // ============================================================================

  const addSection = useCallback(() => {
    const newSection: FormSection = {
      ...DEFAULT_SECTION,
      id: generateLocalSectionId(),
      order: sections.length,
      fieldIds: [],
    };
    setSections((prev) => [...prev, newSection]);
    setExpandedSections((prev) => new Set(prev).add(newSection.id));
  }, [sections.length, generateLocalSectionId]);

  const removeSection = useCallback(
    (sectionId: string): boolean => {
      if (sections.length <= 1) {
        return false;
      }

      // Retirer la section
      setSections((prev) => {
        const newSections = prev.filter((section) => section.id !== sectionId);
        
        // Réassigner les champs de la section supprimée à la première section
        const deletedSection = prev.find(s => s.id === sectionId);
        if (deletedSection && newSections.length > 0) {
          newSections[0].fieldIds = [...newSections[0].fieldIds, ...deletedSection.fieldIds];
        }
        
        // Mettre à jour l'ordre
        return newSections.map((section, index) => ({ ...section, order: index }));
      });

      // Retirer les références aux sections des champs
      setFields((prev) =>
        prev.map((field) =>
          field.sectionId === sectionId ? { ...field, sectionId: undefined } : field
        )
      );

      // Retirer de l'ensemble des sections expandées
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });

      return true;
    },
    [sections.length]
  );

  const handleSectionChange = useCallback(
    (
      sectionId: string,
      property: keyof Omit<FormSection, 'id' | 'order' | 'fieldIds'>,
      value: string
    ) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, [property]: value } : section
        )
      );

      // Supprimer l'erreur de section si elle existe
      if (sectionErrors[`${sectionId}-${property}`]) {
        setSectionErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`${sectionId}-${property}`];
          return newErrors;
        });
      }
    },
    [sectionErrors]
  );

  const moveSectionUp = useCallback((sectionId: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index <= 0) return prev;

      const newSections = [...prev];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      return newSections.map((section, i) => ({ ...section, order: i }));
    });
  }, []);

  const moveSectionDown = useCallback((sectionId: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index >= prev.length - 1) return prev;

      const newSections = [...prev];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      return newSections.map((section, i) => ({ ...section, order: i }));
    });
  }, []);

  const toggleSectionExpand = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateFields = useCallback((): boolean => {
    const newFieldErrors: Record<string, string> = {};

    fields.forEach((field, index) => {
      if (!field.label.trim()) {
        newFieldErrors[`${field.id}-label`] = `Le libellé du champ ${index + 1} est requis`;
      }

      // Pour les SELECT et MULTISELECT, vérifier qu'il y a des options
      if ((field.type === 'SELECT' || field.type === 'MULTISELECT') && field.options.length === 0) {
        newFieldErrors[`${field.id}-options`] = 'Ajoutez au moins une option';
      }
    });

    setFieldErrors(newFieldErrors);

    return Object.keys(newFieldErrors).length === 0;
  }, [fields]);

  const validateSections = useCallback((): boolean => {
    const newSectionErrors: Record<string, string> = {};

    sections.forEach((section, index) => {
      if (!section.name.trim()) {
        newSectionErrors[`${section.id}-name`] = `Le nom de la section ${index + 1} est requis`;
      }
    });

    setSectionErrors(newSectionErrors);

    return Object.keys(newSectionErrors).length === 0;
  }, [sections]);

  const validateAll = useCallback((): boolean => {
    const isFieldsValid = validateFields();
    const isSectionsValid = validateSections();
    return isFieldsValid && isSectionsValid;
  }, [validateFields, validateSections]);

  // ============================================================================
  // Getters
  // ============================================================================

  const getFieldsForSection = useCallback(
    (sectionId: string): FormField[] => {
      return fields.filter(field => field.sectionId === sectionId);
    },
    [fields]
  );

  const getUnassignedFields = useCallback(
    (): FormField[] => {
      return fields.filter(field => !field.sectionId);
    },
    [fields]
  );

  const getSectionById = useCallback(
    (sectionId: string): FormSection | undefined => {
      return sections.find(s => s.id === sectionId);
    },
    [sections]
  );

  return {
    // Champs
    fields,
    fieldErrors,
    
    // Sections
    sections,
    sectionErrors,
    expandedSections,
    
    // Actions pour les champs
    setFields,
    addField,
    removeField,
    handleFieldChange,
    addOption,
    removeOption,
    updateOption,
    moveFieldUp,
    moveFieldDown,
    assignFieldToSection,
    
    // Actions pour les sections
    setSections,
    addSection,
    removeSection,
    handleSectionChange,
    moveSectionUp,
    moveSectionDown,
    toggleSectionExpand,
    
    // Validation
    validateFields,
    validateSections,
    validateAll,
    setFieldErrors,
    setSectionErrors,
    
    // Getters
    getFieldsForSection,
    getUnassignedFields,
    getSectionById,
  };
}

