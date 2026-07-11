"use client";

import Link from "next/link";
import styles from "./mobileMenu.module.scss";
import Image from "next/image";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  siteContent: any;
}

export default function MobileMenu({ isOpen, onClose, currentPage = "", siteContent }: MobileMenuProps) {
  const c = siteContent;

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "A propos", href: "/about" },
    { label: "Mes offres en douceur", href: "/offers" },
    { label: "Blog inspirations", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.menuContent}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fermer le menu">
          <svg className={styles.crossIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.70711 7.29289ZM15.7782 17.1924C16.1687 17.5829 16.8019 17.5829 17.1924 17.1924C17.5829 16.8019 17.5829 16.1687 17.1924 15.7782L15.7782 17.1924ZM7.29289 15.7782C6.90237 16.1687 6.90237 16.8019 7.29289 17.1924C7.68342 17.5829 8.31658 17.5829 8.70711 17.1924L7.29289 15.7782ZM17.1924 8.70711C17.5829 8.31658 17.5829 7.68342 17.1924 7.29289C16.8019 6.90237 16.1687 6.90237 15.7782 7.29289L17.1924 8.70711ZM7.29289 8.70711L15.7782 17.1924L17.1924 15.7782L8.70711 7.29289L7.29289 8.70711ZM8.70711 17.1924L17.1924 8.70711L15.7782 7.29289L7.29289 15.7782L8.70711 17.1924Z" fill="currentColor" />
          </svg>
        </button>
        
        <nav className={styles.navMenu}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${currentPage === item.href ? styles.navLinkActive : ""}`}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className={styles.ctaButton}>
          <Link href="/contact" className={styles.button} onClick={onClose}>
            {c['header/button']}
          </Link>
        </div>
      </div>
    </div>
  );
}