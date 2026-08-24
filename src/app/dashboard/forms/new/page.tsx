'use client';

import { useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PACKAGE_TYPE_OPTIONS } from '@/lib/constants';
import { FormField as FormFieldType, FormSection, CONTACT_PREFERENCE_KEY, CONTACT_PREFERENCE_FIELD } from '@/lib/form-constants';
import { useFormWithSections } from '@/hooks/useFormWithSections';
import { FormField, FormSection as FormSectionComponent } from '@/components/dashboard';
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
  const [showSections, setShowSections] = useState(false);

  // Utiliser le hook pour gérer les champs et sections
  const {
    fields,
    fieldErrors,
    sections,
    sectionErrors,
    expandedSections,
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
    setSections,
    addSection,
    removeSection,
    handleSectionChange,
    moveSectionUp,
    moveSectionDown,
    toggleSectionExpand,
    validateFields,
    validateSections,
    validateAll,
    setFieldErrors,
    setSectionErrors,
    getFieldsForSection,
    getUnassignedFields,
    getSectionById,
  } = useFormWithSections();

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
    
    // Valider les sections si on les utilise
    const isSectionsValid = showSections ? validateSections() : true;

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0 && isFieldsValid && isSectionsValid;
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
      const dataToSend: any = {
        ...formData,
        fields: fields.map(({ id, ...rest }) => rest), // Supprimer les IDs temporaires
      };

      // Ajouter les sections si on les utilise
      if (showSections && sections.length > 0) {
        dataToSend.sections = sections.map(section => ({
          id: section.id,
          name: section.name,
          description: section.description,
          order: section.order,
        }));
        
        // Ajouter sectionId aux champs
        dataToSend.fields = dataToSend.fields.map((field: any) => ({
          ...field,
          sectionId: field.sectionId,
        }));
      }

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

  // Trouver l'erreur pour une section spécifique
  const getSectionError = (sectionId: string, property: string): string | undefined => {
    return sectionErrors[`${sectionId}-${property}`];
  };

  // Rendre un champ
  const renderField = useCallback((field: FormFieldType, sectionId?: string) => {
    const fieldIndex = fields.findIndex(f => f.id === field.id);
    const section = sectionId ? getSectionById(sectionId) : undefined;
    const sectionFields = section ? getFieldsForSection(sectionId) : [];
    const fieldPositionInSection = sectionFields.findIndex(f => f.id === field.id);

    return (
      <FormField
        key={field.id}
        field={field}
        fieldIndex={fieldIndex + 1}
        error={getFieldError(field.id, 'label')}
        onChange={(property, value) => handleFieldChange(field.id, property as keyof FormFieldType, value)}
        onAddOption={() => addOption(field.id)}
        onRemoveOption={(index) => removeOption(field.id, index)}
        onUpdateOption={(index, value) => updateOption(field.id, index, value)}
        onMoveUp={() => moveFieldUp(field.id)}
        onMoveDown={() => moveFieldDown(field.id)}
        onRemove={() => removeField(field.id, 1)}
        canMoveUp={fieldPositionInSection > 0}
        canMoveDown={fieldPositionInSection < sectionFields.length - 1}
        showActions={true}
        disabled={false}
      />
    );
  }, [fields, getSectionById, getFieldsForSection, getFieldError, handleFieldChange, addOption, removeOption, updateOption, moveFieldUp, moveFieldDown, removeField]);

  // Rendre une section
  const renderSection = (section: FormSection, sectionIndex: number) => {
    const sectionFields = getFieldsForSection(section.id);
    const isExpanded = expandedSections.has(section.id);

    return (
      <FormSectionComponent
        key={section.id}
        section={section}
        sectionIndex={sectionIndex}
        allFields={fields}
        error={getSectionError(section.id, 'name')}
        onChange={(property, value) => handleSectionChange(section.id, property as keyof Omit<FormSection, 'id' | 'order' | 'fieldIds'>, value)}
        onMoveUp={() => moveSectionUp(section.id)}
        onMoveDown={() => moveSectionDown(section.id)}
        onRemove={() => removeSection(section.id)}
        onAssignField={(fieldId) => assignFieldToSection(fieldId, section.id)}
        onUnassignField={(fieldId) => assignFieldToSection(fieldId, null)}
        canMoveUp={sectionIndex > 0}
        canMoveDown={sectionIndex < sections.length - 1}
        showActions={true}
        expanded={isExpanded}
        onToggleExpand={() => toggleSectionExpand(section.id)}
        renderField={renderField}
        sectionId={section.id}
      />
    );
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

            <div className={`${styles['form-group']} ${errors.packageType ? styles['has-error'] : ''}`}>
              <label htmlFor="packageType">Type de formule</label>
              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleFormChange}
              >
                <option value="">Tous les types</option>
                {PACKAGE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="description">Description (optionnelle)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Description du formulaire"
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

            <div className={styles['form-group']}>
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                />
                <span className={styles['checkbox-label']}>Formulaire actif</span>
              </label>
            </div>
          </div>
        </div>

        {/* Option pour activer les sections */}
        <div className={styles['form-section']}>
          <h2 className={styles['section-title']}>Organisation du formulaire</h2>
          
          <div className={styles['form-group']}>
            <label>
              <input
                type="checkbox"
                checked={showSections}
                onChange={(e) => setShowSections(e.target.checked)}
              />
              <span className={styles['checkbox-label']}>
                Utiliser des sections pour organiser les questions sur plusieurs pages
              </span>
            </label>
            <p className={styles['hint']}>
              Activez cette option pour créer un formulaire multi-pages avec une barre de progression.
            </p>
          </div>
        </div>

        {/* Sections (si activé) */}
        {showSections && (
          <div className={styles['form-section']}>
            <h2 className={styles['section-title']}>
              Sections du formulaire
              <div className={styles['section-actions']}>
                <button
                  type="button"
                  onClick={() => addField()}
                  className={styles['add-field-button']}
                >
                  + Ajouter une question
                </button>
                <button
                  type="button"
                  onClick={addSection}
                  className={styles['add-section-button']}
                >
                  + Ajouter une section
                </button>
              </div>
            </h2>

            {sections.length === 0 && (
              <div className={styles['empty-state']}>
                <p>Aucune section créée. Cliquez sur "Ajouter une section" pour commencer.</p>
              </div>
            )}

            <div className={styles['sections-list']}>
              {sections.map((section, index) => renderSection(section, index))}
            </div>

            {/* Champs non assignés à une section */}
            {getUnassignedFields().length > 0 && (
              <div className={styles['unassigned-fields']}>
                <h3>Champs non assignés à une section</h3>
                <p className={styles['hint']}>
                  Ces champs ne sont pas encore assignés à une section. 
                  Vous pouvez les éditer et les assigner à une section.
                </p>
                <div className={styles['fields-list']}>
                  {getUnassignedFields().map((field) => (
                    <div key={field.id} className={styles['unassigned-field-container']}>
                      {renderField(field)}
                      <div className={styles['assign-section-container']}>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              assignFieldToSection(field.id, e.target.value);
                            }
                          }}
                          className={styles['section-selector']}
                        >
                          <option value="">-- Assigner à une section --</option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.name || `Section ${sections.indexOf(section) + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Champs (si pas de sections) */}
        {!showSections && (
          <div className={styles['form-section']}>
            <h2 className={styles['section-title']}>
              Questions du formulaire
              <button
                type="button"
                onClick={() => addField()}
                className={styles['add-field-button']}
              >
                + Ajouter une question
              </button>
            </h2>

            {fields.length === 0 && (
              <div className={styles['empty-state']}>
                <p>Aucune question créée. Cliquez sur "Ajouter une question" pour commencer.</p>
              </div>
            )}

            <div className={styles['fields-list']}>
              {fields.map((field, index) => renderField(field))}
            </div>
          </div>
        )}

        {/* Boutons de soumission */}
        <div className={styles['submit-container']}>
          <button
            type="submit"
            className={styles['submit-button']}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer le formulaire'}
          </button>
        </div>
      </form>
    </section>
  );
}
