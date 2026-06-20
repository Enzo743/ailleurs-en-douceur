import { verifySession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import styles from './dashboard.module.scss';

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