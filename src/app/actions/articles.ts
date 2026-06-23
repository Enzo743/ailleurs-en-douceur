'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { slugify } from '@/lib/slugify';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { Article, Tag } from '@prisma/client';

export type ArticleWithTags = Article & { tags: Tag[] };

export type ArticleFormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    tagNames: string[];
    published: boolean;
};

export type ActionResult = { success: boolean; error?: string; id?: string };

export async function getArticles(): Promise<ArticleWithTags[]> {
    return prisma.article.findMany({
        include: { tags: true },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getArticleCount(): Promise<number> {
    return prisma.article.count();
}

export async function getArticle(id: string): Promise<ArticleWithTags | null> {
    return prisma.article.findUnique({
        where: { id },
        include: { tags: true },
    });
}

export async function getAllTags(): Promise<Tag[]> {
    return prisma.tag.findMany({ orderBy: { name: 'asc' } });
}

async function resolveTags(tagNames: string[]): Promise<{ id: string }[]> {
    const uniqueNames = [...new Set(
        tagNames.map((n) => n.trim()).filter(Boolean)
    )];

    const tags = await Promise.all(
        uniqueNames.map(async (name) => {
            const tagSlug = slugify(name);
            if (!tagSlug) return null;

            return prisma.tag.upsert({
                where: { slug: tagSlug },
                create: { name, slug: tagSlug },
                update: { name },
            });
        })
    );

    return tags.filter((t): t is Tag => t !== null).map((t) => ({ id: t.id }));
}

function revalidateArticlePaths(id?: string): void {
    revalidatePath('/dashboard/articles');
    if (id) revalidatePath(`/dashboard/articles/${id}/edit`);
}

export async function createArticle(data: ArticleFormData): Promise<ActionResult> {
    await verifySession();

    try {
        const slug = slugify(data.slug || data.title);
        if (!slug) return { success: false, error: 'Le slug est invalide.' };
        if (!data.title.trim()) return { success: false, error: 'Le titre est requis.' };

        const tags = await resolveTags(data.tagNames);

        const article = await prisma.article.create({
            data: {
                title: data.title.trim(),
                slug,
                excerpt: data.excerpt.trim() || null,
                content: data.content,
                coverImage: data.coverImage || null,
                published: data.published,
                publishedAt: data.published ? new Date() : null,
                tags: { connect: tags },
            },
        });

        revalidateArticlePaths(article.id);
        return { success: true, id: article.id };
    } catch (e) {
        console.error(e);
        if (e instanceof Error && e.message.includes('Unique constraint')) {
            return { success: false, error: 'Ce slug est déjà utilisé.' };
        }
        return { success: false, error: 'Erreur lors de la création.' };
    }
}

export async function updateArticle(id: string, data: ArticleFormData): Promise<ActionResult> {
    await verifySession();

    try {
        const existing = await prisma.article.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Article introuvable.' };

        const slug = slugify(data.slug || data.title);
        if (!slug) return { success: false, error: 'Le slug est invalide.' };
        if (!data.title.trim()) return { success: false, error: 'Le titre est requis.' };

        const tags = await resolveTags(data.tagNames);

        let publishedAt = existing.publishedAt;
        if (data.published && !existing.published) {
            publishedAt = new Date();
        } else if (!data.published) {
            publishedAt = null;
        }

        await prisma.article.update({
            where: { id },
            data: {
                title: data.title.trim(),
                slug,
                excerpt: data.excerpt.trim() || null,
                content: data.content,
                coverImage: data.coverImage || null,
                published: data.published,
                publishedAt,
                tags: { set: tags },
            },
        });

        revalidateArticlePaths(id);
        return { success: true, id };
    } catch (e) {
        console.error(e);
        if (e instanceof Error && e.message.includes('Unique constraint')) {
            return { success: false, error: 'Ce slug est déjà utilisé.' };
        }
        return { success: false, error: 'Erreur lors de la mise à jour.' };
    }
}

export async function deleteArticle(id: string): Promise<ActionResult> {
    await verifySession();

    try {
        await prisma.article.delete({ where: { id } });
        revalidateArticlePaths();
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Erreur lors de la suppression.' };
    }
}

export type UploadImageResult = { success: boolean; url?: string; error?: string };

export async function uploadArticleImage(formData: FormData): Promise<UploadImageResult> {
    await verifySession();

    try {
        const file = formData.get('file') as File | null;

        if (!file || file.size === 0)
            return { success: false, error: 'Aucun fichier sélectionné.' };

        const allowed: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

        if (!allowed.includes(file.type))
            return { success: false, error: 'Format non autorisé (jpg, png, webp, gif, svg).' };

        if (file.size > 5 * 1024 * 1024)
            return { success: false, error: 'Fichier trop volumineux (max 5 Mo).' };

        const ext: string | undefined = file.name.split('.').pop();
        const safeName = `article-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(
            path.join(uploadDir, safeName),
            Buffer.from(await file.arrayBuffer())
        );

        return { success: true, url: `/uploads/${safeName}` };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Erreur lors de l'upload." };
    }
}
