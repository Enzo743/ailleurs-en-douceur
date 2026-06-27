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
                    <a href="/dashboard" className={styles.navLink}>
                        Tableau de bord
                    </a>
                    <a href="/dashboard/content" className={styles.navLink}>
                        Contenus
                    </a>
                    <a href="/dashboard/articles" className={styles.navLink}>
                        Articles
                    </a>
                    <a href="/dashboard/contact-requests" className={styles.navLink}>
                        Demandes
                    </a>
                    <a href="/dashboard/forms" className={styles.navLink}>
                        Formulaires
                    </a>
                    <a href="/dashboard/schedule" className={styles.navLink}>
                        Planning
                    </a>
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