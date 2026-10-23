import Link from "next/link";
import styles from "./footer.module.scss";
import {getSiteContent} from "@/lib/content";

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const c = await getSiteContent();

  const navigationLinks = [
    { label: "Accueil", href: "/" },
    { label: "A propos", href: "/about" },
    { label: "Mes offres en douceur", href: "/offers" },
    { label: "Blog inspirations", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  const informationLinks = [
    { label: "Conditions générales de vente", href: "/cgv" },
    { label: "Politique de confidentialité", href: "/privacy" },
    { label: "Mentions légales", href: "/legal" }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          {/* Logo Section */}
          <div className={styles.logoSection}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoTitle}>{c['general/title']}</span>
              <span className={styles.logoSubtitle}>{c['general/subtitle']}</span>
            </Link>
          </div>

          {/* Navigation Section */}
          <div className={styles.navSection}>
            <h4 className={styles.sectionTitle}>{c['footer/title-1']}</h4>
            <ul className={styles.linksList}>
              {navigationLinks.map((link) => (
                <li key={link.href} className={styles.linkItem}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Section */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionTitle}>{c['footer/title-2']}</h4>
            <ul className={styles.linksList}>
              {informationLinks.map((link) => (
                <li key={link.href} className={styles.linkItem}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Section */}
          <div className={styles.socialSection}>
            <h4 className={styles.sectionTitle}>{c['footer/title-3']}</h4>
            <div className={styles.socialIcons}>
              <a
                href="https://www.facebook.com/ailleursendouceur"
                className={styles.socialIcon}
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/ailleursendouceur/"
                className={styles.socialIcon}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M17.5 6.51L17.51 6.49889" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href={"mailto:nelly@ailleurs-en-douceur.com"}
                className={styles.socialIcon}
                aria-label="Email"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                      d="M4 4H20V18H4V4Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                  <path
                      d="M4 4L12 12L20 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Copyright */}
        <div className={styles.copyright}>
          <p>&copy; {currentYear} Ailleurs en Douceur - Tous droits réservés. Design du site par <a href={'https://uxdcheyennedeschamps.framer.website/'}>Cheyenne Deschamps</a> et développement par <a href={'https://www.linkedin.com/in/enzo-bortolussi-7682811aa/'}>Enzo Bortolussi</a></p>
        </div>
      </div>
    </footer>
  );
}
