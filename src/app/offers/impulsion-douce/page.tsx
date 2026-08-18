import { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { OfferPageTemplate } from "@/components/layout";

export const metadata: Metadata = {
  title: "L'Impulsion Douce - Ailleurs en Douceur",
  description: "Un coup de pouce pour organiser un voyage en toute autonomie - Offre Coup de Pouce",
};

export default async function ImpulsionDoucePage() {
  const c = await getSiteContent();

  const content = {
    heroImage: c['offer-impulsion-douce/hero-image'],
    heroTitle: c['offer-impulsion-douce/hero-title'],
    heroSubtitle: c['offer-impulsion-douce/hero-subtitle'],
    heroTagline: c['offer-impulsion-douce/hero-tagline'],
    forWhoTitle: c['offer-impulsion-douce/for-who-title'],
    forWhoPerimeterTitle: c['offer-impulsion-douce/for-who-perimeter-title'],
    forWhoDescription: c['offer-impulsion-douce/for-who-description'],
    forWhoLocation: c['offer-impulsion-douce/for-who-location'],
    forWhoImage: c['offer-impulsion-douce/for-who-image'],
    menusTitle: c['offer-impulsion-douce/menus-title'],
    menus: [
      {
        title: c['offer-impulsion-douce/menu-1-title'],
        description: c['offer-impulsion-douce/menu-1-description'],
      },
      {
        title: c['offer-impulsion-douce/menu-2-title'],
        description: c['offer-impulsion-douce/menu-2-description'],
      },
      {
        title: c['offer-impulsion-douce/menu-3-title'],
        description: c['offer-impulsion-douce/menu-3-description'],
      },
      {
        title: c['offer-impulsion-douce/menu-4-title'],
        description: c['offer-impulsion-douce/menu-4-description'],
      },
    ],
    formulasTitle: c['offer-impulsion-douce/formulas-title'],
    formulas: [
      {
        title: c['offer-impulsion-douce/formula-1-title'],
        description: c['offer-impulsion-douce/formula-1-description'],
        price: c['offer-impulsion-douce/formula-1-price'],
      },
      {
        title: c['offer-impulsion-douce/formula-2-title'],
        description: c['offer-impulsion-douce/formula-2-description'],
        price: c['offer-impulsion-douce/formula-2-price'],
      },
      {
        title: c['offer-impulsion-douce/formula-3-title'],
        description: c['offer-impulsion-douce/formula-3-description'],
        price: c['offer-impulsion-douce/formula-3-price'],
      },
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
