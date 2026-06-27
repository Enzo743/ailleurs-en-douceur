'use client';

import { useState, FormEvent, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PACKAGE_TYPE_OPTIONS } from '@/lib/constants';
import { FormField as FormFieldType } from '@/lib/form-constants';
import { useFormFields } from '@/hooks/useFormFields';
import { FormField } from '@/components/dashboard';
import styles from './page.module.scss';

interface CustomForm {
  id: string;
  name: string;
  packageType?: string;
  description?: string;
  successMessage: string;
  isActive: boolean;
  fields: FormFieldType[];
}

interface FormData {
  name: string;
  packageType: string;
  description: string;
  successMessage: string;
  isActive: boolean;
}

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // États
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    packageType: '',
    description: '',
    successMessage: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Utiliser le hook pour gérer les champs
  const {
    fields,
    fieldErrors,
    setFields,
    handleFieldChange,
    addField,
    removeField: removeFieldFromHook,
    addOption,
    removeOption,
    updateOption,
    moveFieldUp,
    moveFieldDown,
    validateFields,
    setFieldErrors,
  } = useFormFields();

  // Charger les données du formulaire
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/forms/${id}`);
        const data = await response.json();

        if (!data.success || !data.data) {
          setNotFound(true);
          return;
        }

        const form: CustomForm = data.data;

        setFormData({
          name: form.name,
          packageType: form.packageType || '',
          description: form.description || '',
          successMessage: form.successMessage,
          isActive: form.isActive,
        });

        // Initialiser les champs avec les données du formulaire
        setFields(form.fields);

      } catch (error) {
        console.error('Error fetching form:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id, setFields]);

  // Mettre à jour un champ du formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Supprimer un champ avec confirmation pour les champs existants
  const removeField = (fieldId: string) => {
    // Ne pas supprimer si c'est le dernier champ
    if (fields.length <= 1) {
      setSubmitStatus({
        success: false,
        message: 'Un formulaire doit avoir au moins un champ.'
      });
      return;
    }

    // Si c'est un champ existant (avec un vrai ID), demander confirmation
    if (!fieldId.startsWith('new-')) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce champ ? Cette action est irréversible.')) {
        return;
      }
    }

    removeFieldFromHook(fieldId, 1);
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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
        message: 'Veuillez corriger les erreurs dans le formulaire.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Séparer les champs existants et nouveaux
      const existingFields = fields.filter((f) => !f.id.startsWith('new-'));
      const newFields = fields.filter((f) => f.id.startsWith('new-'));

      // Préparer les données
      const dataToSend = {
        ...formData,
        fieldsToAdd: newFields.map(({ id, ...rest }) => rest),
        fieldsToUpdate: existingFields.map((field) => field),
      };

      const response = await fetch(`/api/forms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: 'Formulaire mis à jour avec succès !'
        });

        setTimeout(() => {
          router.push('/dashboard/forms');
        }, 2000);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la mise à jour du formulaire.'
        });
      }

    } catch (error: any) {
      console.error('Error updating form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de mettre à jour le formulaire. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trouver l'erreur pour un champ spécifique
  const getFieldError = (fieldId: string, property: string): string | undefined => {
    return fieldErrors[`${fieldId}-${property}`];
  };

  // Si chargement
  if (isLoading) {
    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <Link href="/dashboard/forms" className={styles['back-link']}>
            ← Retour aux formulaires
          </Link>
          <h1 className={styles.pageTitle}>Modification du formulaire</h1>
        </div>
        <div className={styles.loading}>
          <div className={styles['loading-spinner']}></div>
          <p>Chargement du formulaire...</p>
        </div>
      </section>
    );
  }

  // Si non trouvé
  if (notFound) {
    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <Link href="/dashboard/forms" className={styles['back-link']}>
            ← Retour aux formulaires
          </Link>
          <h1 className={styles.pageTitle}>Formulaire non trouvé</h1>
        </div>
        <div className={styles['error-box']}>
          <p>Le formulaire que vous cherchez n'existe pas ou a été supprimé.</p>
          <Link href="/dashboard/forms" className={styles['back-button']}>
            Retour à la liste
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div className={styles['header-left']}>
          <Link href="/dashboard/forms" className={styles['back-link']}>
            ← Retour aux formulaires
          </Link>
          <h1 className={styles.pageTitle}>Modifier le formulaire</h1>
          <p className={styles.pageSubtitle}>
            Modifiez les informations et les champs de votre formulaire
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
              placeholder="Ex: Ce formulaire nous aidera à mieux comprendre vos attentes..."
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
                onRemove={() => removeField(field.id)}
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
            {isSubmitting ? 'Mise à jour en cours...' : 'Mettre à jour le formulaire'}
          </button>
          <Link href="/dashboard/forms" className={styles['cancel-button']}>
            Annuler
          </Link>
        </div>
      </form>
    </section>
  );
}
