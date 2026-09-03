import { verifySession } from '@/lib/auth';
import { DashboardHeader, ContactSettingsWrapper, BannerSettingsWrapper } from '@/components/dashboard';
import { prisma } from '@/lib/prisma';
import styles from './site-settings.module.scss';

export default async function SiteSettingsPage() {
    await verifySession();

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
                title="Paramètres du site"
                subtitle="Gérez les paramètres généraux de votre site"
            />

            <div className={styles.settingsSection}>
                <BannerSettingsWrapper initialState={bannerSettings} />
                <ContactSettingsWrapper initialState={contactEnabled} />
            </div>
        </section>
    );
}