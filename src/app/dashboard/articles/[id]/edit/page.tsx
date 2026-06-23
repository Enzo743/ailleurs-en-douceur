import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getArticle } from '@/app/actions/articles';
import ArticleForm from '@/app/components/dashboard/ArticleForm';
import styles from '../../articles.module.scss';

export const metadata = { title: 'Modifier l\'article — Administration' };

type Props = {
    params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
    await verifySession();

    const { id } = await params;
    const article = await getArticle(id);

    if (!article) notFound();

    return (
        <section className={styles.page}>
            <h1 className={styles.pageTitle}>Modifier l&apos;article</h1>
            <p className={styles.pageSubtitle}>{article.title}</p>
            <ArticleForm article={article} />
        </section>
    );
}
