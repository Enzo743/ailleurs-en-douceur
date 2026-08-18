'use client';

import { useState, FormEvent } from 'react';
import styles from '@/app/dashboard/contact-requests/[id]/page.module.scss';

interface ActionFormClientProps {
  actionUrl: string;
  method?: 'POST' | 'DELETE' | 'PATCH';
  hiddenInputs?: Record<string, string>;
  submitText: string;
  successMessage: string;
  errorMessage?: string;
  reloadOnSuccess?: boolean;
  redirectOnSuccess?: string;
  className?: string;
}

export default function ActionFormClient({
  actionUrl,
  method = 'POST',
  hiddenInputs = {},
  submitText,
  successMessage,
  errorMessage = 'Une erreur est survenue.',
  reloadOnSuccess = false,
  redirectOnSuccess,
  className,
}: ActionFormClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Ajouter les inputs cachés
      Object.entries(hiddenInputs).forEach(([name, value]) => {
        formData.append(name, value);
      });
      
      const response = await fetch(actionUrl, {
        method: method,
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: result.message || successMessage
        });
        
        // Gérer le rechargement ou la redirection après succès
        setTimeout(() => {
          if (reloadOnSuccess) {
            window.location.reload();
          } else if (redirectOnSuccess) {
            window.location.href = redirectOnSuccess;
          }
        }, 1500);
        
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || result.message || errorMessage
        });
      }
      
    } catch (error: any) {
      console.error('Error submitting action:', error);
      setSubmitStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        {Object.entries(hiddenInputs).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button 
          type="submit" 
          className={styles['action-button']}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Traitement en cours...' : submitText}
        </button>
      </form>
      
      {submitStatus && (
        <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
          <p>{submitStatus.message}</p>
        </div>
      )}
    </div>
  );
}
