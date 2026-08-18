import { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { OfferPageTemplate } from "@/components/layout";

export const metadata: Metadata = {
  title: "L'Échappée Douce - Ailleurs en Douceur",
  description: "L'organisation complète d'un voyage sur mesure, de A à Z - Offre premium",
};

export default async function EchappeeDoucePage() {
  const c = await getSiteContent();

  const content = {
    heroImage: c['offer-echappee-douce/hero-image'],
    heroTitle: c['offer-echappee-douce/hero-title'],
    heroSubtitle: c['offer-echappee-douce/hero-subtitle'],
    heroTagline: c['offer-echappee-douce/hero-tagline'],
    forWhoTitle: c['offer-echappee-douce/for-who-title'],
    forWhoBaseTitle: c['offer-echappee-douce/for-who-base-title'],
    forWhoDescription: c['offer-echappee-douce/for-who-description'],
    forWhoLocation: c['offer-echappee-douce/for-who-location'],
    forWhoImage: c['offer-echappee-douce/for-who-image'],
    formulasTitle: c['offer-echappee-douce/formulas-title'],
    formulas: [
      {
        title: c['offer-echappee-douce/formula-1-title'],
        duration: c['offer-echappee-douce/formula-1-duration'],
        price: c['offer-echappee-douce/formula-1-price'],
      },
      {
        title: c['offer-echappee-douce/formula-2-title'],
        duration: c['offer-echappee-douce/formula-2-duration'],
        price: c['offer-echappee-douce/formula-2-price'],
      },
      {
        title: c['offer-echappee-douce/formula-3-title'],
        duration: c['offer-echappee-douce/formula-3-duration'],
        price: c['offer-echappee-douce/formula-3-price'],
      },
      {
        title: c['offer-echappee-douce/formula-4-title'],
        duration: c['offer-echappee-douce/formula-4-duration'],
        price: c['offer-echappee-douce/formula-4-price'],
      },
    ],
    optionsTitle: c['offer-echappee-douce/options-title'],
    options: [
      c['offer-echappee-douce/option-1'],
      c['offer-echappee-douce/option-2'],
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
