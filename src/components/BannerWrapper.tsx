import { getFreshSiteContent } from '@/lib/content';
import Banner from './Banner';

export default async function BannerWrapper() {
    try {
        // Utiliser la version non-cachée pour toujours avoir les données fraîches
        const siteContent = await getFreshSiteContent();
        
        // Extraire les paramètres du bandeau
        const isEnabled = siteContent['banner/enabled'] === 'true';
        const text = siteContent['banner/text'] || '';
        const color = siteContent['banner/color'] || '#d4a373';
        const duration = (siteContent['banner/duration'] || 'permanent') as 'permanent' | 'temporary';
        const endDate = siteContent['banner/endDate'] || null;
        
        // Vérifier si le bandeau est temporaire et si la date est dépassée
        if (duration === 'temporary' && endDate) {
            const endDateTime = new Date(endDate).getTime();
            const now = new Date().getTime();
            
            if (now > endDateTime) {
                // Le bandeau temporaire a expiré, ne pas l'afficher
                return null;
            }
        }
        
        // Si le bandeau est désactivé ou n'a pas de texte, ne pas l'afficher
        if (!isEnabled || !text) {
            return null;
        }
        
        return (
            <Banner
                text={text}
                color={color}
                duration={duration}
                endDate={endDate}
            />
        );
        
    } catch (error) {
        console.error('Erreur lors du chargement du bandeau:', error);
        return null;
    }
}