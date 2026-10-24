import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import styles from './dashboard.module.scss';
import '@/styles/dashboard-global.css';

export const metadata = {
    title: 'Dashboard — Administration',
};

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}): Promise<React.JSX.Element> {
    await verifySession();

    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <span className={styles.brand}>⚙️ Administration</span>
                <nav className={styles.nav}>
                    <Link href="/dashboard" className={styles.navLink}>
                        Tableau de bord
                    </Link>
                    <Link href="/dashboard/content" className={styles.navLink}>
                        Contenus
                    </Link>
                    <Link href="/dashboard/articles" className={styles.navLink}>
                        Articles
                    </Link>
                    <Link href="/dashboard/contact-requests" className={styles.navLink}>
                        Demandes
                    </Link>
                    <Link href="/dashboard/forms" className={styles.navLink}>
                        Formulaires
                    </Link>
                    <Link href="/dashboard/schedule" className={styles.navLink}>
                        Planning
                    </Link>
                    <Link href="/dashboard/site-settings" className={styles.navLink}>
                        Paramètres du site
                    </Link>
                </nav>
                <form action={logout}>
                    <button type="submit" className={styles.logoutButton}>
                        Déconnexion
                    </button>
                </form>
            </header>

            <main className={styles.content}>{children}</main>
        </div>
    );
}