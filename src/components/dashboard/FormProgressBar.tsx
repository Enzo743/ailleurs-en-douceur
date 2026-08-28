'use client';

import { FormSection } from '@/lib/form-constants';
import styles from './FormProgressBar.module.scss';

interface FormProgressBarProps {
  sections: FormSection[];
  currentSectionIndex: number;
  onSectionChange: (index: number) => void;
}

export default function FormProgressBar({
  sections,
  currentSectionIndex,
  onSectionChange,
}: FormProgressBarProps) {
  const progressPercentage = ((currentSectionIndex + 1) / sections.length) * 100;

  return (
    <div className={styles['progress-container']}>
      <div className={styles['progress-bar-container']}>
        <div 
          className={styles['progress-bar']} 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className={styles['progress-indicators']}>
        {sections.map((section, index) => {
          const isActive = index === currentSectionIndex;
          const isCompleted = index < currentSectionIndex;
          
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(index)}
              className={`${styles['progress-indicator']} $
                ${isActive ? styles.active : ''} $
                ${isCompleted ? styles.completed : ''}
              `}
              title={section.name}
              disabled={index > currentSectionIndex + 1}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      
      <div className={styles['section-info']}>
        <span className={styles['current-section']}>
          {sections[currentSectionIndex]?.name || `Section ${currentSectionIndex + 1}`}
        </span>
        <span className={styles['section-counter']}>
          {currentSectionIndex + 1} / {sections.length}
        </span>
      </div>
    </div>
  );
}
