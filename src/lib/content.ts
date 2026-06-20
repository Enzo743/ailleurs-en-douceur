import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@prisma/client';

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
 * Filtre uniquement les contenus d'un type donné.
 */
export const getSiteContentByType = cache(
    async (type: ContentType): Promise<SiteContentMap> => {
        const rows = await prisma.siteContent.findMany({ where: { type } });
        return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    }
);