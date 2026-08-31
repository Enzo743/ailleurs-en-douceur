import { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import RichTextDisplay from "@/components/layout/RichTextDisplay";
import styles from "./page.module.scss";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Politique de Confidentialité - Ailleurs en Douceur",
  description: "Politique de confidentialité et gestion des données personnelles",
};

export default async function PrivacyPage() {
  const c = await getSiteContent();

  return (
    <div className={styles.legalPage}>
      <Header currentPage="/privacy" siteContent={c} />

      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `url(${c['legal/hero-image'] || c['contact/hero-image']})`,
        }}
      >
        <div className={styles.heroContent}>
          <RichTextDisplay html={c['privacy/hero-title']} className={styles.heroTitle} />
          <RichTextDisplay html={c['privacy/hero-subtitle']} className={styles.heroSubtitle} />
          <div className={styles.heroDivider} />
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <RichTextDisplay html={c['privacy/content']} className={styles.content} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
