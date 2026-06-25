import { PrismaClient, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clés de contenu initiales du site.
 * La convention de nommage des clés est : "section/élément"
 */
const initialContent: {
    key: string;
    type: ContentType;
    value: string;
}[] = [
    // ── Hero ──────────────────────────────────────────────
    { key: 'hero/title',       type: ContentType.TEXT,     value: 'Ailleurs en douceur' },
    { key: 'hero/subtitle',    type: ContentType.TEXT,     value: 'Voyages lents, instants précieux' },
    { key: 'hero/cta',         type: ContentType.TEXT,     value: 'Découvrir' },
    { key: 'hero/image',       type: ContentType.IMAGE,    value: '/images/hero.jpg' },

    // ── À propos ──────────────────────────────────────────
    { key: 'about/title',      type: ContentType.TEXT,     value: 'Notre histoire' },
    { key: 'about/body',       type: ContentType.RICHTEXT, value: 'Nous croyons que les plus beaux voyages se font lentement...' },
    { key: 'about/image',      type: ContentType.IMAGE,    value: '/images/about.jpg' },

    // ── Footer ────────────────────────────────────────────
    { key: 'footer/copyright', type: ContentType.TEXT,     value: '© 2026 Ailleurs en douceur' },
    { key: 'footer/tagline',   type: ContentType.TEXT,     value: 'Fait avec passion, pour les âmes voyageuses' },

    // ── Email de confirmation client ────────────────────
    { key: 'contact-email/client-subject', type: ContentType.TEXT, value: 'Confirmation de votre demande - Ailleurs en Douceur' },
    { key: 'contact-email/client-message', type: ContentType.RICHTEXT, value: 'Vous allez être recontacté prochainement pour obtenir plus d\'informations et convenir d\'un entretien en visioconférence.' },
];

async function main(): Promise<void> {
    for (const item of initialContent) {
        await prisma.siteContent.upsert({
            where:  { key: item.key },
            update: {},
            create: item,
        });
    }
    console.log(`✅ ${initialContent.length} contenus insérés/vérifiés`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());