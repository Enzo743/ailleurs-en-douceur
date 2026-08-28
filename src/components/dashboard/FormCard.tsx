'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getPackageLabel } from '@/lib/constants';
import { FIELD_TYPE_LABELS } from '@/lib/form-constants';
import StatusBadge from './StatusBadge';
import styles from './form-card.module.scss';

interface FormCardProps {
  form: {
    id: string;
    name: string;
    packageType: string | null;
    description?: string | null;
    isActive: boolean;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      key?: string;
      formId?: string;
      options?: string[];
      order?: number;
      placeholder?: string | null;
      defaultValue?: string | null;
    }>;
    _count: {
      responses: number;
      contactRequests: number;
    };
  };
}

export default function FormCard({ form }: FormCardProps) {
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);

  const handleAction = async (actionType: string, formId: string) => {
    setIsSubmitting(actionType);
    setSubmitStatus(null);
    
    try {
      const url = actionType === 'toggle' 
        ? `/api/dashboard/forms/${formId}/toggle`
        : `/api/dashboard/forms/${formId}`;
      
      const method = actionType === 'toggle' ? 'POST' : 'DELETE';
      const body = actionType === 'delete' 
        ? JSON.stringify({ _method: 'DELETE' })
        : null;
      
      const response = await fetch(url, {
        method: method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body,
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: result.message || 
            (actionType === 'toggle' 
              ? `Formulaire ${form.isActive ? 'désactivé' : 'activé'} avec succès !`
              : 'Formulaire supprimé avec succès !')
        });
        
        // Recharger la page après 1,5 seconde
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || result.message || 'Une erreur est survenue.'
        });
      }
      
    } catch (error: any) {
      console.error('Error:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de compléter l\'action. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles['card-header']}>
        <div className={styles['card-title-row']}>
          <h3 className={styles['card-title']}>{form.name}</h3>
          <StatusBadge status={form.isActive ? 'active' : 'inactive'} type="form" />
        </div>
        <p className={styles['card-package']}>
          {form.packageType ? getPackageLabel(form.packageType) : 'Toutes les offres'}
        </p>
      </div>

      {form.description && (
        <p className={styles['card-description']}>{form.description}</p>
      )}

      <div className={styles['card-fields']}>
        <strong>{form.fields.length} champ(s) :</strong>
        <ul className={styles['fields-list']}>
          {form.fields.slice(0, 5).map((field) => (
            <li key={field.id}>
              {FIELD_TYPE_LABELS[field.type] || field.type}{' '}
              <span className={styles['field-name']}>{field.label}</span>
              {field.required && <span className={styles.required}>*</span>}
            </li>
          ))}
          {form.fields.length > 5 && (
            <li className={styles['more-fields']}>+ {form.fields.length - 5} autre(s)</li>
          )}
        </ul>
      </div>

      <div className={styles['card-stats']}>
        <div className={styles['stat-item']}>
          <span className={styles['stat-count']}>{form._count.responses}</span>
          <span className={styles['stat-label']}>réponse(s)</span>
        </div>
        <div className={styles['stat-item']}>
          <span className={styles['stat-count']}>{form._count.contactRequests}</span>
          <span className={styles['stat-label']}>demande(s)</span>
        </div>
      </div>

      <div className={styles['card-actions']}>
        <Link href={`/dashboard/forms/${form.id}/preview`} className={styles['preview-button']}>
          Prévisualiser
        </Link>
        <Link href={`/dashboard/forms/${form.id}/edit`} className={styles['action-button']}>
          Modifier
        </Link>
        
        {submitStatus && (
          <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
            <p>{submitStatus.message}</p>
          </div>
        )}
        
        <button 
          type="button" 
          onClick={() => handleAction('toggle', form.id)}
          disabled={isSubmitting === 'toggle'}
          className={styles['action-button']}
        >
          {isSubmitting === 'toggle' ? 'Traitement...' : (form.isActive ? 'Désactiver' : 'Activer')}
        </button>
        
        {form._count.responses === 0 && (
          <button 
            type="button" 
            onClick={() => handleAction('delete', form.id)}
            disabled={isSubmitting === 'delete'}
            className={styles['delete-button']}
          >
            {isSubmitting === 'delete' ? 'Suppression...' : 'Supprimer'}
          </button>
        )}
      </div>
    </div>
  );
}