import { Metadata } from "next";
import { getSiteContent, prefixedContent } from "@/lib/content";
import { OfferPageTemplate } from "@/components/layout";

export const metadata: Metadata = {
  title: "L'Impulsion Douce - Ailleurs en Douceur",
  description: "Un coup de pouce pour organiser un voyage en toute autonomie - Offre Coup de Pouce",
};

export const dynamic = 'force-dynamic';

export default async function ImpulsionDoucePage() {
  const c = await getSiteContent();
  const t = prefixedContent(c, 'offer-impulsion-douce');

  const content = {
    heroImage: t('hero-image'),
    heroTitle: t('hero-title'),
    heroSubtitle: t('hero-subtitle'),
    heroTagline: t('hero-tagline'),
    forWhoTitle: t('for-who-title'),
    forWhoPerimeterTitle: t('for-who-perimeter-title'),
    forWhoDescription: t('for-who-description'),
    forWhoLocation: t('for-who-location'),
    forWhoImage: t('for-who-image'),
    forWhoRichText: t('for-who-rich-text'),
    menusTitle: t('menus-title'),
    menus: [1, 2, 3, 4].map((n) => ({
      title: t(`menu-${n}-title`),
      description: t(`menu-${n}-description`),
    })),
    formulasTitle: t('formulas-title'),
    formulas: [1, 2, 3].map((n) => ({
      title: t(`formula-${n}-title`),
      description: t(`formula-${n}-description`),
      price: t(`formula-${n}-price`),
    })),
  };

  return (
    <OfferPageTemplate
      content={content}
      currentPage="/offers"
      siteContent={c}
    />
  );
}
