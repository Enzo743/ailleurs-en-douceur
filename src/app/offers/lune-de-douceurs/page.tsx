import { Metadata } from "next";
import { getSiteContent, prefixedContent } from "@/lib/content";
import { OfferPageTemplate } from "@/components/layout";

export const metadata: Metadata = {
  title: "Lune de Douceurs - Ailleurs en Douceur",
  description: "Un voyage unique pour célébrer le plus beau des commencements - Offre voyage de noces",
};

export const dynamic = 'force-dynamic';

export default async function LuneDeDouceursPage() {
  const c = await getSiteContent();
  const t = prefixedContent(c, 'offer-lune-de-douceurs');

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
    includedTitle: t('included-title'),
    includedItems: [1, 2, 3, 4].map((n) => t(`included-item-${n}`)),
    formulasTitle: t('formulas-title'),
    formulas: [1, 2].map((n) => ({
      title: t(`formula-${n}-title`),
      duration: t(`formula-${n}-duration`),
      price: t(`formula-${n}-price`),
    })),
    asteriskNote: t('asterisk-note'),
  };

  return (
    <OfferPageTemplate
      content={content}
      currentPage="/offers"
      siteContent={c}
    />
  );
}
