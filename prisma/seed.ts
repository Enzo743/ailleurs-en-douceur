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

    // ── Page À Propos ──────────────────────────────────────────────
    { key: 'about/tagline',         type: ContentType.TEXT,     value: 'A PROPOS' },
    { key: 'about/hero-title',         type: ContentType.RICHTEXT,     value: 'Derrière <em>Ailleurs en Douceur</em>' },
    { key: 'about/hero-image',       type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'about/hero-description-1',         type: ContentType.TEXT,     value: 'Je m\'appelle Nelly, Travel Planner passionnée par les voyages qui ont du sens.' },
    { key: 'about/hero-description-2',         type: ContentType.TEXT,     value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { key: 'about/story-tagline',         type: ContentType.TEXT,     value: 'MON HISTOIRE' },
    { key: 'about/story-title',         type: ContentType.TEXT,     value: 'Le voyage a toujours fait parti de ma vie.' },
    { key: 'about/story-image',       type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'about/story-description-1',         type: ContentType.TEXT,     value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { key: 'about/story-description-2',         type: ContentType.TEXT,     value: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
    { key: 'about/travel-planner-tagline',         type: ContentType.TEXT,     value: "QU'EST CE QU'UN TRAVEL PLANNER ?" },
    { key: 'about/travel-planner-title',         type: ContentType.TEXT,     value: 'Un voyage qui vous ressemble' },
    { key: 'about/travel-planner-image',       type: ContentType.IMAGE,    value: '/images/image-placeholder-1.jpg' },
    { key: 'about/travel-planner-description-1',         type: ContentType.TEXT,     value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { key: 'about/travel-planner-description-2',         type: ContentType.TEXT,     value: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
    { key: 'about/commitments-tagline',         type: ContentType.TEXT,     value: 'MES ENGAGEMENTS' },
    { key: 'about/commitments-title',         type: ContentType.TEXT,     value: 'Des valeurs au cœur de chaque itinéraire.' },

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

    // ── Page des offres ──────────────────────────────────────────────
    { key: 'offers/hero-image',       type: ContentType.IMAGE,     value: '/images/image-placeholder-2.png' },
    { key: 'offers/hero-title',       type: ContentType.TEXT,     value: 'Mes offres en douceur' },
    { key: 'offers/hero-subtitle',       type: ContentType.TEXT,     value: 'Des voyages sur-mesure, pensés pour vous et avec vous.' },
    { key: 'offers/intro-tagline',       type: ContentType.TEXT,     value: 'Chaque voyage est unique' },
    { key: 'offers/intro-title',       type: ContentType.RICHTEXT,     value: 'Je conçois des itinéraires personnalisés, adaptés à <em>vos envies, votre rythme et vos valeurs.</em>' },
    { key: 'offers/offer1-title',       type: ContentType.TEXT,     value: 'L\'Impulsion Douce' },
    { key: 'offers/offer1-subtitle',       type: ContentType.TEXT,     value: 'Offre Coup de Pouce' },
    { key: 'offers/offer1-description',       type: ContentType.TEXT,     value: 'Idéale pour les voyageurs autonomes qui souhaitent déléguer une partie spécifique de l\'organisation.' },
    { key: 'offers/offer1-image',       type: ContentType.IMAGE,     value: '/images/image-placeholder-1.jpg' },
    { key: 'offers/offer2-title',       type: ContentType.TEXT,     value: 'L\'Échappée Douce' },
    { key: 'offers/offer2-subtitle',       type: ContentType.TEXT,     value: 'Offre Premium' },
    { key: 'offers/offer2-description',       type: ContentType.TEXT,     value: 'L\'offre complète clé en main fournie avec un carnet d\'itinéraire digital avec des liens cliquables.' },
    { key: 'offers/offer2-image',       type: ContentType.IMAGE,     value: '/images/image-placeholder-1.jpg' },
    { key: 'offers/offer3-title',       type: ContentType.TEXT,     value: 'Lune de Douceurs' },
    { key: 'offers/offer3-subtitle',       type: ContentType.TEXT,     value: 'Offre Voyage de Noces' },
    { key: 'offers/offer3-description',       type: ContentType.TEXT,     value: 'L\'offre Premium sublimée pour les jeunes mariés, avec des prestations supplémentaires.' },
    { key: 'offers/offer3-image',       type: ContentType.IMAGE,     value: '/images/image-placeholder-1.jpg' },
    { key: 'offers/how-it-works-title',       type: ContentType.TEXT,     value: 'Comment ça marche ?' },
    { key: 'offers/step1-title',       type: ContentType.TEXT,     value: 'On échange' },
    { key: 'offers/step1-description',       type: ContentType.TEXT,     value: 'Après m\'avoir contacté et remplit un formulaire, on échange sur votre itinéraire de rêve.' },
    { key: 'offers/step2-title',       type: ContentType.TEXT,     value: 'Je crée votre itinéraire' },
    { key: 'offers/step2-description',       type: ContentType.TEXT,     value: 'Avec vos volontés, je crée votre itinéraire souhaité.' },
    { key: 'offers/step3-title',       type: ContentType.TEXT,     value: 'Vous validez' },
    { key: 'offers/step3-description',       type: ContentType.TEXT,     value: 'Vous me dîtes si l\'itinéraire que je vous propose vous correspond.' },
    { key: 'offers/step4-title',       type: ContentType.TEXT,     value: 'Vous partez' },
    { key: 'offers/step4-description',       type: ContentType.TEXT,     value: 'Vous n\'avez plus qu\'à réserver vos hébergements et activités et profiter.' },

    // ── Page Offre Lune de Douceurs ──────────────────────────────────────────────
    { key: 'offer-lune-de-douceurs/hero-image', type: ContentType.IMAGE, value: '/images/image-placeholder-2.png' },
    { key: 'offer-lune-de-douceurs/hero-title', type: ContentType.TEXT, value: 'Lune de Douceurs' },
    { key: 'offer-lune-de-douceurs/hero-subtitle', type: ContentType.TEXT, value: 'Un voyage unique pour célébrer le plus beau des commencements.' },
    { key: 'offer-lune-de-douceurs/hero-tagline', type: ContentType.TEXT, value: 'Offre voyage de noces' },
    { key: 'offer-lune-de-douceurs/for-who-title', type: ContentType.TEXT, value: 'Pour qui ?' },
    { key: 'offer-lune-de-douceurs/for-who-base-title', type: ContentType.TEXT, value: 'base' },
    { key: 'offer-lune-de-douceurs/for-who-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
    { key: 'offer-lune-de-douceurs/for-who-location', type: ContentType.TEXT, value: 'Le monde entier' },
    { key: 'offer-lune-de-douceurs/for-who-image', type: ContentType.IMAGE, value: '/images/image-placeholder-1.jpg' },
    { key: 'offer-lune-de-douceurs/included-title', type: ContentType.TEXT, value: 'ce qui est inclus' },
    { key: 'offer-lune-de-douceurs/included-item-1', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit' },
    { key: 'offer-lune-de-douceurs/included-item-2', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit' },
    { key: 'offer-lune-de-douceurs/included-item-3', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit' },
    { key: 'offer-lune-de-douceurs/included-item-4', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit' },
    { key: 'offer-lune-de-douceurs/formulas-title', type: ContentType.TEXT, value: 'Nos Formules' },
    { key: 'offer-lune-de-douceurs/formula-1-title', type: ContentType.TEXT, value: 'Forfait Lune De Douceurs' },
    { key: 'offer-lune-de-douceurs/formula-1-duration', type: ContentType.TEXT, value: '10 à 15 jours' },
    { key: 'offer-lune-de-douceurs/formula-1-price', type: ContentType.TEXT, value: '500 à 800 euros *' },
    { key: 'offer-lune-de-douceurs/formula-2-title', type: ContentType.TEXT, value: 'Forfait Long Séjour' },
    { key: 'offer-lune-de-douceurs/formula-2-duration', type: ContentType.TEXT, value: '+ 15 jours' },
    { key: 'offer-lune-de-douceurs/formula-2-price', type: ContentType.TEXT, value: 'Sur devis' },
    { key: 'offer-lune-de-douceurs/asterisk-note', type: ContentType.TEXT, value: '* Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },

    // ── Page Offre L'Échappée Douce ──────────────────────────────────────────────
    { key: 'offer-echappee-douce/hero-image', type: ContentType.IMAGE, value: '/images/image-placeholder-2.png' },
    { key: 'offer-echappee-douce/hero-title', type: ContentType.TEXT, value: 'L\'Échappée Douce' },
    { key: 'offer-echappee-douce/hero-subtitle', type: ContentType.TEXT, value: 'L\'organisation complète d\'un voyage sur mesure, de A à Z.' },
    { key: 'offer-echappee-douce/hero-tagline', type: ContentType.TEXT, value: 'Offre premium' },
    { key: 'offer-echappee-douce/for-who-title', type: ContentType.TEXT, value: 'Pour qui ?' },
    { key: 'offer-echappee-douce/for-who-base-title', type: ContentType.TEXT, value: 'base' },
    { key: 'offer-echappee-douce/for-who-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
    { key: 'offer-echappee-douce/for-who-location', type: ContentType.TEXT, value: '1 à 4 personnes - 2 étapes maximum incluses' },
    { key: 'offer-echappee-douce/for-who-image', type: ContentType.IMAGE, value: '/images/image-placeholder-1.jpg' },
    { key: 'offer-echappee-douce/formulas-title', type: ContentType.TEXT, value: 'Nos Formules' },
    { key: 'offer-echappee-douce/formula-1-title', type: ContentType.TEXT, value: 'Escapade' },
    { key: 'offer-echappee-douce/formula-1-duration', type: ContentType.TEXT, value: '2 à 4 jours (Citytrip / Weekend)' },
    { key: 'offer-echappee-douce/formula-1-price', type: ContentType.TEXT, value: '150 euros' },
    { key: 'offer-echappee-douce/formula-2-title', type: ContentType.TEXT, value: 'Exploration' },
    { key: 'offer-echappee-douce/formula-2-duration', type: ContentType.TEXT, value: '5 à 8 jours (Court séjours)' },
    { key: 'offer-echappee-douce/formula-2-price', type: ContentType.TEXT, value: '350 euros' },
    { key: 'offer-echappee-douce/formula-3-title', type: ContentType.TEXT, value: 'Grand Voyage' },
    { key: 'offer-echappee-douce/formula-3-duration', type: ContentType.TEXT, value: '9 à 15 jours (Road trip / Rail trip)' },
    { key: 'offer-echappee-douce/formula-3-price', type: ContentType.TEXT, value: '450 à 750 euros' },
    { key: 'offer-echappee-douce/formula-4-title', type: ContentType.TEXT, value: 'Odyssée' },
    { key: 'offer-echappee-douce/formula-4-duration', type: ContentType.TEXT, value: '+ 16 jours' },
    { key: 'offer-echappee-douce/formula-4-price', type: ContentType.TEXT, value: 'Sur devis' },
    { key: 'offer-echappee-douce/options-title', type: ContentType.TEXT, value: 'options et suppléments' },
    { key: 'offer-echappee-douce/option-1', type: ContentType.TEXT, value: 'Groupe (+ de 5 personnes) : supplément de 50 euros' },
    { key: 'offer-echappee-douce/option-2', type: ContentType.TEXT, value: 'Etape supplémentaire (au-delà de 2) : supplément de 40 euros par étape' },

    // ── Page Offre L'Impulsion Douce ──────────────────────────────────────────────
    { key: 'offer-impulsion-douce/hero-image', type: ContentType.IMAGE, value: '/images/image-placeholder-2.png' },
    { key: 'offer-impulsion-douce/hero-title', type: ContentType.TEXT, value: 'L\'Impulsion Douce' },
    { key: 'offer-impulsion-douce/hero-subtitle', type: ContentType.TEXT, value: 'Un coup de pouce pour organiser un voyage en toute autonomie.' },
    { key: 'offer-impulsion-douce/hero-tagline', type: ContentType.TEXT, value: 'Offre Coup de Pouce' },
    { key: 'offer-impulsion-douce/for-who-title', type: ContentType.TEXT, value: 'Pour qui ?' },
    { key: 'offer-impulsion-douce/for-who-perimeter-title', type: ContentType.TEXT, value: 'Périmètre' },
    { key: 'offer-impulsion-douce/for-who-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
    { key: 'offer-impulsion-douce/for-who-location', type: ContentType.TEXT, value: 'France & Europe - Durée : 1 à 2 semaines' },
    { key: 'offer-impulsion-douce/for-who-image', type: ContentType.IMAGE, value: '/images/image-placeholder-1.jpg' },
    { key: 'offer-impulsion-douce/menus-title', type: ContentType.TEXT, value: 'Les 4 Menus disponibles' },
    { key: 'offer-impulsion-douce/menu-1-title', type: ContentType.TEXT, value: 'La Boussole' },
    { key: 'offer-impulsion-douce/menu-1-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit.' },
    { key: 'offer-impulsion-douce/menu-2-title', type: ContentType.TEXT, value: 'Le trajet serein' },
    { key: 'offer-impulsion-douce/menu-2-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit.' },
    { key: 'offer-impulsion-douce/menu-3-title', type: ContentType.TEXT, value: 'Le Cocon' },
    { key: 'offer-impulsion-douce/menu-3-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit.' },
    { key: 'offer-impulsion-douce/menu-4-title', type: ContentType.TEXT, value: 'Les Pépites' },
    { key: 'offer-impulsion-douce/menu-4-description', type: ContentType.TEXT, value: 'Duis aute irure dolor in reprehenderit in voluptate velit.' },
    { key: 'offer-impulsion-douce/formulas-title', type: ContentType.TEXT, value: 'Nos Formules' },
    { key: 'offer-impulsion-douce/formula-1-title', type: ContentType.TEXT, value: 'Menu à la Carte' },
    { key: 'offer-impulsion-douce/formula-1-description', type: ContentType.TEXT, value: '1 Menu au choix parmi les 4' },
    { key: 'offer-impulsion-douce/formula-1-price', type: ContentType.TEXT, value: '50 euros' },
    { key: 'offer-impulsion-douce/formula-2-title', type: ContentType.TEXT, value: 'Pack Duo' },
    { key: 'offer-impulsion-douce/formula-2-description', type: ContentType.TEXT, value: '2 Menus au choix' },
    { key: 'offer-impulsion-douce/formula-2-price', type: ContentType.TEXT, value: '90 euros' },
    { key: 'offer-impulsion-douce/formula-3-title', type: ContentType.TEXT, value: 'Pack Trio' },
    { key: 'offer-impulsion-douce/formula-3-description', type: ContentType.TEXT, value: '3 Menus au choix' },
    { key: 'offer-impulsion-douce/formula-3-price', type: ContentType.TEXT, value: '140 euros' },

    // ── Pages Légales ──────────────────────────────────────────────
    // CGV
    { key: 'cgv/hero-title', type: ContentType.RICHTEXT, value: 'Conditions Générales<br />de Vente' },
    { key: 'cgv/hero-subtitle', type: ContentType.TEXT, value: 'Découvrez nos conditions de vente et d\'utilisation' },
    { key: 'cgv/content', type: ContentType.RICHTEXT, value: '<p>Le contenu des conditions générales de vente sera disponible prochainement.</p>' },

    // Privacy
    { key: 'privacy/hero-title', type: ContentType.RICHTEXT, value: 'Politique de<br />Confidentialité' },
    { key: 'privacy/hero-subtitle', type: ContentType.TEXT, value: 'Comment nous protégeons vos données personnelles' },
    { key: 'privacy/content', type: ContentType.RICHTEXT, value: '<p>Le contenu de la politique de confidentialité sera disponible prochainement.</p>' },

    // Legal
    { key: 'legal/hero-title', type: ContentType.RICHTEXT, value: 'Mentions<br />Légales' },
    { key: 'legal/hero-subtitle', type: ContentType.TEXT, value: 'Informations légales et mentions obligatoires' },
    { key: 'legal/hero-image', type: ContentType.IMAGE, value: '/images/image-placeholder-2.png' },
    { key: 'legal/content', type: ContentType.RICHTEXT, value: '<p>Le contenu des mentions légales sera disponible prochainement.</p>' },
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