import { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import RichTextDisplay from "@/components/layout/RichTextDisplay";
import styles from "./page.module.scss";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente - Ailleurs en Douceur",
  description: "Conditions générales de vente et d'utilisation du site Ailleurs en Douceur",
};

export default async function CGVPage() {
  const c = await getSiteContent();

  return (
    <div className={styles.legalPage}>
      <Header currentPage="/cgv" siteContent={c} />

      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `url(${c['legal/hero-image'] || c['contact/hero-image']})`,
        }}
      >
        <div className={styles.heroContent}>
          <RichTextDisplay html={c['cgv/hero-title']} className={styles.heroTitle} />
          <RichTextDisplay html={c['cgv/hero-subtitle']} className={styles.heroSubtitle} />
          <div className={styles.heroDivider} />
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <RichTextDisplay html={c['cgv/content']} className={styles.content} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
