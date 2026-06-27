import { verifySession } from '@/lib/auth';
import { ArticleForm } from '@/components/dashboard';
import styles from '../articles.module.scss';

export const metadata = { title: 'Nouvel article — Administration' };

export default async function NewArticlePage() {
    await verifySession();

    return (
        <section className={styles.page}>
            <h1 className={styles.pageTitle}>Nouvel article</h1>
            <p className={styles.pageSubtitle}>
                Rédigez un nouvel article pour le blog.
            </p>
            <ArticleForm />
        </section>
    );
}
