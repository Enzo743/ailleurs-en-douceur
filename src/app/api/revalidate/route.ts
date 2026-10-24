import { revalidatePath } from 'next/cache';
import { apiError, apiSuccess, serverError, devErrorDetail } from '@/lib/api';

export async function POST(request: Request) {
    try {
        const { path } = await request.json();

        if (!path) {
            return apiError('Path is required');
        }

        // Revalider le path spécifié
        revalidatePath(path);

        return apiSuccess({ revalidated: path });

    } catch (error) {
        return serverError(
            'Erreur lors de la revalidation:',
            'Une erreur est survenue lors de la revalidation',
            error,
            { message: devErrorDetail(error) }
        );
    }
}
