import { verifySession } from '@/lib/auth';
import { getArticles } from '@/app/actions/articles';
import DeleteArticleButton from '@/app/components/dashboard/DeleteArticleButton';
import styles from './articles.module.scss';

export const metadata = { title: 'Articles — Administration' };

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export default async function ArticlesPage() {
    await verifySession();

    const articles = await getArticles();

    return (
        <section className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Articles</h1>
                    <p className={styles.pageSubtitle}>
                        Gérez les articles du blog.
                    </p>
                </div>
                <a href="/dashboard/articles/new" className={styles.newButton}>
                    Nouvel article
                </a>
            </div>

            <div className={styles.tableWrapper}>
                {articles.length === 0 ? (
                    <p className={styles.empty}>
                        Aucun article pour le moment.{' '}
                        <a href="/dashboard/articles/new">Créer le premier</a>
                    </p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Statut</th>
                                <th>Tags</th>
                                <th>Modifié</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map((article) => (
                                <tr key={article.id}>
                                    <td className={styles.titleCell}>{article.title}</td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            data-status={article.published ? 'published' : 'draft'}
                                        >
                                            {article.published ? 'Publié' : 'Brouillon'}
                                        </span>
                                    </td>
                                    <td>
                                        {article.tags.length > 0 ? (
                                            <div className={styles.tags}>
                                                {article.tags.map((tag) => (
                                                    <span key={tag.id} className={styles.tag}>
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className={styles.noTags}>—</span>
                                        )}
                                    </td>
                                    <td className={styles.date}>
                                        {formatDate(article.updatedAt)}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <a
                                                href={`/dashboard/articles/${article.id}/edit`}
                                                className={styles.actionLink}
                                            >
                                                Modifier
                                            </a>
                                            <DeleteArticleButton
                                                id={article.id}
                                                title={article.title}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
