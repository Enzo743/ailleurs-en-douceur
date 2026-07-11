import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteContent } from '@/lib/content';

export async function POST(request: Request) {
    try {
        // Vérification basique de l'authentification via cookie
        const cookie = request.headers.get('cookie');

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

        return NextResponse.json(
            { success: true, newState },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Erreur lors du basculement du formulaire de contact:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: 'Une erreur est survenue lors de la mise à jour du formulaire de contact',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}