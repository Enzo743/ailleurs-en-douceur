import Link from "next/link";
import { Header, Footer, ContactSection, BotanicalDecoration } from "@/components/layout";
import { getSiteContent } from "@/lib/content";
import styles from "./page.module.scss";

export default async function NotFound() {
  const siteContent = await getSiteContent();

  return (
    <main className={styles.articlePage}>
      <Header currentPage="/blog" siteContent={siteContent} />

      {/* Hero Section pour la page 404 */}
      <section className={styles.articleHero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.articleTitle}>Article introuvable</h1>
          <p className={styles.articleExcerpt}>
            Désolé, l'article que vous cherchez n'existe pas ou n'est plus disponible.
          </p>

          <div className={styles.heroDividerContainer}>
            <div className={styles.heroDivider} />
          </div>
        </div>
      </section>

      {/* Section de retour */}
      <section className={styles.articleContent}>
        <div className={styles.container}>
          <div className={styles.richTextContent}>
            <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
              L'article demandé n'a pas été trouvé. Il a peut-être été supprimé ou le lien est incorrect.
            </p>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              <Link 
                href="/blog" 
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#D4A373',
                  color: '#4A3F2F',
                  textDecoration: 'none',
                  borderRadius: '25px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-family-base)',
                  transition: 'all 0.2s ease'
                }}
              >
                Retour au blog
              </Link>
              
              <Link 
                href="/" 
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#D4A373',
                  textDecoration: 'none',
                  border: '2px solid #D4A373',
                  borderRadius: '25px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-family-base)',
                  transition: 'all 0.2s ease'
                }}
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}