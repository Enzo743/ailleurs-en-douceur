import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export type SiteContentMap = Record<string, string>;

/**
 * Retourne tous les contenus du site sous forme de dictionnaire clé → valeur.
 * cache() mémoïse la requête pour toute la durée d'un render serveur.
 *
 */
export const getSiteContent: () => Promise<SiteContentMap> = cache(async (): Promise<SiteContentMap> => {
    const rows = await prisma.siteContent.findMany();

    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});

/**
 * Retourne un accesseur de contenu pour un préfixe donné.
 * Ex: prefixedContent(c, 'offer-echappee-douce')('hero-title')
 * lit la clé 'offer-echappee-douce/hero-title'.
 */
export function prefixedContent(content: SiteContentMap, prefix: string): (key: string) => string {
    return (key: string) => content[`${prefix}/${key}`];
}

/**
 * Version non-cachée de getSiteContent pour les composants qui ont besoin de données fraîches.
 * À utiliser avec parcimonie pour éviter les performances inutiles.
 */
export async function getFreshSiteContent(): Promise<SiteContentMap> {
    const rows = await prisma.siteContent.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}