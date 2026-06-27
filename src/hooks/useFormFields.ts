'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormField, DEFAULT_FIELD, generateFieldId, resetFieldIdCounter } from '@/lib/form-constants';

interface UseFormFieldsProps {
  initialFields?: FormField[];
}

interface UseFormFieldsReturn {
  fields: FormField[];
  fieldErrors: Record<string, string>;
  setFields: (fields: FormField[]) => void;
  addField: () => void;
  removeField: (fieldId: string, minFields?: number) => void;
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
  validateFields: () => boolean;
  setFieldErrors: (errors: Record<string, string>) => void;
}

export function useFormFields({ initialFields = [] }: UseFormFieldsProps = {}): UseFormFieldsReturn {
  // Initialiser avec au moins un champ
  const [fields, setFields] = useState<FormField[]>(() => {
    if (initialFields.length > 0) {
      return initialFields;
    }
    return [{
      ...DEFAULT_FIELD,
      id: generateFieldId(),
      order: 0,
    }];
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Réinitialiser le compteur lors du montage
  useEffect(() => {
    resetFieldIdCounter();
  }, []);

  // Ajouter un nouveau champ
  const addField = useCallback(() => {
    const newField: FormField = {
      ...DEFAULT_FIELD,
      id: generateFieldId(),
      order: fields.length,
    };
    setFields((prev) => [...prev, newField]);
  }, [fields.length]);

  // Supprimer un champ
  const removeField = useCallback(
    (fieldId: string, minFields: number = 1) => {
      if (fields.length <= minFields) {
        return false;
      }

      setFields((prev) => {
        const newFields = prev.filter((field) => field.id !== fieldId);
        return newFields.map((field, index) => ({ ...field, order: index }));
      });
      return true;
    },
    [fields.length]
  );

  // Mettre à jour une propriété d'un champ
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

  // Ajouter une option à un champ SELECT ou MULTISELECT
  const addOption = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, options: [...field.options, `Option ${field.options.length + 1}`] }
          : field
      )
    );
  }, []);

  // Supprimer une option
  const removeOption = useCallback((fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, options: field.options.filter((_, i) => i !== optionIndex) }
          : field
      )
    );
  }, []);

  // Mettre à jour une option
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

  // Déplacer un champ vers le haut
  const moveFieldUp = useCallback((fieldId: string) => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      if (index <= 0) return prev;

      const newFields = [...prev];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      return newFields.map((field, i) => ({ ...field, order: i }));
    });
  }, []);

  // Déplacer un champ vers le bas
  const moveFieldDown = useCallback((fieldId: string) => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      if (index >= prev.length - 1) return prev;

      const newFields = [...prev];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields.map((field, i) => ({ ...field, order: i }));
    });
  }, []);

  // Valider les champs
  const validateFields = useCallback((): boolean => {
    const newFieldErrors: Record<string, string> = {};

    fields.forEach((field, index) => {
      if (!field.label.trim()) {
        newFieldErrors[`${field.id}-label`] = `Le libellé du champ ${index + 1} est requis`;
      }

      if (!field.key.trim()) {
        newFieldErrors[`${field.id}-key`] = `La clé du champ ${index + 1} est requise`;
      }

      // Vérifier que la clé est unique
      if (field.key.trim()) {
        const keyCount = fields.filter((f) => f.key === field.key.trim() && f.id !== field.id).length;
        if (keyCount > 0) {
          newFieldErrors[`${field.id}-key`] = 'Cette clé est déjà utilisée';
        }
      }

      // Pour les SELECT et MULTISELECT, vérifier qu'il y a des options
      if ((field.type === 'SELECT' || field.type === 'MULTISELECT') && field.options.length === 0) {
        newFieldErrors[`${field.id}-options`] = 'Ajoutez au moins une option';
      }
    });

    setFieldErrors(newFieldErrors);

    return Object.keys(newFieldErrors).length === 0;
  }, [fields]);

  return {
    fields,
    fieldErrors,
    setFields,
    addField,
    removeField,
    handleFieldChange,
    addOption,
    removeOption,
    updateOption,
    moveFieldUp,
    moveFieldDown,
    validateFields,
    setFieldErrors,
  };
}

export default useFormFields;
