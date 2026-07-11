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

    // ── Page d'accueil ──────────────────────────────────────────────
    { key: 'home/hero-image',       type: ContentType.IMAGE,    value: '/images/image-placeholder-3.png' },
    { key: 'home/hero-image-mobile',       type: ContentType.IMAGE,    value: '/images/image-placeholder-2.png' },
    { key: 'home/hero-tagline',         type: ContentType.TEXT,     value: 'Travel Planner' },
    { key: 'home/hero-title',         type: ContentType.RICHTEXT,     value: 'Voyager autrement, <i><em>prendre le temps</em></i>.' },
    { key: 'home/hero-subtitle',         type: ContentType.TEXT,     value: 'Je conçois pour vous des voyages sur-mesure, écoresponsables et en slow travel, en France et en Europe.' },
    { key: 'home/hero-contact-button',         type: ContentType.TEXT,     value: 'Me contacter' },
    { key: 'home/offers-tagline',         type: ContentType.TEXT,     value: 'Pourquoi me confier votre voyage ?' },
    { key: 'home/offers-title',         type: ContentType.RICHTEXT,     value: 'Un voyage qui vous ressemble, <i><em>en accord avec vos valeurs</em></i>.' },
    { key: 'home/offers-link',         type: ContentType.TEXT,     value: 'Découvrir' },
    { key: 'home/offers-offer1-image', type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'home/offers-offer1-title',         type: ContentType.TEXT,     value: 'L\'Impulsion Douce' },
    { key: 'home/offers-offer1-description',         type: ContentType.TEXT,     value: 'Prenez le temps d\'une parenthèse ressourçante, proche de chez vous ou un peu plus loin.' },
    { key: 'home/offers-offer2-image', type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'home/offers-offer2-title',         type: ContentType.TEXT,     value: 'L\'Échappée Douce' },
    { key: 'home/offers-offer2-description',         type: ContentType.TEXT,     value: 'Un itinéraire unique, pensé pour vous, en harmonie avec vos envies et vos valeurs.' },
    { key: 'home/offers-offer3-image', type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'home/offers-offer3-title',         type: ContentType.TEXT,     value: 'Lune de Douceurs' },
    { key: 'home/offers-offer3-description',         type: ContentType.TEXT,     value: 'Un voyage à deux, unique et authentique, pour célébrer votre amour autrement.' },
    { key: 'home/about-image', type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'home/about-tagline', type: ContentType.TEXT,    value: 'À propos de moi' },
    { key: 'home/about-title', type: ContentType.RICHTEXT,    value: 'Je suis <span>Nelly</span>,<br/> <i><em>votre Travel Planner passionnée</em></i>' },
    { key: 'home/about-description', type: ContentType.TEXT,    value: 'Je prends le temps de comprendre vos envies pour créer un itinéraire unique, respectueux de l\'environnement et des populations locales. Mon objectif : que vous viviez une expérience authentique, en toute sérénité.' },
    { key: 'home/about-button', type: ContentType.TEXT,    value: 'En savoir plus sur moi' },
    { key: 'home/blog-tagline', type: ContentType.TEXT,    value: 'Inspirations' },
    { key: 'home/blog-title', type: ContentType.RICHTEXT,    value: 'Des idées pour <i><em>voyager autrement</em></i>' },
    { key: 'home/blog-description', type: ContentType.TEXT,    value: 'Conseils, récits et inspirations pour nourrir vos envies d\'évasion.' },
    { key: 'home/blog-button', type: ContentType.TEXT,    value: 'Lire les derniers articles' },
    { key: 'home/blog-image', type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'home/blog-no-content-title', type: ContentType.TEXT,    value: 'Pas encore d\'articles' },
    { key: 'home/blog-no-content-description', type: ContentType.TEXT,    value: 'Revenez bientôt pour découvrir nos conseils et inspirations' },

    // ── Section Valeurs ──────────────────────────────────────────────
    { key: 'values/title-1',         type: ContentType.TEXT,     value: 'Authenticité & Partage' },
    { key: 'values/description-1',         type: ContentType.TEXT,     value: 'Des voyages vrais, loin des circuits formatés.' },
    { key: 'values/title-2',         type: ContentType.TEXT,     value: 'Confiance & Sérénité' },
    { key: 'values/description-2',         type: ContentType.TEXT,     value: 'Un accompagnement 100% personnalisé.' },
    { key: 'values/title-3',         type: ContentType.TEXT,     value: 'Empathie & Écoute' },
    { key: 'values/description-3',         type: ContentType.TEXT,     value: 'Chaque voyage commence par une vraie conversation.' },
    { key: 'values/title-4',         type: ContentType.TEXT,     value: 'Eco-responsabilité' },
    { key: 'values/description-4',         type: ContentType.TEXT,     value: 'Des modes de transports doux, des partenaires locaux engagés.' },

    // ── Section Contact ──────────────────────────────────────────────
    { key: 'contact/image',         type: ContentType.IMAGE,     value: '/images/image-placeholder-1.jpg' },
    { key: 'contact/title',         type: ContentType.TEXT,     value: 'Prêt à vivre un voyage qui a du sens ?' },
    { key: 'contact/description',         type: ContentType.TEXT,     value: 'Discussion de votre projet, je serai ravie de vous accompagner.' },
    { key: 'contact/button',         type: ContentType.TEXT,     value: 'Me contacter' },

    // ── Page de contact ──────────────────────────────────────────────
    { key: 'contact/hero-title',       type: ContentType.RICHTEXT,     value: 'Parlons de<br />votre <em>prochain voyage</em>' },
    { key: 'contact/hero-subtitle', type: ContentType.RICHTEXT, value: 'Un projet, une envie, une question ?<br />Je suis là pour vous accompagner.' },
    { key: 'contact/hero-image',       type: ContentType.IMAGE,    value: '/images/image-placeholder-2.png' },
    { key: 'contact/info-card-title',       type: ContentType.RICHTEXT,     value: 'Premier<br />échange gratuit' },
    { key: 'contact/info-card-text',       type: ContentType.TEXT,     value: 'Vous avez des questions, des suggestions, ou simplement envie de discuter de votre prochain voyage ?' },
    { key: 'contact/form-title',       type: ContentType.TEXT,     value: 'Écrivez-moi' },
    { key: 'contact/form-enabled',       type: ContentType.TEXT,     value: 'true' },
    { key: 'contact/form-disabled-title',       type: ContentType.TEXT,     value: 'Formulaire temporairement indisponible' },
    { key: 'contact/form-disabled-text-1',       type: ContentType.TEXT,     value: 'Notre formulaire de contact est actuellement indisponible.' },
    { key: 'contact/form-disabled-text-2',       type: ContentType.TEXT,     value: 'Vous pouvez revenir d\'ici quelques temps pour nous contacter.' },
    { key: 'contact/form-disabled-text-3',       type: ContentType.TEXT,     value: 'Merci de votre compréhension et à bientôt !' },
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