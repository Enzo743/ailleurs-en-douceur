import { Metadata } from "next";
import Image from "next/image";
import { Header, Footer, BotanicalDecoration } from "@/components/layout";
import ContactForm from "@/app/contact/ContactForm";
import RichTextDisplay from "@/components/layout/RichTextDisplay";
import styles from "./page.module.scss";
import {getSiteContent} from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact - Ailleurs en Douceur",
  description: "Contactez-nous pour organiser votre voyage sur mesure",
};

export default async function ContactPage() {
  const c = await getSiteContent();

  return (
    <div className={styles.contactPage}>
      <Header currentPage="/contact" />

      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `url(${c['contact/hero-image']})`,
        }}
      >
        <div className={styles.heroContent}>
          <RichTextDisplay html={c['contact/hero-title']} className={styles.heroTitle} />
          <RichTextDisplay html={c['contact/hero-subtitle']} className={styles.heroSubtitle} />
          <div className={styles.heroDivider} />
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentGrid}>
          {/* Left Column - Info Card */}
          <div className={styles.infoColumn}>
            <div className={styles.infoCard}>
              <BotanicalDecoration 
                color={"#D4A373"}
                className={styles.botanicalDecoration}
              />
              <RichTextDisplay html={c['contact/info-card-title']} className={styles.infoCardTitle} />
              <p className={styles.infoCardText}>
                {c['contact/info-card-text']}
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>{c['contact/form-title']}</h2>
              </div>
              <div className={styles.formWrapper}>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CTA Section - Hate de vous lire */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGrid}>
          <div className={styles.ctaTextColumn}>
            <div className={styles.ctaBackground} />
            <div className={styles.ctaDivider} />
            <div className={styles.ctaTextContent}>
              <p className={styles.ctaTextFirst}>
                {c['contact/cta-text-1']}
              </p>
              <p className={styles.ctaTextSecond}>
                {c['contact/cta-text-2']}
              </p>
            </div>
            <BotanicalDecoration 
              type="botanical-21" 
              className={styles.ctaBotanicalDecoration}
            />
          </div>
          <div className={styles.ctaImageColumn}>
            <div className={styles.ctaImageWrapper}>
              <Image
                src={c['contact/cta-image']}
                width={3000}
                height={1800}
                alt="Paysage naturel pour votre prochain voyage"
                className={styles.ctaImage}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
