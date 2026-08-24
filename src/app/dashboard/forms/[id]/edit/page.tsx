'use client';

import { useState, FormEvent, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PACKAGE_TYPE_OPTIONS } from '@/lib/constants';
import { FormField, FormField as FormFieldType, FormSection } from '@/lib/form-constants';
import { useFormWithSections } from '@/hooks/useFormWithSections';
import { FormField as FormFieldComponent, FormSection as FormSectionComponent } from '@/components/dashboard';
import styles from './page.module.scss';

interface CustomForm {
  id: string;
  name: string;
  packageType?: string;
  description?: string;
  successMessage: string;
  isActive: boolean;
  fields: FormFieldType[];
  sections: FormSection[];
  stats?: {
    responsesCount: number;
    requestsCount: number;
  };
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
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasResponses, setHasResponses] = useState(false);
  const [useSections, setUseSections] = useState(false);

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
        
        // Initialiser les sections si elles existent
        if (form.sections && form.sections.length > 0) {
          setSections(form.sections);
          setUseSections(true);
        }
        
        // Vérifier si le formulaire a des réponses
        setHasResponses((form.stats?.responsesCount || 0) > 0);

      } catch (error) {
        console.error('Error fetching form:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id, setFields, setSections]);

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
    const isSectionsValid = useSections ? validateSections() : true;

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
        name: formData.name.trim(),
        packageType: formData.packageType?.trim(),
        description: formData.description?.trim(),
        successMessage: formData.successMessage,
        isActive: formData.isActive,
        fields: fields.map(({ id, ...rest }) => rest),
      };

      // Ajouter les sections si on les utilise
      if (useSections && sections.length > 0) {
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

      const response = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: 'Formulaire mis à jour avec succès !',
        });

        // Recharger les données après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la mise à jour du formulaire.',
        });
      }

    } catch (error: any) {
      console.error('Error updating form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de mettre à jour le formulaire. Veuillez vérifier votre connexion.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dupliquer le formulaire
  const handleDuplicate = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir dupliquer ce formulaire ?')) {
      return;
    }

    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/dashboard/forms/${id}/duplicate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push('/dashboard/forms');
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la duplication du formulaire.',
        });
      }

    } catch (error: any) {
      console.error('Error duplicating form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de dupliquer le formulaire.',
      });
    } finally {
      setIsDuplicating(false);
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
    const sectionFields = section ? getFieldsForSection(section.id) : [];
    const fieldPositionInSection = sectionFields.findIndex(f => f.id === field.id);

    return (
      <FormFieldComponent
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
        disabled={hasResponses}
      />
    );
  }, [fields, getSectionById, getFieldsForSection, getFieldError, handleFieldChange, addOption, removeOption, updateOption, moveFieldUp, moveFieldDown, removeField, hasResponses]);

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

  // Basculer l'utilisation des sections
  const toggleUseSections = (useSections: boolean) => {
    if (useSections) {
      // Si on active les sections, créer une section par défaut avec tous les champs
      if (sections.length === 0) {
        const sectionId = `section-${Date.now()}`;
        setSections([{
          id: sectionId,
          name: 'Section principale',
          description: '',
          order: 0,
          fieldIds: fields.map(f => f.id),
        }]);
        
        // Assigner tous les champs à cette section
        setFields((prev: FormField[]) => prev.map(field => ({ ...field, sectionId } as FormField)));
      }
    } else {
      // Si on désactive les sections, retirer les assignations
      setFields((prev: FormField[]) => prev.map(field => ({ ...field, sectionId: undefined } as FormField)));
      setSections([]);
    }
    
    setUseSections(useSections);
  };

  // Si chargement
  if (isLoading) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
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
        <div className={styles.container}>
          <div className={styles['error-box']}>
            <h2>Formulaire non trouvé</h2>
            <p>Le formulaire que vous cherchez n'existe pas ou a été supprimé.</p>
            <Link href="/dashboard/forms" className={styles['back-link']}>
              Retour à la liste des formulaires
            </Link>
          </div>
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
            Modifiez les informations et les questions de votre formulaire
          </p>
        </div>
        
        <div className={styles['header-actions']}>
          <button
            type="button"
            onClick={handleDuplicate}
            className={styles['duplicate-button']}
            disabled={isDuplicating}
          >
            {isDuplicating ? 'Duplication...' : 'Dupliquer'}
          </button>
        </div>
      </div>

      {submitStatus && (
        <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
          <p>{submitStatus.message}</p>
        </div>
      )}

      {hasResponses && (
        <div className={styles['warning-box']}>
          <p>
            <strong>Attention :</strong> Ce formulaire a déjà reçu des réponses. 
            Les modifications peuvent affecter les données existantes.
          </p>
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
                disabled={hasResponses}
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
                disabled={hasResponses}
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
                disabled={hasResponses}
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
                  disabled={hasResponses}
                />
                <span className={styles['checkbox-label']}>Formulaire actif</span>
              </label>
            </div>
          </div>
        </div>

        {/* Option pour activer/désactiver les sections */}
        <div className={styles['form-section']}>
          <h2 className={styles['section-title']}>Organisation du formulaire</h2>
          
          <div className={styles['form-group']}>
            <label>
              <input
                type="checkbox"
                checked={useSections}
                onChange={(e) => toggleUseSections(e.target.checked)}
                disabled={hasResponses}
              />
              <span className={styles['checkbox-label']}>
                Utiliser des sections pour organiser les questions sur plusieurs pages
              </span>
            </label>
            <p className={styles['hint']}>
              Activez cette option pour créer un formulaire multi-pages avec une barre de progression.
              {hasResponses && ' (Non modifiable car le formulaire a déjà des réponses)'}
            </p>
          </div>
        </div>

        {/* Sections (si activé) */}
        {useSections && (
          <div className={styles['form-section']}>
            <h2 className={styles['section-title']}>
              Sections du formulaire
              <div className={styles['section-actions']}>
                <button
                  type="button"
                  onClick={() => addField()}
                  className={styles['add-field-button']}
                  disabled={hasResponses}
                >
                  + Ajouter une question
                </button>
                <button
                  type="button"
                  onClick={addSection}
                  className={styles['add-section-button']}
                  disabled={hasResponses}
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
        {!useSections && (
          <div className={styles['form-section']}>
            <h2 className={styles['section-title']}>
              Questions du formulaire
              <button
                type="button"
                onClick={() => addField()}
                className={styles['add-field-button']}
                disabled={hasResponses}
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
            disabled={isSubmitting || hasResponses}
          >
            {isSubmitting ? 'Mise à jour en cours...' : 'Mettre à jour le formulaire'}
          </button>
        </div>
      </form>
    </section>
  );
}
