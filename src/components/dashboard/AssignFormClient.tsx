'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/dashboard/contact-requests/[id]/page.module.scss';

interface Form {
  id: string;
  name: string;
  packageType: string | null;
}

interface AssignFormClientProps {
  contactRequestId: string;
  availableForms: Form[];
}

export default function AssignFormClient({ contactRequestId, availableForms }: AssignFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const formId = formData.get('formId') as string;
    
    if (!formId) {
      setSubmitStatus({
        success: false,
        message: 'Veuillez sélectionner un formulaire.'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch(`/api/dashboard/contact-requests/${contactRequestId}/assign-form`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: result.message || 'Formulaire associé avec succès !'
        });
        
        // Recharger la page après 1,5 seconde pour afficher le formulaire associé
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
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

  return (
    <div className={styles['assign-form-section']}>
      <h4>Associer un formulaire:</h4>
      
      {submitStatus && (
        <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
          <p>{submitStatus.message}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <select
          name="formId"
          required
          className={styles['form-select']}
          disabled={isSubmitting}
        >
          <option value="">Sélectionnez un formulaire...</option>
          {availableForms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.name} {form.packageType && ` - ${form.packageType}`}
            </option>
          ))}
        </select>
        <button type="submit" className={styles['assign-button']} disabled={isSubmitting}>
          {isSubmitting ? 'Association en cours...' : 'Assigner le formulaire'}
        </button>
      </form>
    </div>
  );
}
