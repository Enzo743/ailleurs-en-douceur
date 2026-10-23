import { prisma } from '@/lib/prisma';
import { getSiteContent } from '@/lib/content';
import { revalidatePath } from 'next/cache';
import { apiSuccess, serverError } from '@/lib/api';

export async function POST(request: Request) {
    try {
        // Lire l'état actuel
        const content = await getSiteContent();
        const isCurrentlyEnabled = content['contact/form-enabled'] === 'true';

        // Basculer l'état
        const newState = !isCurrentlyEnabled;

        await prisma.siteContent.upsert({
            where: { key: 'contact/form-enabled' },
            update: { value: newState ? 'true' : 'false' },
            create: {
                key: 'contact/form-enabled',
                type: 'TEXT',
                value: newState ? 'true' : 'false'
            }
        });

        // Revalider les pages concernées
        revalidatePath('/contact');
        revalidatePath('/');

        return apiSuccess({ newState });

    } catch (error: any) {
        return serverError(
            'Erreur lors du basculement du formulaire de contact:',
            'Une erreur est survenue lors de la mise à jour du formulaire de contact',
            error,
            { message: process.env.NODE_ENV === 'development' ? error.message : undefined }
        );
    }
}
