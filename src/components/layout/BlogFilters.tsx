"use client";

import { useState, useRef, useEffect } from 'react';
import { Tag } from '@prisma/client';
import styles from './BlogFilters.module.scss';

interface BlogFiltersProps {
  allTags: Tag[];
  selectedTags: string[];
  onTagClick: (tagSlug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount: number;
}

export default function BlogFilters({ 
  allTags, 
  selectedTags, 
  onTagClick, 
  searchQuery, 
  onSearchChange,
  resultsCount 
}: BlogFiltersProps) {
  const [showMoreTags, setShowMoreTags] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prendre les 4 premiers tags
  const mainTags = allTags.slice(0, 4);
  const otherTags = allTags.slice(4);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreTags(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleShowMoreTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreTags(!showMoreTags);
  };

  return (
    <div className={styles.blogFilters}>
      <div className={styles.filtersRow}>
        {/* Tags principaux */}
        <div className={styles.tagsContainer}>
          <button 
            className={`${styles.tagButton} ${selectedTags.length === 0 ? styles.active : ''}`}
            onClick={() => onTagClick('')}
            aria-label="Tous les articles"
          >
            Tous les articles
          </button>
          
          {mainTags.map((tag) => (
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

          {/* Bouton Voir plus avec dropdown si il y a d'autres tags */}
          {otherTags.length > 0 && (
            <div className={styles.moreTagsContainer} ref={dropdownRef}>
              <button 
                className={styles.seeMoreButton}
                onClick={handleShowMoreTags}
                aria-label={showMoreTags ? "Voir moins de tags" : "Voir plus de tags"}
                aria-expanded={showMoreTags}
              >
                {showMoreTags ? 'Voir moins' : `+${otherTags.length}`}
              </button>
              
              {showMoreTags && (
                <div className={styles.moreTagsDropdown}>
                  {otherTags.map((tag) => (
                    <button 
                      key={tag.id}
                      className={`${styles.tagButton} ${styles.dropdownTagButton} ${selectedTags.includes(tag.slug) ? styles.active : ''}`}
                      onClick={() => {
                        onTagClick(tag.slug);
                        setShowMoreTags(false);
                      }}
                      aria-label={`Filtrer par ${tag.name}`}
                      aria-pressed={selectedTags.includes(tag.slug)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barre de recherche */}
        <div className={styles.searchContainer}>
          <div className={styles.searchInputContainer}>
            <svg 
              className={styles.searchIcon} 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher un article..."
              className={styles.searchInput}
              aria-label="Rechercher des articles"
            />
            
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => onSearchChange('')}
                className={styles.clearButton}
                aria-label="Effacer la recherche"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Afficher le nombre de résultats */}
      {resultsCount > 0 && (
        <p className={styles.resultsCount}>
          {resultsCount} article{resultsCount > 1 ? 's' : ''} trouvé{resultsCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}