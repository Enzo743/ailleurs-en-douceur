import { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import RichTextDisplay from "@/components/layout/RichTextDisplay";
import styles from "./page.module.scss";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Mentions Légales - Ailleurs en Douceur",
  description: "Mentions légales et informations légales du site Ailleurs en Douceur",
};

export default async function LegalPage() {
  const c = await getSiteContent();

  return (
    <div className={styles.legalPage}>
      <Header currentPage="/legal" siteContent={c} />

      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `url(${c['legal/hero-image'] || c['contact/hero-image']})`,
        }}
      >
        <div className={styles.heroContent}>
          <RichTextDisplay html={c['legal/hero-title']} className={styles.heroTitle} />
          <RichTextDisplay html={c['legal/hero-subtitle']} className={styles.heroSubtitle} />
          <div className={styles.heroDivider} />
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <RichTextDisplay html={c['legal/content']} className={styles.content} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
