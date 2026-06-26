'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';

interface FormField {
  id: string;
  label: string;
  key: string;
  type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'EMAIL' | 'SELECT' | 'MULTISELECT' | 'CHECKBOX' | 'DATE';
  placeholder?: string;
  required: boolean;
  options: string[];
  defaultValue?: string;
  order: number;
}

// Types de champs disponibles
const fieldTypes = [
  { value: 'TEXT', label: 'Texte court' },
  { value: 'TEXTAREA', label: 'Texte long' },
  { value: 'NUMBER', label: 'Nombre' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SELECT', label: 'Sélection unique' },
  { value: 'MULTISELECT', label: 'Sélection multiple' },
  { value: 'CHECKBOX', label: 'Case à cocher' },
  { value: 'DATE', label: 'Date' },
];

// Types de formule
const packageTypes = [
  { value: '', label: 'Toutes les offres' },
  { value: 'escapade-en-douceur', label: 'Escapade en douceur' },
  { value: 'voyage-sur-mesure', label: 'Voyage sur-mesure' },
  { value: 'voyage-de-noces', label: 'Voyage de noces' },
];

// Générer un ID unique pour les champs
let fieldIdCounter = 0;
const generateFieldId = (): string => {
  return `field-${Date.now()}-${++fieldIdCounter}`;
};

// Formulaire par défaut
const defaultField: FormField = {
  id: '',
  label: '',
  key: '',
  type: 'TEXT',
  placeholder: '',
  required: false,
  options: [],
  defaultValue: '',
  order: 0,
};

export default function NewFormPage() {
  const router = useRouter();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    packageType: '',
    description: '',
    successMessage: 'Merci pour votre réponse ! Nous vous contacterons rapidement.',
    isActive: true,
  });
  
  // États des champs
  const [fields, setFields] = useState<FormField[]>([defaultField]);
  
  // États d'erreur et de soumission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);

  // Initialiser le compteur
  useEffect(() => {
    fieldIdCounter = 0;
  }, []);

  // Mettre à jour un champ du formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Supprimer l'erreur si elle existe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Mettre à jour un champ du formulaire personnalisé
  const handleFieldChange = (
    fieldId: string,
    property: keyof FormField,
    value: string | string[] | boolean | number
  ) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, [property]: value } : field
      )
    );

    // Supprimer l'erreur de champ si elle existe
    if (fieldErrors[`${fieldId}-${property}`]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${fieldId}-${property}`];
        return newErrors;
      });
    }
  };

  // Ajouter un nouveau champ
  const addField = () => {
    const newField: FormField = {
      ...defaultField,
      id: generateFieldId(),
      order: fields.length,
    };
    setFields(prev => [...prev, newField]);
  };

  // Supprimer un champ
  const removeField = (fieldId: string) => {
    if (fields.length <= 1) {
      setSubmitStatus({
        success: false,
        message: 'Un formulaire doit avoir au moins un champ.'
      });
      return;
    }
    
    setFields(prev => {
      const newFields = prev.filter(field => field.id !== fieldId);
      return newFields.map((field, index) => ({ ...field, order: index }));
    });
  };

  // Ajouter une option à un champ SELECT ou MULTISELECT
  const addOption = (fieldId: string) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, options: [...field.options, `Option ${field.options.length + 1}`] }
          : field
      )
    );
  };

  // Supprimer une option
  const removeOption = (fieldId: string, optionIndex: number) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, options: field.options.filter((_, i) => i !== optionIndex) }
          : field
      )
    );
  };

  // Mettre à jour une option
  const updateOption = (fieldId: string, optionIndex: number, newValue: string) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((opt, i) =>
                i === optionIndex ? newValue : opt
              )
            }
          : field
      )
    );
  };

  // Déplacer un champ vers le haut
  const moveFieldUp = (fieldId: string) => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === fieldId);
      if (index <= 0) return prev;
      
      const newFields = [...prev];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      return newFields.map((field, i) => ({ ...field, order: i }));
    });
  };

  // Déplacer un champ vers le bas
  const moveFieldDown = (fieldId: string) => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === fieldId);
      if (index >= prev.length - 1) return prev;
      
      const newFields = [...prev];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields.map((field, i) => ({ ...field, order: i }));
    });
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newFieldErrors: Record<string, string> = {};

    // Valider les champs du formulaire
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du formulaire est requis';
    }

    if (!formData.successMessage.trim()) {
      newErrors.successMessage = 'Le message de confirmation est requis';
    }

    // Valider les champs du formulaire personnalisé
    fields.forEach((field, index) => {
      if (!field.label.trim()) {
        newFieldErrors[`${field.id}-label`] = `Le libellé du champ ${index + 1} est requis`;
      }
      
      if (!field.key.trim()) {
        newFieldErrors[`${field.id}-key`] = `La clé du champ ${index + 1} est requise`;
      }
      
      // Vérifier que la clé est unique
      const keyCount = fields.filter(f => f.key === field.key.trim()).length;
      if (keyCount > 1 && field.key.trim()) {
        newFieldErrors[`${field.id}-key`] = 'Cette clé est déjà utilisée';
      }

      // Pour les SELECT et MULTISELECT, vérifier qu'il y a des options
      if ((field.type === 'SELECT' || field.type === 'MULTISELECT') && field.options.length === 0) {
        newFieldErrors[`${field.id}-options`] = 'Ajoutez au moins une option';
      }
    });

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    
    return Object.keys(newErrors).length === 0 && Object.keys(newFieldErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        success: false,
        message: 'Veuillez corriger les erreurs dans le formulaire.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Préparer les données à envoyer
      const dataToSend = {
        ...formData,
        fields: fields.map(({ id, ...rest }) => rest), // Supprimer les IDs temporaires
      };

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: 'Formulaire créé avec succès !'
        });
        
        // Rediriger vers la liste des formulaires après 2 secondes
        setTimeout(() => {
          router.push('/dashboard/forms');
        }, 2000);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la création du formulaire.'
        });
      }

    } catch (error: any) {
      console.error('Error creating form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de créer le formulaire. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div className={styles['header-left']}>
          <Link href="/dashboard/forms" className={styles['back-link']}>
            ← Retour aux formulaires
          </Link>
          <h1 className={styles.pageTitle}>Nouveau formulaire</h1>
          <p className={styles.pageSubtitle}>
            Créez un formulaire personnalisé pour vos clients
          </p>
        </div>
      </div>

      {submitStatus && (
        <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
          <p>{submitStatus.message}</p>
          {submitStatus.success && (
            <p className={styles['redirect-message']}>
              Redirection vers la liste des formulaires...
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Informations du formulaire */}
        <div className={styles['form-section']}>
          <h2 className={styles['section-title']}>Informations du formulaire</h2>
          
          <div className={styles['form-grid']}>
            <div className={`${styles['form-group']} ${errors.name ? styles['has-error'] : ''}`}>
              <label htmlFor="name">Nom du formulaire *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ex: Formulaire Voyage de Noces"
              />
              {errors.name && <span className={styles['error-message']}>{errors.name}</span>}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="packageType">Associer à une offre</label>
              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleFormChange}
              >
                {packageTypes.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
              <small>Laisser vide pour toutes les offres</small>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="isActive">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                />
                Formulaire actif
              </label>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="description">Description (optionnelle)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Ex: Ce formulaire nous aidera à mieux comprendre vos attentes pour votre voyage de noces..."
              rows={3}
            />
          </div>

          <div className={`${styles['form-group']} ${errors.successMessage ? styles['has-error'] : ''}`}>
            <label htmlFor="successMessage">Message de confirmation *</label>
            <textarea
              id="successMessage"
              name="successMessage"
              value={formData.successMessage}
              onChange={handleFormChange}
              placeholder="Message affiché après soumission du formulaire"
              rows={3}
            />
            {errors.successMessage && <span className={styles['error-message']}>{errors.successMessage}</span>}
          </div>
        </div>

        {/* Champs du formulaire */}
        <div className={styles['form-section']}>
          <h2 className={styles['section-title']}>
            Champs du formulaire
            <button type="button" onClick={addField} className={styles['add-field-button']}>
              + Ajouter un champ
            </button>
          </h2>

          <div className={styles['fields-container']}>
            {fields.map((field, index) => (
              <div key={field.id} className={styles['field-card']}>
                <div className={styles['field-header']}>
                  <h4 className={styles['field-title']}>
                    Champ {index + 1}
                    {field.required && <span className={styles.required}>*</span>}
                  </h4>
                  <div className={styles['field-actions']}>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveFieldUp(field.id)}
                        className={styles['move-button']}
                        title="Monter"
                      >
                        ↑
                      </button>
                    )}
                    {index < fields.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveFieldDown(field.id)}
                        className={styles['move-button']}
                        title="Descendre"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className={styles['remove-button']}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className={styles['field-grid']}>
                  <div className={`${styles['form-group']} ${fieldErrors[`${field.id}-label`] ? styles['has-error'] : ''}`}>
                    <label htmlFor={`label-${field.id}`}>Libellé *</label>
                    <input
                      type="text"
                      id={`label-${field.id}`}
                      value={field.label}
                      onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                      placeholder="Ex: Quelle est votre date préférée ?"
                    />
                    {fieldErrors[`${field.id}-label`] && (
                      <span className={styles['error-message']}>{fieldErrors[`${field.id}-label`]}</span>
                    )}
                  </div>

                  <div className={`${styles['form-group']} ${fieldErrors[`${field.id}-key`] ? styles['has-error'] : ''}`}>
                    <label htmlFor={`key-${field.id}`}>Clé * (identifiant unique)</label>
                    <input
                      type="text"
                      id={`key-${field.id}`}
                      value={field.key}
                      onChange={(e) => handleFieldChange(field.id, 'key', e.target.value)}
                      placeholder="Ex: preferred-date"
                    />
                    {fieldErrors[`${field.id}-key`] && (
                      <span className={styles['error-message']}>{fieldErrors[`${field.id}-key`]}</span>
                    )}
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor={`type-${field.id}`}>Type de champ *</label>
                    <select
                      id={`type-${field.id}`}
                      value={field.type}
                      onChange={(e) => handleFieldChange(field.id, 'type', e.target.value as FormField['type'])}
                    >
                      {fieldTypes.map((ft) => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor={`required-${field.id}`}>
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                      />
                      Champ obligatoire
                    </label>
                  </div>
                </div>

                {(field.type === 'SELECT' || field.type === 'MULTISELECT') && (
                  <div className={styles['options-section']}>
                    <label>Options</label>
                    {field.options.map((option, optIndex) => (
                      <div key={optIndex} className={styles['option-row']}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(field.id, optIndex)}
                          className={styles['remove-option-button']}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {fieldErrors[`${field.id}-options`] && (
                      <span className={styles['error-message']}>{fieldErrors[`${field.id}-options`]}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => addOption(field.id)}
                      className={styles['add-option-button']}
                    >
                      + Ajouter une option
                    </button>
                  </div>
                )}

                {field.type === 'TEXT' && (
                  <div className={styles['form-group']}>
                    <label htmlFor={`placeholder-${field.id}`}>Placeholder (optionnel)</label>
                    <input
                      type="text"
                      id={`placeholder-${field.id}`}
                      value={field.placeholder || ''}
                      onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                      placeholder="Texte d'aide"
                    />
                  </div>
                )}

                {field.type !== 'CHECKBOX' && field.type !== 'SELECT' && field.type !== 'MULTISELECT' && (
                  <div className={styles['form-group']}>
                    <label htmlFor={`defaultValue-${field.id}`}>Valeur par défaut (optionnelle)</label>
                    <input
                      type="text"
                      id={`defaultValue-${field.id}`}
                      value={field.defaultValue || ''}
                      onChange={(e) => handleFieldChange(field.id, 'defaultValue', e.target.value)}
                      placeholder="Valeur par défaut"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles['form-actions']}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles['submit-button']}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer le formulaire'}
          </button>
          <Link href="/dashboard/forms" className={styles['cancel-button']}>
            Annuler
          </Link>
        </div>
      </form>
    </section>
  );
}
