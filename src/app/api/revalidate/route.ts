import { revalidatePath } from 'next/cache';
import { apiError, apiSuccess, serverError } from '@/lib/api';

export async function POST(request: Request) {
    try {
        const { path } = await request.json();

        if (!path) {
            return apiError('Path is required');
        }

        // Revalider le path spécifié
        revalidatePath(path);

        return apiSuccess({ revalidated: path });

    } catch (error: any) {
        return serverError(
            'Erreur lors de la revalidation:',
            'Une erreur est survenue lors de la revalidation',
            error,
            { message: process.env.NODE_ENV === 'development' ? error.message : undefined }
        );
    }
}
