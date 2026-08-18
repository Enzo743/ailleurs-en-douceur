import { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { OfferPageTemplate } from "@/components/layout";

export const metadata: Metadata = {
  title: "Lune de Douceurs - Ailleurs en Douceur",
  description: "Un voyage unique pour célébrer le plus beau des commencements - Offre voyage de noces",
};

export default async function LuneDeDouceursPage() {
  const c = await getSiteContent();

  const content = {
    heroImage: c['offer-lune-de-douceurs/hero-image'],
    heroTitle: c['offer-lune-de-douceurs/hero-title'],
    heroSubtitle: c['offer-lune-de-douceurs/hero-subtitle'],
    heroTagline: c['offer-lune-de-douceurs/hero-tagline'],
    forWhoTitle: c['offer-lune-de-douceurs/for-who-title'],
    forWhoBaseTitle: c['offer-lune-de-douceurs/for-who-base-title'],
    forWhoDescription: c['offer-lune-de-douceurs/for-who-description'],
    forWhoLocation: c['offer-lune-de-douceurs/for-who-location'],
    forWhoImage: c['offer-lune-de-douceurs/for-who-image'],
    includedTitle: c['offer-lune-de-douceurs/included-title'],
    includedItems: [
      c['offer-lune-de-douceurs/included-item-1'],
      c['offer-lune-de-douceurs/included-item-2'],
      c['offer-lune-de-douceurs/included-item-3'],
      c['offer-lune-de-douceurs/included-item-4'],
    ],
    formulasTitle: c['offer-lune-de-douceurs/formulas-title'],
    formulas: [
      {
        title: c['offer-lune-de-douceurs/formula-1-title'],
        duration: c['offer-lune-de-douceurs/formula-1-duration'],
        price: c['offer-lune-de-douceurs/formula-1-price'],
      },
      {
        title: c['offer-lune-de-douceurs/formula-2-title'],
        duration: c['offer-lune-de-douceurs/formula-2-duration'],
        price: c['offer-lune-de-douceurs/formula-2-price'],
      },
    ],
    asteriskNote: c['offer-lune-de-douceurs/asterisk-note'],
  };

  return (
    <OfferPageTemplate 
      content={content} 
      currentPage="/offers"
      siteContent={c}
    />
  );
}
