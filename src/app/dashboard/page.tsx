import { verifySession } from '@/lib/auth';
import { getArticleCount } from '@/app/actions/articles';
import { DashboardHeader } from '@/components/dashboard';
import styles from './dashboard.module.scss';

export default async function DashboardPage() {
    await verifySession();

    const articleCount = await getArticleCount();

    return (
        <section className="dashboard-page">
            <DashboardHeader
                title="Tableau de bord"
                subtitle="Bienvenue dans l'interface d'administration."
            />

            <div className="dashboard-grid">
                <div className="dashboard-widget">
                    <h2 className="dashboard-widgetTitle">Articles</h2>
                    <p className="dashboard-widgetValue">{articleCount}</p>
                </div>
                <div className="dashboard-widget">
                    <h2 className="dashboard-widgetTitle">Destinations</h2>
                    <p className="dashboard-widgetValue">—</p>
                </div>
                <div className="dashboard-widget">
                    <h2 className="dashboard-widgetTitle">Voyages</h2>
                    <p className="dashboard-widgetValue">—</p>
                </div>
                <div className="dashboard-widget">
                    <h2 className="dashboard-widgetTitle">Réservations</h2>
                    <p className="dashboard-widgetValue">—</p>
                </div>
            </div>
        </section>
    );
}