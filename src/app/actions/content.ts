'use server';

import { prisma } from '@/lib/prisma';
import { revalidateContentPaths } from '@/lib/cache';
import type { SiteContent } from '@prisma/client';

export async function getAllContent(): Promise<SiteContent[]> {
    return prisma.siteContent.findMany({ orderBy: { key: 'asc' } });
}

export type UpdateTextResult = { success: boolean; error?: string };

export async function updateText(
    key: string,
    value: string
): Promise<UpdateTextResult> {
    try {
        await prisma.siteContent.update({ where: { key }, data: { value } });

        revalidateContentPaths();

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Erreur lors de la mise à jour.' };
    }
}
