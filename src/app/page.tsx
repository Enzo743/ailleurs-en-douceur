import Link from "next/link";
import Image from "next/image";
import {Header, Footer, BlogCard, ValuesSection, BotanicalDecoration, ContactSection} from "@/components/layout";
import { getArticles } from "@/app/actions/articles";
import { getSiteContent } from "@/lib/content";
import styles from "./page.module.scss";
import {RichTextDisplay} from "@/components";

// SVG Icons
const FeatherIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46" fill="none">
      <path d="M32.6428 8.73015C33.908 5.82013 32.2632 -1.39165 28.341 2.15098C26.5697 3.79577 24.5453 5.18752 23.9127 7.59145C23.9127 7.71797 23.7862 7.71797 23.6597 7.59145C23.0271 7.08536 23.0271 8.09754 22.9005 8.4771C22.774 8.4771 22.774 8.4771 22.6475 8.4771C22.0149 7.46493 21.7618 10.881 21.5088 11.1341C20.7497 11.5136 21.0027 12.9054 20.3701 13.285C19.4844 13.791 19.611 15.1828 19.3579 16.0685C19.1049 16.7011 19.3579 17.5867 19.1049 18.0928C17.8396 15.8154 18.4723 18.8519 18.0927 19.4846C17.3336 16.448 15.0561 24.4189 14.5501 25.4311C13.6644 27.7085 14.044 30.239 14.1705 32.6429C13.5379 32.2633 13.4114 31.2512 12.6522 31.1246C12.6522 33.5286 13.4114 36.5651 15.3092 38.3364C15.3092 40.1077 14.1705 41.879 14.044 43.7769C13.9174 44.1564 14.1705 44.7891 14.5501 44.4095C15.4357 42.6382 15.4357 40.2342 16.8275 38.969C17.5866 38.0834 25.5575 35.0468 23.0271 34.1612C25.9371 32.2633 26.3166 28.5942 27.4554 25.5576C27.7084 24.925 27.4553 24.925 26.9493 24.925C26.3166 24.7985 28.2145 23.6598 28.341 23.2802C29.1001 22.6476 28.7206 21.3824 29.3532 20.6233C29.6062 20.1172 31.1245 18.8519 29.8593 18.7254C29.6062 18.3459 30.7449 17.5867 30.6184 17.0806C30.3654 16.8276 29.8593 17.4602 29.6062 17.2072C29.8593 16.7011 30.4919 16.448 30.7449 15.8154C30.998 15.5624 30.4919 15.5624 30.4919 15.3093C30.8715 14.8032 31.8836 13.538 30.6184 13.791C31.3775 12.1463 32.1367 10.5015 32.6428 8.73015Z" fill="white"/>
      <line x1="16.9475" y1="33.8687" x2="22.8687" y2="20.0525" stroke="#B2AC88" strokeWidth="0.2" strokeLinecap="round"/>
    </svg>
);

const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
      <path d="M24.375 4.875V30.875M24.375 30.875L34.125 34.125V8.125L24.375 4.875L14.625 8.125M14.625 8.125L4.875 4.875V30.875L14.625 34.125L24.375 30.875M14.625 8.125V34.125" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M6.4971 18.0711L18 30L29.5029 18.0711C30.7816 16.745 31.5 14.9464 31.5 13.0711C31.5 9.16582 28.4472 6 24.6815 6C22.8731 6 21.1388 6.74498 19.86 8.07107L18 10L16.14 8.07107C14.8612 6.74499 13.1269 6 11.3185 6C7.55276 6 4.5 9.16583 4.5 13.0711C4.5 14.9464 5.21838 16.745 6.4971 18.0711Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="8" viewBox="0 0 11 8" fill="none">
      <path d="M0.5 3.18188C0.223858 3.18188 -2.89694e-08 3.40574 0 3.68188C2.89694e-08 3.95803 0.223858 4.18188 0.5 4.18188L0.5 3.68188L0.5 3.18188ZM10.8536 4.03544C11.0488 3.84017 11.0488 3.52359 10.8536 3.32833L7.67157 0.14635C7.47631 -0.0489121 7.15973 -0.048912 6.96447 0.14635C6.7692 0.341612 6.7692 0.658195 6.96447 0.853457L9.79289 3.68188L6.96447 6.51031C6.7692 6.70557 6.7692 7.02216 6.96447 7.21742C7.15973 7.41268 7.47631 7.41268 7.67157 7.21742L10.8536 4.03544ZM0.5 3.68188L0.5 4.18188L10.5 4.18188L10.5 3.68188L10.5 3.18188L0.5 3.18188L0.5 3.68188Z" fill="#D4A373"/>
    </svg>
);

export default async function Home() {
  const c = await getSiteContent();
  const articles = await getArticles();
  // Filtrer les articles publiés et trier par date de mise à jour (plus récent en premier)
  const publishedArticles = articles.filter(a => a.published).sort((a, b) => 
    new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
  // Prendre jusqu'à 3 articles les plus récents
  const articlesToDisplay = publishedArticles.slice(0, 3);
  


  return (
    <main>
      {/* Hero Section */}
      <section className={styles.hero}>
        <Header transparent={true} currentPage="/" />
        <div className={styles.heroImage}>
          <Image
            src={c['home/hero-image']}
            alt="Background"
            width={1920}
            height={1080}
            loading={"eager"}
          />
        </div>
        <div className={styles.heroContent}>
          <p className={styles.heroTagline}>{c['home/hero-tagline']}</p>
          <RichTextDisplay html={c['home/hero-title']} className={styles.heroTitle} />
          <div className={styles.heroDivider} />
          <p className={styles.heroSubtitle}>
            {c['home/hero-subtitle']}
          </p>
        </div>
      </section>

      {/* Values Section */}
      <ValuesSection  />

      {/* Offers Section */}
      <section className={styles.offers}>
        <div className={styles.container}>
          <div className={styles.offersHeader}>
            <p className={styles.offersTagline}>
              <BotanicalDecoration type={"botanical-16"} className={styles.offersBotanicalDecoration} />
              {c['home/offers-tagline']}
            </p>
            <RichTextDisplay html={c['home/offers-title']} className={styles.offersTitle} />
          </div>
          <div className={styles.offersGrid}>
            {/* Offer 1 */}
            <article className={styles.offerCard}>
              <div className={styles.offerCardImageContainer}>
                <Image src={c['home/offers-offer1-image']}
                  alt={'Offre 1'}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className={styles.offerCardIconBubble}>
                <FeatherIcon />
              </div>
              <div className={styles.offerCardContentContainer}>
                <h3 className={styles.offerCardTitle}>{c['home/offers-offer1-title']}</h3>
                <p className={styles.offerCardDescription}>
                  {c['home/offers-offer1-description']}
                </p>
                <Link href={'/offers/impulsion-douce'} className={styles.offerCardLink}>
                  {c['home/offers-link']}
                  <ArrowRightIcon />
                </Link>
              </div>
            </article>

            {/* Offer 2 */}
            <article className={styles.offerCard}>
              <div className={styles.offerCardImageContainer}>
                <Image src={c['home/offers-offer2-image']}
                  alt={'Offer 2'}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className={styles.offerCardIconBubble}>
                <MapIcon />
              </div>
              <div className={styles.offerCardContentContainer}>
                <h3 className={styles.offerCardTitle}>{c['home/offers-offer2-title']}</h3>
                <p className={styles.offerCardDescription}>
                  {c['home/offers-offer2-description']}
                </p>
                <Link href={'/offers/echappee-douce'} className={styles.offerCardLink}>
                  {c['home/offers-link']}
                  <ArrowRightIcon />
                </Link>
              </div>
            </article>

            {/* Offer 3 */}
            <article className={styles.offerCard}>
              <div className={styles.offerCardImageContainer}>
                <Image src={c['home/offers-offer3-image']}
                  alt={'Offer 3'}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className={styles.offerCardIconBubble}>
                <HeartIcon />
              </div>
              <div className={styles.offerCardContentContainer}>
                <h3 className={styles.offerCardTitle}>{c['home/offers-offer3-title']}</h3>
                <p className={styles.offerCardDescription}>
                  {c['home/offers-offer3-description']}
                </p>
                <Link href={'/offers/lune-douceur'} className={styles.offerCardLink}>
                  {c['home/offers-link']}
                  <ArrowRightIcon />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={styles.about}>
        <div className={styles.container}>
          <div className={styles.aboutContainer}>
            <div className={styles.aboutImage}>
                <Image src={c['home/about-image']}
                alt={'About'}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <BotanicalDecoration type={"botanical-7"} className={styles.aboutDecorationFirst} />
            </div>
            <div className={styles.aboutContent}>
              <p className={styles.aboutTagline}>{c['home/about-tagline']}</p>
              <RichTextDisplay className={styles.aboutTitle} html={c['home/about-title']} />
              <p className={styles.aboutDescription}>{c['home/about-description']}</p>
              <Link href={'/about'} className={styles.aboutButton}>
                  {c['home/about-button']} <BotanicalDecoration type={"botanical-17"} className={styles.aboutDecorationSecond} color={"#4A3F2F"} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className={styles.blog}>
        <div className={styles.container}>
          <div className={styles.blogContainer}>
            <div className={styles.blogHeader}>
              <p className={styles.blogTagline}>
                {c['home/blog-tagline']}
                <BotanicalDecoration type={"botanical-21"} color={"#4a3f2f"} className={styles.blogBotanicalDecoration} />
              </p>
              <RichTextDisplay className={styles.blogTitle} html={c['home/blog-title']} />
              <p className={styles.blogDescription}>{c['home/blog-description']}</p>
              <Link href={'/blog'} className={styles.blogLink}>
                {c['home/blog-button']}
                <ArrowRightIcon />
              </Link>
            </div>
            <div className={styles.blogContentRight}>
              <div className={styles.blogImage}>
                <Image src={c['home/blog-image']}
                  alt="Blog"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {articlesToDisplay.length > 0 ? (
                <div className={styles.blogCards}>
                  {articlesToDisplay.map((article) => (
                    <BlogCard
                      key={article.id}
                      title={article.title}
                      excerpt={article.excerpt || ''}
                      slug={article.slug}
                      coverImage={article.coverImage || undefined}
                      publishedAt={article.publishedAt || undefined}
                      content={article.content || undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.blogCards}>
                  <div className={styles.noArticlesCard}>
                    <h3 className={styles.noArticlesTitle}>{c['home/blog-no-content-title']}</h3>
                    <p className={styles.noArticlesText}>{c['home/blog-no-content-description']}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      <Footer />
    </main>
  );
}
