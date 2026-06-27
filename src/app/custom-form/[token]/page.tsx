'use client';

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { getPackageLabel } from '@/lib/constants';

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

interface CustomFormData {
  id: string;
  name: string;
  description?: string;
  successMessage: string;
  fields: FormField[];
}

interface ContactRequestData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  nights: number;
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
      return 'number';
    case 'EMAIL':
      return 'email';
    case 'DATE':
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
          nights: contactReq.nights,
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

  // Valider le formulaire
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customForm || !contactRequest) {
      setSubmitStatus({
        success: false,
        message: 'Une erreur est survenue. Veuillez rafraîchir la page.'
      });
      return;
    }

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
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <select
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              className={hasError ? styles['error-input'] : ''}
            >
              {!field.required && <option value="">Sélectionnez une option</option>}
              {field.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'MULTISELECT':
        return (
          <div key={field.id} className={`${styles['form-group']} ${hasError ? styles['has-error'] : ''}`}>
            <label htmlFor={fieldId}>
              {field.label}{field.required && <span className={styles.required}> *</span>}
            </label>
            <select
              id={fieldId}
              multiple
              value={value as string[] || []}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                handleFieldChange(field.key, selectedOptions, field.type);
              }}
              className={hasError ? styles['error-input'] : ''}
            >
              {field.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <small>Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs options</small>
            {hasError && <span className={styles['error-message']}>{hasError}</span>}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div key={field.id} className={`${styles['form-group']} ${styles['checkbox-group']} ${hasError ? styles['has-error'] : ''}`}>
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
            <div className={styles['fields-container']}>
              {customForm.fields
                .sort((a, b) => a.order - b.order)
                .map(renderField)}
            </div>

            <div className={styles['submit-container']}>
              <button
                type="submit"
                className={styles['submit-button']}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le formulaire'}
              </button>
            </div>
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
