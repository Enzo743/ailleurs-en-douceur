import { verifySession } from '@/lib/auth';
import { getArticleCount } from '@/app/actions/articles';
import { DashboardHeader, ContactSettingsWrapper } from '@/components/dashboard';
import { prisma } from '@/lib/prisma';
import styles from './dashboard.module.scss';

export default async function DashboardPage() {
    await verifySession();

    const articleCount = await getArticleCount();
    
    // Récupérer l'état du formulaire de contact
    const contactContent = await prisma.siteContent.findUnique({
        where: { key: 'contact/form-enabled' }
    });
    
    const contactEnabled = contactContent ? contactContent.value === 'true' : true;

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

            <div className="dashboardSettings">
                <ContactSettingsWrapper initialState={contactEnabled} />
            </div>
        </section>
    );
}