import { verifySession } from '@/lib/auth';
import { getArticles } from '@/app/actions/articles';
import { DashboardHeader, DeleteArticleButton, EmptyState, StatusBadge, Tag } from '@/components/dashboard';
import { formatDate } from '@/lib/time';
import styles from './articles.module.scss';

export const metadata = { title: 'Articles — Administration' };

export default async function ArticlesPage() {
    await verifySession();

    const articles = await getArticles();

    return (
        <section className="dashboard-page">
            <DashboardHeader
                title="Articles"
                subtitle="Gérez les articles du blog."
                actionButton={{
                    label: 'Nouvel article',
                    href: '/dashboard/articles/new'
                }}
            />

            <div className="dashboard-tableContainer">
                {articles.length === 0 ? (
                    <EmptyState
                        message="Aucun article pour le moment."
                        action={{ label: 'Créer le premier', href: '/dashboard/articles/new' }}
                    />
                ) : (
                    <table className="dashboard-table">
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
                                        <StatusBadge status={article.published ? 'published' : 'draft'} type="article" />
                                    </td>
                                    <td>
                                        {article.tags.length > 0 ? (
                                            <div className="dashboard-tags">
                                                {article.tags.map((tag) => (
                                                    <Tag key={tag.id} name={tag.name} />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="dashboard-no-tags">—</span>
                                        )}
                                    </td>
                                    <td className={styles.date}>
                                        {formatDate(article.updatedAt)}
                                    </td>
                                    <td>
                                        <div className="dashboard-actions">
                                            <a
                                                href={`/dashboard/articles/${article.id}/edit`}
                                                className="dashboard-action-button"
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
