"use client";

import { Tag } from '@prisma/client';
import styles from './TagFilter.module.scss';

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagClick: (tagSlug: string) => void;
}

export default function TagFilter({ tags, selectedTags, onTagClick }: TagFilterProps) {
  return (
    <div className={styles.tagFilter}>
      <button 
        className={`${styles.tagButton} ${selectedTags.length === 0 ? styles.active : ''}`}
        onClick={() => onTagClick('')}
        aria-label="Tous les articles"
      >
        Tous les articles
      </button>
      
      {tags.map((tag) => (
        <button 
          key={tag.id}
          className={`${styles.tagButton} ${selectedTags.includes(tag.slug) ? styles.active : ''}`}
          onClick={() => onTagClick(tag.slug)}
          aria-label={`Filtrer par ${tag.name}`}
          aria-pressed={selectedTags.includes(tag.slug)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}