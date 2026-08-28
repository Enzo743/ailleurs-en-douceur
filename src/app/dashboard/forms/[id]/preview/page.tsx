'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { FormField as FormFieldType, FormSection } from '@/lib/form-constants';
import FormProgressBar from '@/components/FormProgressBar';
import styles from './page.module.scss';

interface FormField extends Omit<FormFieldType, 'key'> {
  key: string;
  sectionId?: string;
}

interface CustomFormData {
  id: string;
  name: string;
  description?: string;
  successMessage: string;
  fields: FormField[];
  sections: FormSection[];
}

interface FieldValue {
  [key: string]: string | string[] | boolean | number | Date;
}

const getInputType = (fieldType: string): string => {
  switch (fieldType) {
    case 'TEXTAREA':
      return 'textarea';
    case 'NUMBER':
    case 'RANGE_NUMBER':
      return 'number';
    case 'EMAIL':
      return 'email';
    case 'DATE':
    case 'RANGE_DATE':
      return 'date';
    case 'SELECT':
    case 'MULTISELECT':
      return 'select';
    case 'CHECKBOX':
      return 'checkbox';
    default:
      return 'text';
  }
};

export default function PreviewFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customForm, setCustomForm] = useState<CustomFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState<FieldValue>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/forms/${id}`);
        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error('Formulaire non trouvé');
        }

        const form: CustomFormData = data.data;
        setCustomForm(form);
        
        // Initialiser les valeurs par défaut
        const initialValues: FieldValue = {};
        form.fields.forEach((field: FormField) => {
          initialValues[field.key] = field.defaultValue || '';
        });
        setFormValues(initialValues);

      } catch (error) {
        console.error('Error fetching form:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const goToSection = (index: number) => {
    setCurrentSectionIndex(index);
  };

  const goToNextSection = () => {
    if (customForm && currentSectionIndex < customForm.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  const handleFieldChange = (
    fieldKey: string,
    value: string | string[] | boolean,
    fieldType?: string
  ) => {
    setFormValues(prev => {
      const newValues = { ...prev };
      
      if (fieldType === 'CHECKBOX') {
        newValues[fieldKey] = value as boolean;
      } else if (fieldType === 'MULTISELECT') {
        newValues[fieldKey] = value as string[];
      } else if (fieldType === 'NUMBER') {
        newValues[fieldKey] = value === '' ? '' : Number(value);
      } else {
        newValues[fieldKey] = value;
      }
      
      return newValues;
    });
  };

  const renderField = (field: FormField) => {
    const inputType = getInputType(field.type);
    const value = formValues[field.key] || '';
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case 'TEXTAREA':
        return (
          <div key={field.id} className={styles['form-group']}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <textarea
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              placeholder={field.placeholder}
              rows={4}
              className={styles['form-input']}
              readOnly
            />
          </div>
        );

      case 'SELECT':
        return (
          <div key={field.id} className={styles['form-group']}>
            <fieldset className={styles['radio-group']}>
              <legend>
                {field.label}{field.required && <span className={styles.required}> *</span>}
              </legend>
              {field.options.map((option, index) => (
                <div key={index} className={styles['radio-option']}>
                  <input
                    type="radio"
                    id={`${fieldId}-${index}`}
                    name={field.key}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                    className={styles['form-input']}
                    disabled
                  />
                  <label htmlFor={`${fieldId}-${index}`}>
                    {option}
                  </label>
                </div>
              ))}
            </fieldset>
          </div>
        );

      case 'MULTISELECT':
        return (
          <div key={field.id} className={styles['form-group']}>
            <fieldset className={styles['checkbox-group']}>
              <legend>
                {field.label}{field.required && <span className={styles.required}> *</span>}
              </legend>
              {field.options.map((option, index) => {
                const currentValue = Array.isArray(value) ? value : [];
                const isChecked = currentValue.includes(option);
                return (
                  <div key={index} className={styles['checkbox-option']}>
                    <input
                      type="checkbox"
                      id={`${fieldId}-${index}`}
                      checked={isChecked}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...currentValue, option]
                          : currentValue.filter(v => v !== option);
                        handleFieldChange(field.key, newValue, field.type);
                      }}
                      className={styles['form-input']}
                      disabled
                    />
                    <label htmlFor={`${fieldId}-${index}`}>
                      {option}
                    </label>
                  </div>
                );
              })}
            </fieldset>
          </div>
        );

      case 'CHECKBOX':
        return (
          <div key={field.id} className={styles['form-group']}>
            <div className={styles['checkbox-option']}>
              <input
                type="checkbox"
                id={fieldId}
                checked={value as boolean || false}
                onChange={(e) => handleFieldChange(field.key, e.target.checked, field.type)}
                className={styles['form-input']}
                disabled
              />
              <label htmlFor={fieldId}>
                {field.label}{field.required && <span className={styles.required}> *</span>}
              </label>
            </div>
          </div>
        );

      case 'DATE':
        return (
          <div key={field.id} className={styles['form-group']}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type="date"
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              className={styles['form-input']}
              disabled
            />
          </div>
        );

      case 'RANGE_NUMBER':
        return (
          <div key={field.id} className={styles['form-group']}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <div className={styles['range-container']}>
              <input
                type="number"
                id={`${fieldId}-min`}
                value={(formValues[`${field.key}_min`] as string) || (field.minValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_min`, e.target.value, field.type)}
                placeholder="Min"
                min={field.minValue}
                className={styles['form-input']}
                disabled
              />
              <span className={styles['range-separator']}>à</span>
              <input
                type="number"
                id={`${fieldId}-max`}
                value={(formValues[`${field.key}_max`] as string) || (field.maxValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_max`, e.target.value, field.type)}
                placeholder="Max"
                max={field.maxValue}
                className={styles['form-input']}
                disabled
              />
            </div>
          </div>
        );

      case 'RANGE_DATE':
        return (
          <div key={field.id} className={styles['form-group']}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <div className={styles['range-container']}>
              <input
                type="date"
                id={`${fieldId}-min`}
                value={(formValues[`${field.key}_min`] as string) || (field.minValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_min`, e.target.value, field.type)}
                className={styles['form-input']}
                disabled
              />
              <span className={styles['range-separator']}>à</span>
              <input
                type="date"
                id={`${fieldId}-max`}
                value={(formValues[`${field.key}_max`] as string) || (field.maxValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_max`, e.target.value, field.type)}
                className={styles['form-input']}
                disabled
              />
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className={styles['form-group']}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type={inputType}
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              placeholder={field.placeholder}
              min={inputType === 'number' ? '0' : undefined}
              step={inputType === 'number' ? '1' : undefined}
              className={styles['form-input']}
              disabled
            />
          </div>
        );
    }
  };

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

  if (!customForm) {
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles['header-left']}>
            <Link href="/dashboard/forms" className={styles['back-link']}>
              ← Retour aux formulaires
            </Link>
            <h1 className={styles.pageTitle}>Prévisualisation: {customForm.name}</h1>
            <p className={styles.pageSubtitle}>
              Aperçu du formulaire tel que le verront vos clients
            </p>
          </div>
        </div>

        {customForm.description && (
          <div className={styles.description}>
            <p>{customForm.description}</p>
          </div>
        )}

        <div className={styles['preview-container']}>
          <div className={styles['preview-form']}>
            {/* Barre de progression si il y a des sections */}
            {customForm.sections && customForm.sections.length > 1 && (
              <FormProgressBar
                sections={customForm.sections}
                currentSectionIndex={currentSectionIndex}
                onSectionChange={goToSection}
              />
            )}

            {/* Affichage des sections ou des champs simples */}
            {customForm.sections && customForm.sections.length > 0 ? (
              <div className={styles['sections-container']}>
                {/* Afficher uniquement la section courante */}
                <div className={styles['current-section']}>
                  {(() => {
                    const currentSection = customForm.sections[currentSectionIndex];
                    if (!currentSection) return null;

                    // Récupérer les champs de cette section
                    const sectionFields = customForm.fields
                      .filter(field => field.sectionId === currentSection.id)
                      .sort((a, b) => a.order - b.order);

                    return (
                      <>
                        {/* Afficher la description de la section si elle existe */}
                        {currentSection.description && (
                          <div className={styles['section-description']}>
                            <p>{currentSection.description}</p>
                          </div>
                        )}

                        {/* Afficher les champs de la section */}
                        <div className={styles['fields-container']}>
                          {sectionFields.map((field, index, array) => (
                            <div key={field.id} className={index < array.length - 1 ? styles['field-separator'] : ''}>
                              {renderField(field)}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Boutons de navigation entre sections */}
                {customForm.sections.length > 1 && (
                  <div className={styles['section-navigation']}>
                    {currentSectionIndex > 0 && (
                      <button
                        type="button"
                        onClick={goToPreviousSection}
                        className={styles['nav-button']}
                        disabled
                      >
                        ← Précédent
                      </button>
                    )}
                    {currentSectionIndex < customForm.sections.length - 1 ? (
                      <button
                        type="button"
                        onClick={goToNextSection}
                        className={styles['nav-button']}
                        disabled
                      >
                        Suivant →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles['submit-button']}
                        disabled
                      >
                        Envoyer le formulaire
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles['fields-container']}>
                {customForm.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field, index, array) => (
                    <div key={field.id} className={index < array.length - 1 ? styles['field-separator'] : ''}>
                      {renderField(field)}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <p>
            <strong>Note :</strong> Tous les champs sont désactivés en mode prévisualisation.
          </p>
        </div>
      </div>
    </section>
  );
}
