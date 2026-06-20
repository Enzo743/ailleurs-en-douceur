import { verifySession } from '@/lib/auth';
import styles from './dashboard.module.scss';

export default async function DashboardPage() {
    await verifySession();

    return (
        <section className={styles.page}>
            <h1 className={styles.pageTitle}>Tableau de bord</h1>
            <p className={styles.pageSubtitle}>
                Bienvenue dans l&apos;interface d&apos;administration.
            </p>

            <div className={styles.grid}>
                <div className={styles.widget}>
                    <h2 className={styles.widgetTitle}>Destinations</h2>
                    <p className={styles.widgetValue}>—</p>
                </div>
                <div className={styles.widget}>
                    <h2 className={styles.widgetTitle}>Voyages</h2>
                    <p className={styles.widgetValue}>—</p>
                </div>
                <div className={styles.widget}>
                    <h2 className={styles.widgetTitle}>Réservations</h2>
                    <p className={styles.widgetValue}>—</p>
                </div>
            </div>
        </section>
    );
}