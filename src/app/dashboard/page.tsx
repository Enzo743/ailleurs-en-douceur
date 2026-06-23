import { verifySession } from '@/lib/auth';
import { getArticleCount } from '@/app/actions/articles';
import styles from './dashboard.module.scss';

export default async function DashboardPage() {
    await verifySession();

    const articleCount = await getArticleCount();

    return (
        <section className={styles.page}>
            <h1 className={styles.pageTitle}>Tableau de bord</h1>
            <p className={styles.pageSubtitle}>
                Bienvenue dans l&apos;interface d&apos;administration.
            </p>

            <div className={styles.grid}>
                <div className={styles.widget}>
                    <h2 className={styles.widgetTitle}>Articles</h2>
                    <p className={styles.widgetValue}>{articleCount}</p>
                </div>
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