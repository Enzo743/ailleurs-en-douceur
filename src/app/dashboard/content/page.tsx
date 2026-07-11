import { verifySession } from '@/lib/auth';
import { getAllContent } from '@/app/actions/content';
import { DashboardHeader, SectionCard } from '@/components/dashboard';
import type { SiteContent } from '@prisma/client';
import styles from './content.module.scss';

// Clés de contenu à exclure de l'interface de modification
const EXCLUDED_CONTENT_KEYS = new Set([
    'contact/form-enabled', // Géré via le tableau de bord principal
]);

export const metadata = { title: 'Contenus — Administration' };

const SECTION_PREVIEWS: Record<string, string> = {
    hero:   '/previews/hero.jpg',
    about:  '/previews/about.jpg',
    footer: '/previews/footer.jpg'
};

export default async function ContentPage() {
    await verifySession();

    const allContent = await getAllContent();

    // Filtrer les contenus à exclure
    const filteredContent = allContent.filter(item => !EXCLUDED_CONTENT_KEYS.has(item.key));

    const sections = filteredContent.reduce<Record<string, SiteContent[]>>((acc, item) => {
        const section = item.key.split('/')[0];
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {});

    return (
        <section className="dashboard-page">
            <DashboardHeader
                title="Gestion du contenu"
                subtitle="Modifiez les textes et les images affichés sur le site."
            />
            <div className="dashboard-content-list">
                {Object.entries(sections).map(([section, items]) => (
                    <SectionCard
                        key={section}
                        section={section}
                        items={items}
                        previewImage={SECTION_PREVIEWS[section]}
                    />
                ))}
            </div>
        </section>
    );
}