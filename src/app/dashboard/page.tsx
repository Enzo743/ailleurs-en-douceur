import { verifySession } from '@/lib/auth';
import { getArticleCount } from '@/app/actions/articles';
import { DashboardHeader, ContactSettingsWrapper, BannerSettingsWrapper } from '@/components/dashboard';
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
    
    // Récupérer les paramètres du bandeau
    const bannerContent = await prisma.siteContent.findMany({
        where: {
            key: {
                startsWith: 'banner/'
            }
        }
    });
    
    // Parser les paramètres du bandeau
    const bannerSettings = {
        isEnabled: bannerContent.find(item => item.key === 'banner/enabled')?.value === 'true' || false,
        text: bannerContent.find(item => item.key === 'banner/text')?.value || '',
        color: bannerContent.find(item => item.key === 'banner/color')?.value || '#4F46E5',
        duration: (bannerContent.find(item => item.key === 'banner/duration')?.value || 'permanent') as 'permanent' | 'temporary',
        endDate: bannerContent.find(item => item.key === 'banner/endDate')?.value || null
    };

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
                <BannerSettingsWrapper initialState={bannerSettings} />
                <ContactSettingsWrapper initialState={contactEnabled} />
            </div>
        </section>
    );
}