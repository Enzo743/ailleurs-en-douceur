import { verifySession } from '@/lib/auth';
import { getAllContent } from '@/app/actions/content';
import SectionCard from '@/app/components/dashboard/SectionCard';
import type { SiteContent } from '@prisma/client';
import styles from './content.module.scss';

export const metadata = { title: 'Contenus — Administration' };

const SECTION_PREVIEWS: Record<string, string> = {
    hero:   '/previews/hero.jpg',
    about:  '/previews/about.jpg',
    footer: '/previews/footer.jpg'
};

export default async function ContentPage() {
    await verifySession();

    const allContent = await getAllContent();

    const sections = allContent.reduce<Record<string, SiteContent[]>>((acc, item) => {
        const section = item.key.split('/')[0];
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {});

    return (
        <section className={styles.page}>
            <h1 className={styles.pageTitle}>Gestion du contenu</h1>
            <p className={styles.pageSubtitle}>
                Modifiez les textes et les images affichés sur le site.
            </p>
            <div className={styles.list}>
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