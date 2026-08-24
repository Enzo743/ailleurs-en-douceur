'use client';

import { useState, useCallback } from 'react';
import { FormSection, FormField, DEFAULT_SECTION, generateSectionId, resetSectionIdCounter } from '@/lib/form-constants';

interface UseFormSectionsProps {
  initialSections?: FormSection[];
  initialFields?: FormField[];
}

interface UseFormSectionsReturn {
  sections: FormSection[];
  sectionErrors: Record<string, string>;
  setSections: (sections: FormSection[]) => void;
  addSection: () => void;
  removeSection: (sectionId: string) => boolean;
  handleSectionChange: (
    sectionId: string,
    property: keyof Omit<FormSection, 'id' | 'order' | 'fieldIds'>,
    value: string
  ) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  assignFieldToSection: (fieldId: string, sectionId: string | null) => void;
  getFieldsForSection: (sectionId: string) => FormField[];
  validateSections: () => boolean;
  setSectionErrors: (errors: Record<string, string>) => void;
}

export function useFormSections({
  initialSections = [],
  initialFields = [],
}: UseFormSectionsProps = {}): UseFormSectionsReturn {
  // Initialiser avec au moins une section
  const [sections, setSections] = useState<FormSection[]>(() => {
    if (initialSections.length > 0) {
      return initialSections;
    }
    return [{
      ...DEFAULT_SECTION,
      id: generateSectionId(),
      order: 0,
      fieldIds: initialFields.map(f => f.id),
    }];
  });

  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});

  // Réinitialiser le compteur lors du montage
  useCallback(() => {
    resetSectionIdCounter();
  }, []);

  // Ajouter une nouvelle section
  const addSection = useCallback(() => {
    const newSection: FormSection = {
      ...DEFAULT_SECTION,
      id: generateSectionId(),
      order: sections.length,
      fieldIds: [],
    };
    setSections((prev) => [...prev, newSection]);
  }, [sections.length]);

  // Supprimer une section
  const removeSection = useCallback(
    (sectionId: string): boolean => {
      if (sections.length <= 1) {
        return false;
      }

      setSections((prev) => {
        const newSections = prev.filter((section) => section.id !== sectionId);
        // Réassigner les champs de la section supprimée à la première section
        const deletedSection = prev.find(s => s.id === sectionId);
        if (deletedSection && newSections.length > 0) {
          newSections[0].fieldIds = [...newSections[0].fieldIds, ...deletedSection.fieldIds];
        }
        return newSections.map((section, index) => ({ ...section, order: index }));
      });
      return true;
    },
    [sections.length]
  );

  // Mettre à jour une propriété d'une section
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

  // Déplacer une section vers le haut
  const moveSectionUp = useCallback((sectionId: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index <= 0) return prev;

      const newSections = [...prev];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      return newSections.map((section, i) => ({ ...section, order: i }));
    });
  }, []);

  // Déplacer une section vers le bas
  const moveSectionDown = useCallback((sectionId: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index >= prev.length - 1) return prev;

      const newSections = [...prev];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      return newSections.map((section, i) => ({ ...section, order: i }));
    });
  }, []);

  // Assigner un champ à une section
  const assignFieldToSection = useCallback((fieldId: string, sectionId: string | null) => {
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

  // Récupérer les champs pour une section
  const getFieldsForSection = useCallback(
    (sectionId: string): FormField[] => {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return [];
      return initialFields.filter(field => section.fieldIds.includes(field.id));
    },
    [sections, initialFields]
  );

  // Valider les sections
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

  return {
    sections,
    sectionErrors,
    setSections,
    addSection,
    removeSection,
    handleSectionChange,
    moveSectionUp,
    moveSectionDown,
    assignFieldToSection,
    getFieldsForSection,
    validateSections,
    setSectionErrors,
  };
}

export default useFormSections;
