'use server';

import { prisma } from '@/lib/prisma';
import { revalidateContentPaths } from '@/lib/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { SiteContent } from '@prisma/client';
import { DEFAULT_VALUES } from '@/lib/constants';

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

export type UploadImageResult = { success: boolean; url?: string; error?: string };

export async function uploadImage(
    key: string,
    formData: FormData
): Promise<UploadImageResult> {
    try {
        const file = formData.get('file') as File | null;

        if (!file || file.size === 0)
            return { success: false, error: 'Aucun fichier sélectionné.' };

        const allowed: string[] = [...DEFAULT_VALUES.ALLOWED_IMAGE_TYPES];

        if (!allowed.includes(file.type))
            return { success: false, error: `Format non autorisé (${allowed.map(t => t.replace('image/', '')).join(', ')}).` };

        if (file.size > DEFAULT_VALUES.MAX_FILE_SIZE)
            return { success: false, error: `Fichier trop volumineux (max ${Math.round(DEFAULT_VALUES.MAX_FILE_SIZE / (1024 * 1024))} Mo).` };

        const ext: string | undefined      = file.name.split('.').pop();
        const safeName = `${key.replace(/\//g, '-')}-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(
            path.join(uploadDir, safeName),
            Buffer.from(await file.arrayBuffer())
        );

        const url = `/uploads/${safeName}`;

        await prisma.siteContent.update({ where: { key }, data: { value: url } });

        revalidateContentPaths();

        return { success: true, url };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Erreur lors de l'upload." };
    }
}