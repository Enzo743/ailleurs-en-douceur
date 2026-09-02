import Link from "next/link";
import Image from "next/image";
import { calculateReadingTime, formatDateFr } from "@/lib/utils";
import { ArticleWithTags } from "@/app/actions/articles";
import styles from './BlogGrid.module.scss';

interface BlogGridProps {
  articles: ArticleWithTags[];
  itemsPerPage?: number;
}

export default function BlogGrid({ articles, itemsPerPage = 6 }: BlogGridProps) {
  // Si on veut limiter le nombre d'articles affichés
  const articlesToDisplay = itemsPerPage ? articles.slice(0, itemsPerPage) : articles;

  if (articlesToDisplay.length === 0) {
    return (
      <div className={styles.noArticles}>
        <p className={styles.noArticlesText}>Aucun article trouvé.</p>
      </div>
    );
  }

  return (
    <div className={styles.blogGrid}>
      {articlesToDisplay.map((article) => {
        const formattedDate = formatDateFr(article.publishedAt || article.updatedAt);
        const readingTime = calculateReadingTime(article.content || article.excerpt || '');
        const readingTimeText = readingTime > 0 ? `${readingTime} min de lecture` : "";

        return (
          <article key={article.id} className={styles.card}>
            <div className={styles.cardImageContainer}>
              {article.coverImage ? (
                <div className={styles.imageWrapper}>
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className={styles.cardImage}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className={styles.imageWrapper}>
                  <Image
                    src="/images/image-placeholder-1.jpg"
                    alt="Placeholder"
                    fill
                    className={styles.cardImage}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardMeta}>
                {formattedDate && (
                  <span className={styles.cardDate}>{formattedDate}</span>
                )}
                {formattedDate && readingTimeText && (
                  <span className={styles.cardMetaSeparator}>-</span>
                )}
                {readingTimeText && (
                  <span className={styles.cardReadingTime}>{readingTimeText}</span>
                )}
              </div>
              
              <h3 className={styles.cardTitle}>
                <Link href={`/blog/${article.slug}`} className={styles.cardLink}>
                  {article.title}
                </Link>
              </h3>
              
              {article.excerpt && (
                <p className={styles.cardExcerpt}>{article.excerpt}</p>
              )}
              
              {article.tags && article.tags.length > 0 && (
                <div className={styles.cardTags}>
                  {article.tags.map((tag) => (
                    <span key={tag.id} className={styles.cardTag}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              
              <Link href={`/blog/${article.slug}`} className={styles.readMoreLink}>
                Lire l&apos;article
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}