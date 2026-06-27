'use client';

import { FormField as FormFieldType } from '@/lib/form-constants';
import styles from './form-field.module.scss';

interface FormFieldProps {
  field: FormFieldType;
  fieldIndex: number;
  error?: string;
  onChange: (property: keyof FormFieldType, value: string | string[] | boolean | number) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  onUpdateOption: (optionIndex: number, newValue: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showActions: boolean;
}

export default function FormField({
  field,
  fieldIndex,
  error,
  onChange,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  showActions,
}: FormFieldProps) {
  const renderInputByType = () => {
    switch (field.type) {
      case 'TEXTAREA':
        return (
          <textarea
            id={`value-${field.id}`}
            value={field.defaultValue || ''}
            onChange={(e) => onChange('defaultValue', e.target.value)}
            placeholder="Valeur par défaut"
            rows={3}
            className={styles.input}
          />
        );
      case 'SELECT':
      case 'MULTISELECT':
        return null; // Géré séparément
      case 'CHECKBOX':
        return null; // Géré séparément
      case 'NUMBER':
      case 'EMAIL':
      case 'DATE':
      case 'TEXT':
      default:
        return (
          <input
            type={field.type.toLowerCase()}
            id={`value-${field.id}`}
            value={field.defaultValue || ''}
            onChange={(e) => onChange('defaultValue', e.target.value)}
            placeholder="Valeur par défaut"
            className={styles.input}
          />
        );
    }
  };

  return (
    <div className={styles.fieldCard}>
      <div className={styles.fieldHeader}>
        <h4 className={styles.fieldTitle}>
          Champ {fieldIndex + 1}
          {field.required && <span className={styles.required}>*</span>}
        </h4>
        {showActions && (
          <div className={styles.fieldActions}>
            {canMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className={styles.moveButton}
                title="Monter"
              >
                ↑
              </button>
            )}
            {canMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className={styles.moveButton}
                title="Descendre"
              >
                ↓
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className={styles.removeButton}
              title="Supprimer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className={styles.fieldGrid}>
        <div className={`${styles.formGroup} ${error?.includes('-label') ? styles.hasError : ''}`}>
          <label htmlFor={`label-${field.id}`}>Libellé *</label>
          <input
            type="text"
            id={`label-${field.id}`}
            value={field.label}
            onChange={(e) => onChange('label', e.target.value)}
            placeholder="Ex: Quelle est votre date préférée ?"
            className={styles.input}
          />
          {error?.includes('-label') && <span className={styles.errorMessage}>{error}</span>}
        </div>

        <div className={`${styles.formGroup} ${error?.includes('-key') ? styles.hasError : ''}`}>
          <label htmlFor={`key-${field.id}`}>Clé * (identifiant unique)</label>
          <input
            type="text"
            id={`key-${field.id}`}
            value={field.key}
            onChange={(e) => onChange('key', e.target.value)}
            placeholder="Ex: preferred-date"
            className={styles.input}
          />
          {error?.includes('-key') && <span className={styles.errorMessage}>{error}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor={`type-${field.id}`}>Type de champ *</label>
          <select
            id={`type-${field.id}`}
            value={field.type}
            onChange={(e) => onChange('type', e.target.value as FormFieldType['type'])}
            className={styles.input}
          >
            <option value="TEXT">Texte court</option>
            <option value="TEXTAREA">Texte long</option>
            <option value="NUMBER">Nombre</option>
            <option value="EMAIL">Email</option>
            <option value="SELECT">Sélection unique</option>
            <option value="MULTISELECT">Sélection multiple</option>
            <option value="CHECKBOX">Case à cocher</option>
            <option value="DATE">Date</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor={`required-${field.id}`}>
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.required}
              onChange={(e) => onChange('required', e.target.checked)}
              className={styles.checkbox}
            />
            Champ obligatoire
          </label>
        </div>
      </div>

      {/* Options pour SELECT et MULTISELECT */}
      {(field.type === 'SELECT' || field.type === 'MULTISELECT') && (
        <div className={styles.optionsSection}>
          <label>Options</label>
          {field.options.map((option, optIndex) => (
            <div key={optIndex} className={styles.optionRow}>
              <input
                type="text"
                value={option}
                onChange={(e) => onUpdateOption(optIndex, e.target.value)}
                placeholder={`Option ${optIndex + 1}`}
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => onRemoveOption(optIndex)}
                className={styles.removeOptionButton}
              >
                ×
              </button>
            </div>
          ))}
          {error?.includes('-options') && (
            <span className={styles.errorMessage}>{error}</span>
          )}
          <button type="button" onClick={onAddOption} className={styles.addOptionButton}>
            + Ajouter une option
          </button>
        </div>
      )}

      {/* Placeholder pour TEXT */}
      {field.type === 'TEXT' && (
        <div className={styles.formGroup}>
          <label htmlFor={`placeholder-${field.id}`}>Placeholder (optionnel)</label>
          <input
            type="text"
            id={`placeholder-${field.id}`}
            value={field.placeholder || ''}
            onChange={(e) => onChange('placeholder', e.target.value)}
            placeholder="Texte d'aide"
            className={styles.input}
          />
        </div>
      )}

      {/* Valeur par défaut (sauf pour CHECKBOX, SELECT, MULTISELECT) */}
      {field.type !== 'CHECKBOX' && field.type !== 'SELECT' && field.type !== 'MULTISELECT' && (
        <div className={styles.formGroup}>
          <label htmlFor={`defaultValue-${field.id}`}>Valeur par défaut (optionnelle)</label>
          {renderInputByType()}
        </div>
      )}
    </div>
  );
}
