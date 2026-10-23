import { Metadata } from "next";
import { getSiteContent, prefixedContent } from "@/lib/content";
import { OfferPageTemplate } from "@/components/layout";

export const metadata: Metadata = {
  title: "L'Échappée Douce - Ailleurs en Douceur",
  description: "L'organisation complète d'un voyage sur mesure, de A à Z - Offre premium",
};

export const dynamic = 'force-dynamic';

export default async function EchappeeDoucePage() {
  const c = await getSiteContent();
  const t = prefixedContent(c, 'offer-echappee-douce');

  const content = {
    heroImage: t('hero-image'),
    heroTitle: t('hero-title'),
    heroSubtitle: t('hero-subtitle'),
    heroTagline: t('hero-tagline'),
    forWhoTitle: t('for-who-title'),
    forWhoBaseTitle: t('for-who-base-title'),
    forWhoDescription: t('for-who-description'),
    forWhoLocation: t('for-who-location'),
    forWhoImage: t('for-who-image'),
    forWhoRichText: t('for-who-rich-text'),
    formulasTitle: t('formulas-title'),
    formulas: [1, 2, 3, 4].map((n) => ({
      title: t(`formula-${n}-title`),
      duration: t(`formula-${n}-duration`),
      price: t(`formula-${n}-price`),
    })),
    optionsTitle: t('options-title'),
    options: [
      t('option-1'),
      t('option-2'),
    ],
  };

  return (
    <OfferPageTemplate
      content={content}
      currentPage="/offers"
      siteContent={c}
    />
  );
}
