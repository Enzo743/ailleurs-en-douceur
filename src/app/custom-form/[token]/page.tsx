'use client';

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { getPackageLabel } from '@/lib/constants';
import { FormSection, FormField as FormFieldType } from '@/lib/form-constants';
import FormProgressBar from '@/components/dashboard/FormProgressBar';

interface FormField extends Omit<FormFieldType, 'key'> {
  key: string; // Rend la clé obligatoire pour le frontend
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

interface ContactRequestData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  days: number;
  formId?: string;
}

interface FieldValue {
  [key: string]: string | string[] | boolean | number | Date;
}

// Mapper les types de champs vers des types HTML
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

export default function CustomFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [contactRequest, setContactRequest] = useState<ContactRequestData | null>(null);
  const [customForm, setCustomForm] = useState<CustomFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<FieldValue>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Récupérer les données au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Récupérer la demande de contact avec le token
        const contactResponse = await fetch(`/api/contact-requests?search=${token}`);
        const contactData = await contactResponse.json();

        if (!contactData.success || !contactData.data || contactData.data.length === 0) {
          throw new Error('Demande de contact non trouvée');
        }

        const contactReq = contactData.data[0];
        setContactRequest({
          id: contactReq.id,
          firstName: contactReq.firstName,
          lastName: contactReq.lastName,
          email: contactReq.email,
          packageType: contactReq.packageType,
          days: contactReq.days,
          formId: contactReq.formId,
        });

        // Si un formulaire est déjà associé, le récupérer
        if (contactReq.formId) {
          const formResponse = await fetch(`/api/forms/${contactReq.formId}`);
          const formData = await formResponse.json();

          if (formData.success && formData.data) {
            setCustomForm(formData.data);
            // Initialiser les valeurs par défaut
            const initialValues: FieldValue = {};
            formData.data.fields.forEach((field: FormField) => {
              initialValues[field.key] = field.defaultValue || '';
            });
            // Ajouter le champ de préférence de contact
            initialValues['contactPreference'] = '';
            setFormValues(initialValues);
          }
        } else {
          // Sinon, trouver le formulaire associé au packageType
          const formsResponse = await fetch(`/api/forms?packageType=${contactReq.packageType}`);
          const formsData = await formsResponse.json();

          if (formsData.success && formsData.data && formsData.data.length > 0) {
            const activeForm = formsData.data.find((f: any) => f.isActive);
            if (activeForm) {
              setCustomForm(activeForm);
              // Initialiser les valeurs par défaut
              const initialValues: FieldValue = {};
              activeForm.fields.forEach((field: FormField) => {
                initialValues[field.key] = field.defaultValue || '';
              });
              // Ajouter le champ de préférence de contact
              initialValues['contactPreference'] = '';
              setFormValues(initialValues);
            }
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setSubmitStatus({
          success: false,
          message: 'Une erreur est survenue lors du chargement du formulaire. Le lien peut avoir expiré.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Gérer le changement de valeur d'un champ
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

    // Supprimer l'erreur si elle existe
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  // Navigation entre les sections
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

  // Valider une section spécifique
  const validateSection = (sectionIndex: number): boolean => {
    if (!customForm) return false;
    
    const newErrors: Record<string, string> = {};
    const section = customForm.sections[sectionIndex];
    if (!section) return true;

    // Récupérer les champs de cette section
    const sectionFields = customForm.fields.filter(field => field.sectionId === section.id);
    
    sectionFields.forEach((field) => {
      if (field.required) {
        const value = formValues[field.key];
        
        if (value === undefined || value === null || value === '') {
          newErrors[field.key] = `${field.label} est obligatoire`;
        } else if (field.type === 'EMAIL' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.key] = 'Veuillez entrer un email valide';
          }
        } else if (field.type === 'NUMBER' && typeof value === 'number') {
          if (isNaN(value) || value <= 0) {
            newErrors[field.key] = 'Veuillez entrer un nombre valide';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Valider le formulaire complet
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customForm) return false;

    customForm.fields.forEach((field) => {
      if (field.required) {
        const value = formValues[field.key];
        
        if (value === undefined || value === null || value === '') {
          newErrors[field.key] = `${field.label} est obligatoire`;
        } else if (field.type === 'EMAIL' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.key] = 'Veuillez entrer un email valide';
          }
        } else if (field.type === 'NUMBER' && typeof value === 'number') {
          if (isNaN(value) || value <= 0) {
            newErrors[field.key] = 'Veuillez entrer un nombre valide';
          }
        }
      }
    });

    // Valider le champ de préférence de contact
    if (!formValues['contactPreference']) {
      newErrors['contactPreference'] = 'Veuillez sélectionner une préférence de contact';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire ou passer à la section suivante
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customForm || !contactRequest) {
      setSubmitStatus({
        success: false,
        message: 'Une erreur est survenue. Veuillez rafraîchir la page.'
      });
      return;
    }

    // Si on a des sections et qu'on n'est pas à la dernière, valider la section courante
    if (customForm.sections && customForm.sections.length > 1 && 
        currentSectionIndex < customForm.sections.length - 1) {
      
      if (!validateSection(currentSectionIndex)) {
        setSubmitStatus({
          success: false,
          message: 'Veuillez corriger les erreurs dans cette section.'
        });
        return;
      }
      
      // Passer à la section suivante
      goToNextSection();
      return;
    }

    // Si on est à la dernière section ou qu'il n'y a pas de sections, valider le formulaire complet
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
      const valuesToSend: Record<string, any> = {};
      Object.entries(formValues).forEach(([key, value]) => {
        // Ne pas envoyer les valeurs vides pour les champs non requis
        if (value !== undefined && value !== null && value !== '') {
          valuesToSend[key] = value;
        }
      });

      const response = await fetch('/api/form-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactRequestId: contactRequest.id,
          formId: customForm.id,
          values: valuesToSend,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: result.message || 'Votre formulaire a été soumis avec succès !'
        });

        // Rediriger vers la page de planning après 3 secondes
        setTimeout(() => {
          router.push(`/schedule/${token}`);
        }, 3000);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la soumission.'
        });
      }

    } catch (error: any) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de soumettre le formulaire. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu des champs du formulaire
  const renderField = (field: FormField) => {
    const inputType = getInputType(field.type);
    const value = formValues[field.key] || '';
    const hasError = errors[field.key];
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case 'TEXTAREA':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <textarea
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              placeholder={field.placeholder}
              rows={4}
              className={hasError ? styles['error-input'] : ''}
            />
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'SELECT':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <fieldset className={styles['radio-group']}>
              <legend>
                {field.label}{field.required && <span className={styles.required}> *</span>}
                <small className={styles['field-hint']}>Sélectionnez une seule option</small>
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
                    className={hasError ? styles['error-input'] : ''}
                  />
                  <label htmlFor={`${fieldId}-${index}`}>
                    {option}
                  </label>
                </div>
              ))}
              {field.allowOtherOption && (
                <div className={styles['radio-option']}>
                  <input
                    type="radio"
                    id={`${fieldId}-other`}
                    name={field.key}
                    value="_OTHER_"
                    checked={value === '_OTHER_'}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                    className={hasError ? styles['error-input'] : ''}
                  />
                  <label htmlFor={`${fieldId}-other`}>
                    Autre
                  </label>
                </div>
              )}
            </fieldset>
            {field.allowOtherOption && value === '_OTHER_' && (
              <div className={styles['other-option-input']}>
                <input
                  type="text"
                  id={`${fieldId}-other-text`}
                  value={(formValues[`${field.key}_other`] as string) || ''}
                  onChange={(e) => handleFieldChange(`${field.key}_other`, e.target.value, field.type)}
                  placeholder="Précisez..."
                  className={hasError ? styles['error-input'] : ''}
                />
              </div>
            )}
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'MULTISELECT':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <fieldset className={styles['checkbox-group']}>
              <legend>
                {field.label}{field.required && <span className={styles.required}> *</span>}
                <small className={styles['field-hint']}>Vous pouvez sélectionner plusieurs options</small>
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
                      className={hasError ? styles['error-input'] : ''}
                    />
                    <label htmlFor={`${fieldId}-${index}`}>
                      {option}
                    </label>
                  </div>
                );
              })}
              {field.allowOtherOption && (
                <div className={styles['checkbox-option']}>
                  <input
                    type="checkbox"
                    id={`${fieldId}-other`}
                    checked={(value as string[]).includes('_OTHER_')}
                    onChange={(e) => {
                      const currentValue = Array.isArray(value) ? value : [];
                      const newValue = e.target.checked
                        ? [...currentValue, '_OTHER_']
                        : currentValue.filter(v => v !== '_OTHER_');
                      handleFieldChange(field.key, newValue, field.type);
                    }}
                    className={hasError ? styles['error-input'] : ''}
                  />
                  <label htmlFor={`${fieldId}-other`}>
                    Autre
                  </label>
                </div>
              )}
            </fieldset>
            {field.allowOtherOption && (value as string[]).includes('_OTHER_') && (
              <div className={styles['other-option-input']}>
                <input
                  type="text"
                  id={`${fieldId}-other-text`}
                  value={(formValues[`${field.key}_other`] as string) || ''}
                  onChange={(e) => handleFieldChange(`${field.key}_other`, e.target.value, field.type)}
                  placeholder="Précisez..."
                  className={hasError ? styles['error-input'] : ''}
                />
              </div>
            )}
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <div className={styles['checkbox-option']}>
              <input
                type="checkbox"
                id={fieldId}
                checked={value as boolean || false}
                onChange={(e) => handleFieldChange(field.key, e.target.checked, field.type)}
                className={hasError ? styles['error-input'] : ''}
              />
              <label htmlFor={fieldId}>
                {field.label}{field.required && <span className={styles.required}> *</span>}
              </label>
            </div>
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'DATE':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type="date"
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              className={hasError ? styles['error-input'] : ''}
            />
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'RANGE_NUMBER':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
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
                className={hasError ? styles['error-input'] : ''}
              />
              <span className={styles['range-separator']}>à</span>
              <input
                type="number"
                id={`${fieldId}-max`}
                value={(formValues[`${field.key}_max`] as string) || (field.maxValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_max`, e.target.value, field.type)}
                placeholder="Max"
                max={field.maxValue}
                className={hasError ? styles['error-input'] : ''}
              />
            </div>
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'RANGE_DATE':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <div className={styles['range-container']}>
              <input
                type="date"
                id={`${fieldId}-min`}
                value={(formValues[`${field.key}_min`] as string) || (field.minValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_min`, e.target.value, field.type)}
                className={hasError ? styles['error-input'] : ''}
              />
              <span className={styles['range-separator']}>à</span>
              <input
                type="date"
                id={`${fieldId}-max`}
                value={(formValues[`${field.key}_max`] as string) || (field.maxValue || '')}
                onChange={(e) => handleFieldChange(`${field.key}_max`, e.target.value, field.type)}
                className={hasError ? styles['error-input'] : ''}
              />
            </div>
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      default:
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
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
              className={hasError ? styles['error-input'] : ''}
            />
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );
    }
  };

  // Si chargement ou erreur
  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['loading-spinner']}></div>
          <p>Chargement du formulaire...</p>
        </div>
      </main>
    );
  }

  if (submitStatus && !submitStatus.success) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['error-box']}>
            <h2>Erreur</h2>
            <p>{submitStatus.message}</p>
            <button onClick={() => router.push('/contact')} className={styles['back-button']}>
              Retour au formulaire de contact
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Si pas de formulaire trouvé
  if (!customForm) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['error-box']}>
            <h2>Formulaire non disponible</h2>
            <p>Aucun formulaire personnalisé n'est configuré pour cette demande.</p>
            <p>Vous serez contacté directement par notre équipe.</p>
          </div>
        </div>
      </main>
    );
  }

  // Affichage du formulaire
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Formulaire personnalisé</h1>
          {contactRequest && (
            <p className={styles.subtitle}>
              Bonjour {contactRequest.firstName}, merci de compléter ce formulaire pour nous aider
              à mieux préparer votre projet : <strong>{getPackageLabel(contactRequest.packageType)}</strong>
            </p>
          )}
        </div>

        {customForm.description && (
          <div className={styles.description}>
            <p>{customForm.description}</p>
          </div>
        )}

        {submitStatus && submitStatus.success ? (
          <div className={styles['success-message']}>
            <h2>Merci !</h2>
            <p>{submitStatus.message}</p>
            <p>Vous allez être redirigé vers la page de sélection de rendez-vous...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
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
                      >
                        ← Précédent
                      </button>
                    )}
                    {currentSectionIndex < customForm.sections.length - 1 ? (
                      <button
                        type="submit"
                        className={styles['nav-button']}
                      >
                        Suivant →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className={styles['submit-button']}
                      >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le formulaire'}
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

            {currentSectionIndex === (customForm.sections?.length || 1) - 1 && (
              <div className={styles['contact-preference-container']}>
                <div className={styles['contact-preference-field']}>
                  <fieldset className={styles['contact-preference-options']}>
                    <legend className={styles['contact-preference-legend']}>
                      Préférez-vous être recontacté par visioconférence ou par téléphone ?
                      <span className={styles.required}> *</span>
                    </legend>
                    <div className={styles['contact-preference-option']}>
                      <input
                        type="radio"
                        id="contact-preference-visio"
                        name="contactPreference"
                        value="Visioconférence"
                        checked={formValues['contactPreference'] === 'Visioconférence'}
                        onChange={(e) => handleFieldChange('contactPreference', e.target.value, 'SELECT')}
                        className={styles['contact-preference-input']}
                      />
                      <label htmlFor="contact-preference-visio" className={styles['contact-preference-label']}>
                        <span className={styles['contact-preference-icon']}>💻</span>
                        <span>Visioconférence</span>
                      </label>
                    </div>
                    <div className={styles['contact-preference-option']}>
                      <input
                        type="radio"
                        id="contact-preference-phone"
                        name="contactPreference"
                        value="Téléphone"
                        checked={formValues['contactPreference'] === 'Téléphone'}
                        onChange={(e) => handleFieldChange('contactPreference', e.target.value, 'SELECT')}
                        className={styles['contact-preference-input']}
                      />
                      <label htmlFor="contact-preference-phone" className={styles['contact-preference-label']}>
                        <span className={styles['contact-preference-icon']}>📞</span>
                        <span>Téléphone</span>
                      </label>
                    </div>
                  </fieldset>
                  {errors['contactPreference'] && <span className={styles['error-message']}>{errors['contactPreference']}</span>}
                </div>
              </div>
            )}

            {(!customForm.sections || customForm.sections.length <= 1) && (
              <div className={styles['submit-container']}>
                <button
                  type="submit"
                  className={styles['submit-button']}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le formulaire'}
                </button>
              </div>
            )}
          </form>
        )}

        <div className={styles.footer}>
          <p>
            Besoin d'aide ? Contactez-nous à l'adresse indiquée sur notre site.
          </p>
        </div>
      </div>
    </main>
  );
}
