"use client";

import { useState, useEffect } from 'react';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ searchQuery, onSearchChange, placeholder = "Rechercher..." }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Synchroniser avec la prop searchQuery
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    onSearchChange(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localQuery);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit} role="search">
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
          value={localQuery}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.searchInput}
          aria-label="Rechercher des articles"
        />
        
        {localQuery && (
          <button 
            type="button" 
            onClick={handleClear}
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
    </form>
  );
}