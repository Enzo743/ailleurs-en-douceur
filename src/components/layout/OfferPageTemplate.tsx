import Image from "next/image";
import { Header, Footer, BotanicalDecoration, ContactSection } from "./index";
import styles from "./offerpagetemplate.module.scss";

interface Formula {
  title: string;
  duration?: string;
  description?: string;
  price: string;
}

interface Menu {
  title: string;
  description: string;
}

interface OfferPageProps {
  content: {
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    forWhoTitle: string;
    forWhoBaseTitle?: string;
    forWhoPerimeterTitle?: string;
    forWhoDescription: string;
    forWhoLocation: string;
    forWhoImage: string;
    includedTitle?: string;
    includedItems?: string[];
    formulasTitle: string;
    formulas: Formula[];
    menusTitle?: string;
    menus?: Menu[];
    optionsTitle?: string;
    options?: string[];
    asteriskNote?: string;
  };
  currentPage?: string;
  siteContent: any;
}

export default function OfferPageTemplate({ content, currentPage, siteContent }: OfferPageProps) {
  return (
    <div className={styles.offerPage}>
      {/* Header */}
      <Header currentPage={currentPage} siteContent={siteContent} />

      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `url(${content.heroImage})`,
        }}
      >
        <div className={styles.heroContent}>
          <p className={styles.heroTagline}>{content.heroTagline}</p>
          <h1 className={styles.heroTitle}>{content.heroTitle}</h1>
          <p className={styles.heroSubtitle}>{content.heroSubtitle}</p>
          <div className={styles.heroDivider} />
        </div>
      </section>

      {/* Pour qui ? Section */}
      <section className={styles.forWhoSection}>
        <div className={styles.container}>
          <div className={styles.forWhoContent}>
            <div className={styles.forWhoImageContainer}>
              <Image 
                src={content.forWhoImage} 
                alt="Pour qui" 
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className={styles.forWhoImage}
              />
            </div>
            <div className={styles.forWhoTextContent}>
              <h2 className={styles.forWhoTitle}>{content.forWhoTitle}</h2>
              <p className={styles.forWhoDescription}>{content.forWhoDescription}</p>
              {content.forWhoBaseTitle && (
                  <h3 className={styles.forWhoSubtitle}>{content.forWhoBaseTitle}</h3>
              )}
              {content.forWhoPerimeterTitle && (
                  <h3 className={styles.forWhoSubtitle}>{content.forWhoPerimeterTitle}</h3>
              )}
              <p className={styles.forWhoLocation}>{content.forWhoLocation}</p>
            </div>
          </div>
          <div className={styles.forWhoDividerContainer}>
            <div className={styles.forWhoDivider} />
            <BotanicalDecoration type="botanical-16" className={styles.botanicalDecoration1} />
          </div>
        </div>
      </section>

      {/* Ce qui est inclus Section */}
      {content.includedTitle && content.includedItems && content.includedItems.length > 0 && (
        <section className={styles.includedSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{content.includedTitle}</h2>
            <div className={styles.includedGrid}>
              <div className={styles.includedLeft}>
                {content.includedItems.slice(0, 2).map((item, index) => (
                  <div key={index} className={styles.includedItem}>
                    <div className={styles.checkIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13L9 17L19 7" stroke="#B2AC88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className={styles.includedText}>{item}</p>
                  </div>
                ))}
              </div>
              <div className={styles.includedRight}>
                {content.includedItems.slice(2, 4).map((item, index) => (
                  <div key={index} className={styles.includedItem}>
                    <div className={styles.checkIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13L9 17L19 7" stroke="#B2AC88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className={styles.includedText}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Menus Section (pour L'Impulsion Douce) */}
      {content.menusTitle && content.menus && content.menus.length > 0 && (
        <section className={styles.menusSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{content.menusTitle}</h2>
            <div className={styles.menusGrid}>
              {content.menus.map((menu, index) => (
                <div key={index} className={styles.menuCard}>
                  <div className={styles.menuCardBorder} />
                  <h3 className={styles.menuCardTitle}>{menu.title}</h3>
                  <p className={styles.menuCardDescription}>{menu.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nos Formules Section */}
      <section className={styles.formulasSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{content.formulasTitle}</h2>
          <div className={styles.formulasGrid}>
            {content.formulas.map((formula, index) => (
              <div key={index} className={styles.formulaCard}>
                <div className={styles.formulaCardBorder} />
                <h3 className={styles.formulaCardTitle}>{formula.title}</h3>
                {formula.duration && (
                  <p className={styles.formulaCardDuration}>{formula.duration}</p>
                )}
                {formula.description && (
                  <p className={styles.formulaCardDescription}>{formula.description}</p>
                )}
                <p className={styles.formulaCardPrice}>{formula.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Options Section */}
      {content.optionsTitle && content.options && content.options.length > 0 && (
        <section className={styles.optionsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{content.optionsTitle}</h2>
            <div className={styles.optionsList}>
              {content.options.map((option, index) => (
                <div key={index} className={styles.optionItem}>
                  <div className={styles.optionBullet} />
                  <p className={styles.optionText}>{option}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Asterisk Note */}
      {content.asteriskNote && (
        <div className={styles.asteriskSection}>
          <div className={styles.container}>
            <p className={styles.asteriskText}>{content.asteriskNote}</p>
          </div>
        </div>
      )}

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
