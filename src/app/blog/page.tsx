import { Metadata } from "next";
import { Header, Footer, ContactSection, BotanicalDecoration } from "@/components/layout";
import { getArticles, getAllTags, ArticleWithTags } from "@/app/actions/articles";
import { getSiteContent } from "@/lib/content";
import BlogClientPage from "./BlogClientPage";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Blog Inspirations - Ailleurs en Douceur",
  description: "Des idées, des récits et des conseils pour voyager autrement. Découvrez nos articles inspirants sur le slow travel, les voyages en train et bien plus.",
};

const ITEMS_PER_PAGE = 4;

export default async function BlogPage() {
  const c = await getSiteContent();
  const [articles, tags] = await Promise.all([
    getArticles(),
    getAllTags(),
  ]);

  // Filtrer uniquement les articles publiés et trier par date de publication (plus récent en premier)
  const publishedArticles = articles
    .filter(a => a.published)
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(publishedArticles.length / ITEMS_PER_PAGE);

  return (
    <main className={styles.blogPage}>
      <Header currentPage="/blog" siteContent={c} />

      {/* Hero Section - Style similaire à la page offers */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `url(${c['blog/hero-image'] || '/images/image-placeholder-1.jpg'})`,
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{c['blog/title'] || 'Blog inspirations'}</h1>
          <p className={styles.heroSubtitle}>{c['blog/subtitle'] || 'Des idées, des récits et des conseils pour voyager autrement.'}</p>
          <div className={styles.heroDivider} />
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.mainContent}>
        <div className={styles.container}>
          <BlogClientPage 
            articles={publishedArticles} 
            tags={tags} 
            itemsPerPage={ITEMS_PER_PAGE}
            totalPages={totalPages}
          />
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}