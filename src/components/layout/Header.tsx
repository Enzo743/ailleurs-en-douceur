"use client";

import Link from "next/link";
import styles from "./header.module.scss";
import Image from "next/image";
import MobileMenu from "./MobileMenu";
import { useState } from "react";

interface HeaderProps {
  currentPage?: string;
  transparent?: boolean;
  siteContent: any;
}

export default function Header({ currentPage = "", transparent = false, siteContent }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const c = siteContent;

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "A propos", href: "/about" },
    { label: "Mes offres en douceur", href: "/offers" },
    { label: "Blog inspirations", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

        <button className={styles.hamburgerButton} onClick={toggleMobileMenu} aria-label="Ouvrir le menu mobile">
          <svg className={styles.hamburgerIcon} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M24 10H0V6H24V10Z" fill="currentColor" />
            <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M24 18H0V14H24V18Z" fill="currentColor" />
            <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M24 26H0V22H24V26Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={toggleMobileMenu} currentPage={currentPage} siteContent={c} />
    </header>
  );
}
