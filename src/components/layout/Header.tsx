import Link from "next/link";
import styles from "./header.module.scss";
import {getSiteContent} from "@/lib/content";
import Image from "next/image";

interface HeaderProps {
  currentPage?: string;
  transparent?: boolean;
}

export default async function Header({ currentPage = "", transparent = false }: HeaderProps) {
  const c = await getSiteContent();

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "A propos", href: "/about" },
    { label: "Mes offres en douceur", href: "/offers" },
    { label: "Blog inspirations", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className={`${styles.header} ${transparent ? styles.transparent : ''}`}>
      <div className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoText}>
            <div className={styles.logoImage}>
              <Image 
                src={c['header/logo']}
                alt={"Logo Ailleurs en Douceur"} 
                height={500}
                width={500}
              />
            </div>
            <div className={styles.logoTextContainer}>
              <span className={styles.logoTitle}>{c['general/title']}</span>
              <span className={styles.logoSubtitle}>{c['general/subtitle']}</span>
            </div>
          </Link>
        </div>
        
        <nav className={styles.navMenu}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${currentPage === item.href ? styles.navLinkActive : ""}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.ctaButton}>
          <Link href="/contact" className={styles.button}>
            {c['header/button']}
          </Link>
        </div>
      </div>
    </header>
  );
}
