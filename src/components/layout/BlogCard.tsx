import Link from "next/link";
import Image from "next/image";
import { calculateReadingTime, formatDateFr } from "@/lib/utils";
import styles from "./blogcard.module.scss";

interface BlogCardProps {
  title: string;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  publishedAt?: Date | null;
  content?: string | null;
}

export default function BlogCard({
  title,
  excerpt,
  slug,
  coverImage,
  publishedAt,
  content,
}: BlogCardProps) {
  const formattedDate = formatDateFr(publishedAt);
  
  // Calculer le temps de lecture à partir du contenu (100 caractères = 1 minute)
  const readingTime = calculateReadingTime(content || excerpt || '');
  const readingTimeText = readingTime > 0 ? `${readingTime} min de lecture` : "";

  return (
    <article className={styles.card}>
      <div className={styles.cardImageContainer}>
        {coverImage ? (
          <div className={styles.imageWrapper}>
            <Image
              src={coverImage}
              alt={title}
              fill
              className={styles.cardImage}
              sizes="(max-width: 768px) 100vw, 33vw"
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
            />
          </div>
        )}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          <Link href={`/blog/${slug}`} className={styles.cardLink}>
            {title}
          </Link>
        </h3>
        {(publishedAt || readingTime) && (
          <p className={styles.cardMeta}>
            {formattedDate}
            {formattedDate && readingTimeText && "  -  "}
            {readingTimeText}
          </p>
        )}
      </div>
    </article>
  );
}
