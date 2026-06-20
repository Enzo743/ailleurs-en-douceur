'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
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

        revalidatePath('/');
        revalidatePath('/dashboard/content');

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

        const allowed: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

        if (!allowed.includes(file.type))
            return { success: false, error: 'Format non autorisé (jpg, png, webp, gif, svg).' };

        if (file.size > 5 * 1024 * 1024)
            return { success: false, error: 'Fichier trop volumineux (max 5 Mo).' };

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

        revalidatePath('/');
        revalidatePath('/dashboard/content');

        return { success: true, url };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Erreur lors de l'upload." };
    }
}