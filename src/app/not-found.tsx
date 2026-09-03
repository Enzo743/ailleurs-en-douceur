import Link from "next/link";
import { Header, Footer, ContactSection, BotanicalDecoration } from "@/components/layout";
import { getSiteContent } from "@/lib/content";
import styles from "./page.module.scss";

export default async function NotFound() {
  const siteContent = await getSiteContent();

  return (
    <main className={styles.notFoundPage}>
      <Header currentPage="/" siteContent={siteContent} />

      {/* Hero Section pour la page 404 */}
      <section className={styles.notFoundHero}>
        <div className={styles.heroOverlay} />
        <div className={styles.notFoundContent}>
          <h1 className={styles.notFoundTitle}>Page introuvable</h1>
          <p className={styles.notFoundSubtitle}>
            Désolé, la page que vous cherchez n'existe pas ou n'est plus disponible.
          </p>
          
          <div className={styles.heroDividerContainer}>
            <div className={styles.heroDivider} />
          </div>
        </div>
      </section>

      {/* Section de retour */}
      <section className={styles.notFoundActions}>
        <div className={styles.container}>
          <div className={styles.notFoundActionsContent}>
            <p className={styles.notFoundMessage}>
              La page demandée n'a pas été trouvée. Elle a peut-être été supprimée ou le lien est incorrect.
            </p>
            
            <div className={styles.notFoundButtons}>
              <Link href="/" className={styles.notFoundButtonPrimary}>
                Retour à l'accueil
              </Link>
              
              <Link href="/contact" className={styles.notFoundButtonSecondary}>
                Nous contacter
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
