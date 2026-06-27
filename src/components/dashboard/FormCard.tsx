import Link from 'next/link';
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
        <Link href={`/dashboard/forms/${form.id}/edit`} className={styles['action-button']}>
          Modifier
        </Link>
        <form action={`/api/dashboard/forms/${form.id}/toggle`} method="POST">
          <button type="submit" className={styles['action-button']}>
            {form.isActive ? 'Désactiver' : 'Activer'}
          </button>
        </form>
        {form._count.responses === 0 && (
          <form action={`/api/dashboard/forms/${form.id}`} method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit" className={styles['delete-button']}>
              Supprimer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}