'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PACKAGE_TYPE_OPTIONS } from '@/lib/constants';
import { FormField as FormFieldType } from '@/lib/form-constants';
import { useFormFields } from '@/hooks/useFormFields';
import { FormField } from '@/components/dashboard';
import styles from './page.module.scss';

interface FormData {
  name: string;
  packageType: string;
  description: string;
  successMessage: string;
  isActive: boolean;
}

export default function NewFormPage() {
  const router = useRouter();

  // États du formulaire principal
  const [formData, setFormData] = useState<FormData>({
    name: '',
    packageType: '',
    description: '',
    successMessage: 'Merci pour votre réponse ! Nous vous contacterons rapidement.',
    isActive: true,
  });

  // États d'erreur et de soumission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);

  // Utiliser le hook pour gérer les champs
  const {
    fields,
    fieldErrors,
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
  } = useFormFields();

  // Mettre à jour un champ du formulaire principal
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Supprimer l'erreur si elle existe
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Valider le formulaire complet
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Valider les champs du formulaire
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du formulaire est requis';
    }

    if (!formData.successMessage.trim()) {
      newErrors.successMessage = 'Le message de confirmation est requis';
    }

    // Valider les champs personnalisés
    const isFieldsValid = validateFields();

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0 && isFieldsValid;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        success: false,
        message: 'Veuillez corriger les erreurs dans le formulaire.',
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
          message: 'Formulaire créé avec succès !',
        });

        // Rediriger vers la liste des formulaires après 2 secondes
        setTimeout(() => {
          router.push('/dashboard/forms');
        }, 2000);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la création du formulaire.',
        });
      }

    } catch (error: any) {
      console.error('Error creating form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de créer le formulaire. Veuillez vérifier votre connexion.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trouver l'erreur pour un champ spécifique
  const getFieldError = (fieldId: string, property: string): string | undefined => {
    return fieldErrors[`${fieldId}-${property}`];
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
                {PACKAGE_TYPE_OPTIONS.map((pt) => (
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
              <FormField
                key={field.id}
                field={field}
                fieldIndex={index}
                error={getFieldError(field.id, 'label') || getFieldError(field.id, 'key') || getFieldError(field.id, 'options')}
                onChange={(property, value) => handleFieldChange(field.id, property, value)}
                onAddOption={() => addOption(field.id)}
                onRemoveOption={(optIndex) => removeOption(field.id, optIndex)}
                onUpdateOption={(optIndex, newValue) => updateOption(field.id, optIndex, newValue)}
                onMoveUp={() => moveFieldUp(field.id)}
                onMoveDown={() => moveFieldDown(field.id)}
                onRemove={() => removeField(field.id, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < fields.length - 1}
                showActions={true}
              />
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
