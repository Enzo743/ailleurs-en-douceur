import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer, ContactSection, RichTextDisplay, BlogCard, BotanicalDecoration } from "@/components/layout";
import { PrismaClient } from "@prisma/client";
import { getSiteContent } from "@/lib/content";
import { calculateReadingTime, formatDateFr } from "@/lib/utils";
import styles from "./page.module.scss";
import type { Article, Tag } from '@prisma/client';

type ArticleWithTags = Article & { tags: Tag[] };

// Créer une instance Prisma locale pour éviter les problèmes avec Turbopack
const prisma = new PrismaClient();

// Fonctions locales pour éviter les problèmes d'import avec Turbopack
async function getArticleBySlug(slug: string | undefined): Promise<ArticleWithTags | null> {
  if (!slug) {
    return null;
  }
  
  return prisma.article.findUnique({
    where: { slug },
    include: { tags: true },
  });
}

async function getAllArticles(): Promise<ArticleWithTags[]> {
  return prisma.article.findMany({
    include: { tags: true },
    orderBy: { updatedAt: 'desc' },
  });
}

// Métadonnées SEO statiques pour éviter les problèmes avec Prisma dans generateMetadata
// Note: Pour des métadonnées dynamiques, il faudrait utiliser une approche différente
// ou s'assurer que Prisma est correctement initialisé dans le contexte des Server Components
export const metadata: Metadata = {
  title: "Article - Ailleurs en Douceur",
  description: "Lisez nos articles inspirants sur le slow travel et les voyages en train.",
};

// Note: La génération statique est désactivée pour éviter les erreurs de build
// en développement. Pour activer la génération statique en production,
// décommentez la fonction ci-dessous et assurez-vous que tous les articles
// référencés existent dans la base de données.
// 
// export async function generateStaticParams() {
//   try {
//     const articles = await getAllArticles();
//     
//     // Retourner uniquement les articles publiés avec leur slug
//     const publishedArticles = articles
//       .filter(article => article.published && article.slug)
//       .map(article => ({
//         slug: article.slug,
//       }));
//     
//     return publishedArticles;
//   } catch (error) {
//     console.error("Erreur lors de la génération des paramètres statiques:", error);
//     return [];
//   }
// }

// Fonction pour détecter les listes numérotées dans le contenu HTML
function detectNumberedLists(html: string): boolean {
  // Vérifier la présence de balises <ol> ou de listes avec des numéros
  return /<ol[^>]*>/i.test(html) || 
         /<li[^>]*>\s*[0-9]+[\.)\s]/i.test(html);
}

// Fonction pour extraire le sommaire depuis le contenu HTML
function extractTableOfContents(html: string): Array<{text: string, level: number, id: string}> {
  const items: Array<{text: string, level: number, id: string}> = [];
  
  // Extraire les titres (h2, h3, etc.) avec leurs IDs
  const titleMatches = html.matchAll(/<(h[2-6])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/gi);
  for (const match of titleMatches) {
    const level = parseInt(match[1].substring(1));
    const id = match[2] || '';
    const text = match[3].replace(/<[^>]*>/g, '').trim();
    if (text && id) {
      items.push({ text, level, id });
    }
  }
  
  // Si pas d'IDs, essayer sans
  if (items.length === 0) {
    const titleMatchesNoId = html.matchAll(/<(h[2-6])[^>]*>([\s\S]*?)<\/\1>/gi);
    for (const match of titleMatchesNoId) {
      const level = parseInt(match[1].substring(1));
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      if (text) {
        // Générer un ID à partir du texte
        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        items.push({ text, level, id });
      }
    }
  }
  
  // Extraire les éléments de liste numérotée
  const listMatches = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  let listIndex = 1;
  for (const match of listMatches) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text && /^[0-9]+[\.)\s]/.test(text)) {
      const cleanText = text.replace(/^[0-9]+[\.)\s]/, '').trim();
      const id = `list-item-${listIndex++}`;
      items.push({ text: cleanText, level: 1, id });
    }
  }
  
  return items;
}

// Fonction pour trouver les articles liés par tags
function getRelatedArticles(currentArticle: ArticleWithTags, allArticles: ArticleWithTags[]): ArticleWithTags[] {
  const currentTagIds = currentArticle.tags.map(tag => tag.id);
  
  return allArticles
    .filter(article => 
      article.published && 
      article.id !== currentArticle.id &&
      article.tags.some(tag => currentTagIds.includes(tag.id))
    )
    .sort((a, b) => {
      // Trier par nombre de tags communs (descendant), puis par date
      const aCommonTags = a.tags.filter(tag => currentTagIds.includes(tag.id)).length;
      const bCommonTags = b.tags.filter(tag => currentTagIds.includes(tag.id)).length;
      return bCommonTags - aCommonTags || 
             (new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime());
    })
    .slice(0, 3); // Limiter à 3 articles
}

// Composant pour afficher le sommaire
function TableOfContents({ items }: { items: Array<{text: string, level: number, id: string}> }) {
  if (items.length === 0) return null;

  return (
    <section className={styles.tableOfContents}>
      <div className={styles.container}>
        <h2 className={styles.tocTitle}>Sommaire</h2>
        <nav className={styles.tocNav}>
          <ul className={styles.tocList}>
            {items.map((item, index) => (
              <li key={`${item.id}-${index}`} className={styles[`tocItemLevel${item.level}`]}>
                <a href={`#${item.id}`} className={styles.tocLink}>
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

// Composant pour la section "À lire aussi"
function RelatedArticles({ articles }: { articles: ArticleWithTags[] }) {
  if (articles.length === 0) return null;

  return (
    <section className={styles.relatedArticles}>
      <div className={styles.container}>
        <h2 className={styles.relatedTitle}>À lire aussi</h2>
        <div className={styles.relatedGrid}>
          {articles.map((article) => (
            <BlogCard
              key={article.id}
              title={article.title}
              excerpt={article.excerpt || undefined}
              slug={article.slug}
              coverImage={article.coverImage || undefined}
              publishedAt={article.publishedAt || undefined}
              content={article.content}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Composant Hero pour l'article
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  // Dans Next.js 16, params est une Promise et doit être déballée
  const resolvedParams = await params;
  
  // Vérifier que le slug existe avant de faire les appels
  if (!resolvedParams.slug) {
    notFound();
  }

  const [article, allArticles, siteContent] = await Promise.all([
    getArticleBySlug(resolvedParams.slug),
    getAllArticles(),
    getSiteContent()
  ]);

  if (!article || !article.published) {
    notFound();
  }

  // Trouver les articles liés (mêmes tags, publiés, différents de l'article courant)
  const relatedArticles = getRelatedArticles(article, allArticles);

  // Détecter si l'article contient des listes numérotées
  const hasNumberedLists = detectNumberedLists(article.content);
  
  // Extraire le sommaire si nécessaire
  const tableOfContentsItems = hasNumberedLists ? extractTableOfContents(article.content) : [];

  // Calculer le temps de lecture
  const readingTime = calculateReadingTime(article.content);
  const readingTimeText = readingTime > 0 ? `${readingTime} min de lecture` : "";
  const formattedDate = formatDateFr(article.publishedAt);

  return (
    <main className={styles.articlePage}>
      <Header currentPage="/blog" siteContent={siteContent} />

      {/* Hero Section avec image de couverture */}
      <section 
        className={styles.articleHero}
        style={article.coverImage ? {
          backgroundImage: `url(${article.coverImage})`,
        } : {}}
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.articleMeta}>
            {formattedDate && <span className={styles.metaDate}>{formattedDate}</span>}
            {formattedDate && readingTimeText && <span className={styles.metaSeparator}> - </span>}
            {readingTimeText && <span className={styles.metaReadingTime}>{readingTimeText}</span>}
          </div>
          <h1 className={styles.articleTitle}>{article.title}</h1>
          {article.excerpt && <p className={styles.articleExcerpt}>{article.excerpt}</p>}
          
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className={styles.articleTags}>
              {article.tags.map((tag) => (
                <span key={tag.id} className={styles.tag}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className={styles.heroDividerContainer}>
            <div className={styles.heroDivider} />
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <article className={styles.articleContent}>
        <div className={styles.container}>
          <RichTextDisplay html={article.content} className={styles.richTextContent} />
        </div>
      </article>

      {/* Sommaire - conditionnel */}
      {hasNumberedLists && tableOfContentsItems.length > 0 && (
        <TableOfContents items={tableOfContentsItems} />
      )}

      {/* À lire aussi - conditionnel */}
      {relatedArticles.length > 0 && (
        <RelatedArticles articles={relatedArticles} />
      )}

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}