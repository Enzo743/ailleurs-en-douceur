'use client';

import Link from 'next/link';
import styles from './pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Fonction pour construire l'URL avec les params de recherche
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    
    // Ajouter les paramètres de recherche existants (en excluant 'page')
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== 'page' && value && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    }
    
    // Ajouter le paramètre de page
    params.set('page', page.toString());
    
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className={styles.pagination}>
      <div className={styles['pagination-info']}>
        Page {currentPage} sur {totalPages}
      </div>
      <div className={styles['pagination-controls']}>
        {currentPage > 1 && (
          <Link href={buildUrl(currentPage - 1)} className={styles['pagination-button']}>
            Précédente
          </Link>
        )}
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, currentPage - 2) + i;
          if (pageNum > totalPages) return null;
          return (
            <Link
              key={pageNum}
              href={buildUrl(pageNum)}
              className={`${styles['pagination-button']} ${pageNum === currentPage ? styles['active'] : ''}`}
            >
              {pageNum}
            </Link>
          );
        })}
        
        {currentPage < totalPages && (
          <Link href={buildUrl(currentPage + 1)} className={styles['pagination-button']}>
            Suivante
          </Link>
        )}
      </div>
    </div>
  );
}
