import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // Récupérer tous les paramètres du bandeau
        const bannerContent = await prisma.siteContent.findMany({
            where: {
                key: {
                    startsWith: 'banner/'
                }
            }
        });

        // Parser les paramètres
        const bannerSettings = {
            isEnabled: bannerContent.find(item => item.key === 'banner/enabled')?.value === 'true' || false,
            text: bannerContent.find(item => item.key === 'banner/text')?.value || '',
            color: bannerContent.find(item => item.key === 'banner/color')?.value || '#d4a373',
            duration: (bannerContent.find(item => item.key === 'banner/duration')?.value || 'permanent') as 'permanent' | 'temporary',
            endDate: bannerContent.find(item => item.key === 'banner/endDate')?.value || null
        };

        return NextResponse.json(
            { success: true, ...bannerSettings },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Erreur lors de la récupération des paramètres du bandeau:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: 'Une erreur est survenue lors de la récupération des paramètres du bandeau',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { isEnabled, text, color, duration, endDate } = body;

        // Mettre à jour ou créer chaque paramètre du bandeau
        await prisma.siteContent.upsert({
            where: { key: 'banner/enabled' },
            update: { value: isEnabled ? 'true' : 'false' },
            create: { 
                key: 'banner/enabled',
                type: 'TEXT',
                value: isEnabled ? 'true' : 'false'
            }
        });

        await prisma.siteContent.upsert({
            where: { key: 'banner/text' },
            update: { value: text },
            create: { 
                key: 'banner/text',
                type: 'TEXT',
                value: text
            }
        });

        await prisma.siteContent.upsert({
            where: { key: 'banner/color' },
            update: { value: color },
            create: { 
                key: 'banner/color',
                type: 'TEXT',
                value: color
            }
        });

        await prisma.siteContent.upsert({
            where: { key: 'banner/duration' },
            update: { value: duration },
            create: { 
                key: 'banner/duration',
                type: 'TEXT',
                value: duration
            }
        });

        if (duration === 'temporary' && endDate) {
            await prisma.siteContent.upsert({
                where: { key: 'banner/endDate' },
                update: { value: endDate },
                create: { 
                    key: 'banner/endDate',
                    type: 'TEXT',
                    value: endDate
                }
            });
        } else if (duration === 'permanent') {
            // Supprimer la date de fin si le bandeau est permanent
            await prisma.siteContent.deleteMany({
                where: { key: 'banner/endDate' }
            });
        }

        return NextResponse.json(
            { success: true, message: 'Bandeau mis à jour avec succès' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du bandeau:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: 'Une erreur est survenue lors de la mise à jour du bandeau',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}