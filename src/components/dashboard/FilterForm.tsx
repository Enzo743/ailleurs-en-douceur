'use client';

import { useRouter } from 'next/navigation';
import styles from './filter-form.module.scss';

interface FilterField {
  type: 'text' | 'select';
  name: string;
  label: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterFormProps {
  fields: FilterField[];
  basePath: string;
}

export default function FilterForm({ fields, basePath }: FilterFormProps) {
  const router = useRouter();

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(basePath);
  };

  return (
    <div className={styles.filters}>
      <form action={basePath} method="get" className={styles['filter-form']}>
        {fields.map((field) => (
          <div key={field.name} className={styles['filter-group']}>
            <label htmlFor={field.name}>{field.label}:</label>
            {field.type === 'select' ? (
              <select id={field.name} name={field.name} defaultValue="">
                <option value="">Toutes les options</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        <button type="submit" className={styles['filter-button']}>
          Filtrer
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={styles['filter-button']}
        >
          Réinitialiser
        </button>
      </form>
    </div>
  );
}
