"use client";

import { useState, useMemo } from 'react';
import { Tag, Article } from '@prisma/client';
import BlogFilters from "@/components/layout/BlogFilters";
import Pagination from "@/components/layout/Pagination";
import BlogGrid from "@/components/layout/BlogGrid";
import styles from "./page.module.scss";

interface BlogClientPageProps {
  articles: (Article & { tags: Tag[] })[];
  tags: Tag[];
  itemsPerPage: number;
  totalPages: number;
}

export default function BlogClientPage({ 
  articles, 
  tags, 
  itemsPerPage 
}: BlogClientPageProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Compter le nombre d'articles par tag pour trier par popularité
  const getTagUsageCount = (tagSlug: string): number => {
    return articles.filter(article => 
      article.tags.some(tag => tag.slug === tagSlug)
    ).length;
  };

  // Trier les tags par nombre d'utilisation (les plus utilisés en premier)
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      const countB = getTagUsageCount(b.slug);
      const countA = getTagUsageCount(a.slug);
      return countB - countA; // Tri décroissant
    });
  }, [tags, articles]);

  // Filtrer les articles en fonction des tags sélectionnés et de la recherche
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Filtrer par tags
      const tagMatch = selectedTags.length === 0 || 
        article.tags.some(tag => selectedTags.includes(tag.slug));

      // Filtrer par recherche (titre, contenu, extrait, tags)
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = 
        searchQuery === '' ||
        article.title.toLowerCase().includes(searchLower) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(searchLower)) ||
        (article.content && article.content.toLowerCase().includes(searchLower)) ||
        article.tags.some(tag => tag.name.toLowerCase().includes(searchLower));

      return tagMatch && searchMatch;
    });
  }, [articles, selectedTags, searchQuery]);

  // Calculer la pagination pour les articles filtrés
  const totalPages = useMemo(() => {
    return Math.ceil(filteredArticles.length / itemsPerPage);
  }, [filteredArticles.length, itemsPerPage]);

  // Articles à afficher pour la page courante
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredArticles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredArticles, currentPage, itemsPerPage]);

  // Réinitialiser la page à 1 quand les filtres changent
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleTagClick = (tagSlug: string) => {
    setSelectedTags(prev => {
      if (tagSlug === '') {
        // "Tous les articles" - désélectionner tous les tags
        return [];
      }
      
      if (prev.includes(tagSlug)) {
        // Désélectionner le tag
        return prev.filter(slug => slug !== tagSlug);
      } else {
        // Sélectionner le tag
        return [...prev, tagSlug];
      }
    });
    setCurrentPage(1); // Réinitialiser à la première page
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Réinitialiser à la première page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <BlogFilters
          allTags={sortedTags}
          selectedTags={selectedTags}
          onTagClick={handleTagClick}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          resultsCount={filteredArticles.length}
        />
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <BlogGrid articles={paginatedArticles} />
      ) : (
        <div className={styles.noResults}>
          <p className={styles.noResultsText}>Aucun article ne correspond à vos critères de recherche.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
}