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

// Types de formule
const packageTypes = [
  { value: 'escapade-en-douceur', label: 'Escapade en douceur' },
  { value: 'voyage-sur-mesure', label: 'Voyage sur-mesure' },
  { value: 'voyage-de-noces', label: 'Voyage de noces' },
];

// Statuts
const statuses = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'FORM_SENT', label: 'Formulaire envoyé' },
  { value: 'COMPLETED', label: 'Terminé' },
];

export default function EditContactRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [contactRequest, setContactRequest] = useState<ContactRequest | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    packageType: '',
    nights: 0,
    message: '',
    status: '',
  });
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
        const response = await fetch(`/api/contact-requests?search=${id}`);
        const data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
          setNotFound(true);
          return;
        }
        
        const cr: ContactRequest = data.data[0];
        setContactRequest(cr);
        setFormData({
          firstName: cr.firstName,
          lastName: cr.lastName,
          email: cr.email,
          packageType: cr.packageType,
          nights: cr.nights,
          message: cr.message,
          status: cr.status,
        });
        
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch(`/api/contact-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: 'Demande de contact mise à jour avec succès !'
        });
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push(`/dashboard/contact-requests/${id}`);
        }, 2000);
        
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la mise à jour.'
        });
      }
      
    } catch (error: any) {
      console.error('Error updating contact request:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de mettre à jour la demande. Veuillez vérifier votre connexion.'
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
          <h1 className={styles.pageTitle}>Modifier la demande</h1>
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

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <Link href={`/dashboard/contact-requests/${id}`} className={styles['back-link']}>
          ← Retour
        </Link>
        <h1 className={styles.pageTitle}>Modifier la demande</h1>
        <p className={styles.pageSubtitle}>
          Modifiez les informations de la demande de {contactRequest?.firstName} {contactRequest?.lastName}
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

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles['form-section']}>
          <h2 className={styles['section-title']}>Informations du client</h2>
          
          <div className={styles['form-grid']}>
            <div className={styles['form-group']}>
              <label htmlFor="firstName">Prénom *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Prénom du client"
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="lastName">Nom *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Nom du client"
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@domaine.com"
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="packageType">Type d'offre *</label>
              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                required
              >
                {packageTypes.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="nights">Nombre de nuits *</label>
              <input
                type="number"
                id="nights"
                name="nights"
                value={formData.nights}
                onChange={handleChange}
                required
                min="1"
                placeholder="1"
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="status">Statut *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message du client"
              rows={5}
            />
          </div>
        </div>

        <div className={styles['form-actions']}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles['submit-button']}
          >
            {isSubmitting ? 'Mise à jour en cours...' : 'Mettre à jour la demande'}
          </button>
          <Link href={`/dashboard/contact-requests/${id}`} className={styles['cancel-button']}>
            Annuler
          </Link>
        </div>
      </form>

      {/* Informations supplémentaires */}
      {contactRequest && (
        <div className={styles['additional-info']}>
          <h2 className={styles['section-title']}>Informations supplémentaires</h2>
          <div className={styles['info-grid']}>
            <div className={styles['info-item']}>
              <span className={styles['info-label']}>ID:</span>
              <span className={styles['info-value']}>{contactRequest.id}</span>
            </div>
            <div className={styles['info-item']}>
              <span className={styles['info-label']}>Token:</span>
              <span className={styles['info-value']}>
                <code className={styles.token}>{contactRequest.token}</code>
              </span>
            </div>
          </div>
          
          <div className={styles['info-note']}>
            <p>
              <strong>Note:</strong> Le token permet d'accéder au formulaire personnalisé et au planning pour ce client.
            </p>
            <p>
              <strong>Liens:</strong>
              <br />
              <a
                href={`/custom-form/${contactRequest.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['info-link']}
              >
                Lien formulaire: /custom-form/{contactRequest.token}
              </a>
              <br />
              <a
                href={`/schedule/${contactRequest.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['info-link']}
              >
                Lien planning: /schedule/{contactRequest.token}
              </a>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
