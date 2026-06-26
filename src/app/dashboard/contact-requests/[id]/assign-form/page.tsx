'use client';

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';

interface ContactRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  nights: number;
  message: string;
  token: string;
  formId: string | null;
  status: string;
}

interface Form {
  id: string;
  name: string;
  packageType: string | null;
  description: string | null;
  isActive: boolean;
}

// Mapper les types de formule
const packageLabels: Record<string, string> = {
  'escapade-en-douceur': 'Escapade en douceur',
  'voyage-sur-mesure': 'Voyage sur-mesure',
  'voyage-de-noces': 'Voyage de noces',
};

const getPackageLabel = (value: string): string => {
  return packageLabels[value] || value;
};

export default function AssignFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [contactRequest, setContactRequest] = useState<ContactRequest | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer la demande de contact
        const crResponse = await fetch(`/api/contact-requests?search=${id}`);
        const crData = await crResponse.json();
        
        if (!crData.success || !crData.data || crData.data.length === 0) {
          setNotFound(true);
          return;
        }
        
        setContactRequest(crData.data[0]);
        
        // Récupérer les formulaires actifs
        const formsResponse = await fetch('/api/forms?isActive=true&limit=100');
        const formsData = await formsResponse.json();
        
        if (formsData.success && formsData.data) {
          setForms(formsData.data);
          
          // Si un formulaire est déjà associé, le sélectionner
          if (crData.data[0].formId) {
            setSelectedFormId(crData.data[0].formId);
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setSubmitStatus({
          success: false,
          message: 'Une erreur est survenue lors du chargement des données.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleFormSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormId(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFormId) {
      setSubmitStatus({
        success: false,
        message: 'Veuillez sélectionner un formulaire.'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch(`/api/contact-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: selectedFormId,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: 'Formulaire associé avec succès !'
        });
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push(`/dashboard/contact-requests/${id}`);
        }, 2000);
        
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de l\'association du formulaire.'
        });
      }
      
    } catch (error: any) {
      console.error('Error assigning form:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible d\'associer le formulaire. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si chargement
  if (isLoading) {
    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <Link href={`/dashboard/contact-requests/${id}`} className={styles['back-link']}>
            ← Retour
          </Link>
          <h1 className={styles.pageTitle}>Associer un formulaire</h1>
        </div>
        <div className={styles.loading}>
          <div className={styles['loading-spinner']}></div>
          <p>Chargement...</p>
        </div>
      </section>
    );
  }

  // Si non trouvé
  if (notFound) {
    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <Link href="/dashboard/contact-requests" className={styles['back-link']}>
            ← Retour aux demandes
          </Link>
          <h1 className={styles.pageTitle}>Demande non trouvée</h1>
        </div>
        <div className={styles['error-box']}>
          <p>La demande de contact que vous cherchez n'existe pas ou a été supprimée.</p>
          <Link href="/dashboard/contact-requests" className={styles['back-button']}>
            Retour à la liste
          </Link>
        </div>
      </section>
    );
  }

  // Si pas de formulaires disponibles
  if (forms.length === 0) {
    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <Link href={`/dashboard/contact-requests/${id}`} className={styles['back-link']}>
            ← Retour
          </Link>
          <h1 className={styles.pageTitle}>Associer un formulaire</h1>
        </div>
        <div className={styles['error-box']}>
          <p>Aucun formulaire actif disponible.</p>
          <p>
            <Link href="/dashboard/forms/new" className={styles['create-button']}>
              Créez un formulaire d'abord
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <Link href={`/dashboard/contact-requests/${id}`} className={styles['back-link']}>
          ← Retour
        </Link>
        <h1 className={styles.pageTitle}>Associer un formulaire</h1>
        <p className={styles.pageSubtitle}>
          Sélectionnez un formulaire pour la demande de {contactRequest?.firstName} {contactRequest?.lastName}
        </p>
      </div>

      {submitStatus && (
        <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
          <p>{submitStatus.message}</p>
          {submitStatus.success && (
            <p className={styles['redirect-message']}>
              Redirection vers la demande...
            </p>
          )}
        </div>
      )}

      <div className={styles.content}>
        {/* Informations de la demande */}
        {contactRequest && (
          <div className={styles['request-info']}>
            <h3 className={styles['info-title']}>Informations de la demande</h3>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Client:</span>
                <span className={styles['info-value']}>{contactRequest.firstName} {contactRequest.lastName}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Email:</span>
                <span className={styles['info-value']}>{contactRequest.email}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Offre:</span>
                <span className={styles['info-value']}>{getPackageLabel(contactRequest.packageType)}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Nuits:</span>
                <span className={styles['info-value']}>{contactRequest.nights}</span>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de sélection */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles['form-group']}>
            <label htmlFor="formId">Sélectionnez un formulaire *</label>
            <select
              id="formId"
              name="formId"
              value={selectedFormId}
              onChange={handleFormSelect}
              className={styles['form-select']}
              required
            >
              <option value="">Sélectionnez un formulaire...</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name}
                  {form.packageType && ` - ${getPackageLabel(form.packageType)}`}
                  {form.description && ` : ${form.description.substring(0, 50)}`}
                </option>
              ))}
            </select>
            <small className={styles['form-hint']}>
              Seuls les formulaires actifs sont affichés
            </small>
          </div>

          <div className={styles['form-actions']}>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFormId}
              className={styles['submit-button']}
            >
              {isSubmitting ? 'Association en cours...' : 'Associer le formulaire'}
            </button>
            <Link href={`/dashboard/contact-requests/${id}`} className={styles['cancel-button']}>
              Annuler
            </Link>
          </div>
        </form>

        {/* Aperçu du formulaire sélectionné */}
        {selectedFormId && (
          <div className={styles['preview-section']}>
            <h3 className={styles['preview-title']}>Aperçu du formulaire sélectionné</h3>
            <div className={styles['preview-content']}>
              {forms.find(f => f.id === selectedFormId)?.description || (
                <p>Aucune description disponible</p>
              )}
              
              {/* Afficher les champs du formulaire */}
              <div className={styles['preview-fields']}>
                <h4>Champs:</h4>
                <p>
                  Le formulaire contient les champs configurés et sera envoyé au client.
                </p>
                <div className={styles['preview-info']}>
                  <p>
                    <strong>Lien pour le client :</strong>
                    <br />
                    <code className={styles['preview-link']}>
                      {typeof window !== 'undefined' ? `${window.location.origin}/custom-form/${contactRequest?.token}` : `/custom-form/${contactRequest?.token}`}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
