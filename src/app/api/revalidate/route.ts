import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
    try {
        const { path } = await request.json();

        if (!path) {
            return NextResponse.json(
                { error: 'Path is required' },
                { status: 400 }
            );
        }

        // Revalider le path spécifié
        revalidatePath(path);

        return NextResponse.json(
            { success: true, revalidated: path },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Erreur lors de la revalidation:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: 'Une erreur est survenue lors de la revalidation',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}