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
    // ── Général ──────────────────────────────────────────────
    { key: 'general/title',       type: ContentType.TEXT,     value: 'Ailleurs en douceur' },
    { key: 'general/subtitle',    type: ContentType.TEXT,     value: 'L\'art de voyager autrement' },

    // ── Header ──────────────────────────────────────────────
    { key: 'header/button',         type: ContentType.TEXT,     value: 'Me contacter' },
    { key: 'header/logo',       type: ContentType.IMAGE,    value: '/images/logo.png' },

    // ── Footer ──────────────────────────────────────────────
    { key: 'footer/title-1',         type: ContentType.TEXT,     value: 'Navigation' },
    { key: 'footer/title-2',         type: ContentType.TEXT,     value: 'Information' },
    { key: 'footer/title-3',         type: ContentType.TEXT,     value: 'Suivez-moi' },

    // ── Page de contact ──────────────────────────────────────────────
    { key: 'contact/hero-title',       type: ContentType.RICHTEXT,     value: 'Parlons de<br />votre <em>prochain voyage</em>' },
    { key: 'contact/hero-subtitle', type: ContentType.RICHTEXT, value: 'Un projet, une envie, une question ?<br />Je suis là pour vous accompagner.' },
    { key: 'contact/hero-image',       type: ContentType.IMAGE,    value: '/images/image-placeholder-2.png' },
    { key: 'contact/info-card-title',       type: ContentType.RICHTEXT,     value: 'Premier<br />échange gratuit' },
    { key: 'contact/info-card-text',       type: ContentType.TEXT,     value: 'Vous avez des questions, des suggestions, ou simplement envie de discuter de votre prochain voyage ?' },
    { key: 'contact/form-title',       type: ContentType.TEXT,     value: 'Écrivez-moi' },
    { key: 'contact/cta-text-1',       type: ContentType.TEXT,     value: 'Chaque voyage commence par une belle conversation.' },
    { key: 'contact/cta-text-2',       type: ContentType.TEXT,     value: 'J\'ai hâte de vous lire !' },
    { key: 'contact/cta-image',       type: ContentType.IMAGE,     value: '/images/image-placeholder-1.jpg' },
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