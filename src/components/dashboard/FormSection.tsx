'use client';

import { useState } from 'react';
import { FormSection as FormSectionType, FormField as FormFieldType } from '@/lib/form-constants';
import styles from './form-section.module.scss';

interface FormSectionProps {
  section: FormSectionType;
  sectionIndex: number;
  allFields: FormFieldType[];
  error?: string;
  onChange: (property: keyof Omit<FormSectionType, 'id' | 'order' | 'fieldIds'>, value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onAssignField: (fieldId: string) => void;
  onUnassignField: (fieldId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showActions: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  renderField?: (field: FormFieldType, sectionId?: string) => React.ReactNode;
  sectionId?: string;
}

export default function FormSection({
  section,
  sectionIndex,
  allFields,
  error,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAssignField,
  onUnassignField,
  canMoveUp,
  canMoveDown,
  showActions,
  expanded,
  onToggleExpand,
  renderField,
  sectionId,
}: FormSectionProps) {
  // Filtrer les champs qui ne sont pas encore assignés à une section
  const unassignedFields = allFields.filter(field => !field.sectionId);
  
  // Champs assignés à cette section
  const assignedFields = allFields.filter(field => field.sectionId === section.id);

  return (
    <div className={`${styles['section-card']} ${expanded ? styles.expanded : ''}`}>
      <div className={styles['section-header']} onClick={onToggleExpand}>
        <div className={styles['section-title-container']}>
          <span className={styles['section-order-indicator']}>{sectionIndex + 1}</span>
          <div>
            <h3 className={styles['section-title']}>
              {section.name || `Section ${sectionIndex + 1}`}
            </h3>
            {section.description && (
              <p className={styles['section-description']}>{section.description}</p>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className={styles['section-actions']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['section-move-buttons']}>
              {canMoveUp && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp();
                  }}
                  title="Monter"
                >
                  ↑
                </button>
              )}
              {canMoveDown && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown();
                  }}
                  title="Descendre"
                >
                  ↓
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={styles['remove-field-from-section']}
              title="Supprimer la section"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className={styles['section-content']}>
          <div className={styles['section-form-group']}>
            <label htmlFor={`section-name-${section.id}`}>Nom de la section *</label>
            <input
              type="text"
              id={`section-name-${section.id}`}
              value={section.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={`Nom de la section ${sectionIndex + 1}`}
            />
          </div>

          <div className={styles['section-form-group']}>
            <label htmlFor={`section-description-${section.id}`}>Description (optionnelle)</label>
            <textarea
              id={`section-description-${section.id}`}
              value={section.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Description de cette section"
            />
          </div>

          {error && (
            <div className={styles['section-error']}>{error}</div>
          )}

          <div className={styles['section-fields-list']}>
            <h4 className={styles['section-fields-title']}>
              Champs dans cette section ({assignedFields.length})
            </h4>
            
            {assignedFields.length === 0 ? (
              <div className={styles['empty-section-message']}>
                Aucune question dans cette section. Ajoutez-en depuis la liste des champs non assignés.
              </div>
            ) : (
              <div className={styles['section-fields-container']}>
                {assignedFields.map((field) => (
                  <div key={field.id} className={styles['section-field-item']}>
                    {renderField ? (
                      <>
                        {renderField(field, sectionId)}
                        {showActions && (
                          <div className={styles['field-actions-in-section']}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnassignField(field.id);
                              }}
                              className={styles['remove-field-from-section']}
                            >
                              Retirer de la section
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className={styles['field-info']}>
                          {field.label} ({field.type})
                        </span>
                        {showActions && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnassignField(field.id);
                            }}
                            className={styles['remove-field-from-section']}
                          >
                            Retirer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
