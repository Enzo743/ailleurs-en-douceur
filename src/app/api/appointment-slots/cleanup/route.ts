import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cleanupExpiredSlots } from '@/lib/time';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * POST /api/appointment-slots/cleanup
 * Supprime automatiquement les createaux passes non reserves
 * Peut etre appele par un cron job pour nettoyer regulierement
 */
export async function POST(request: NextRequest) {
  try {
    // Verification de la session (optionnel pour un cron job, mais on la garde pour securite)
    try {
      await verifySession();
    } catch (e) {
      // Si pas de session valide, on verifie une cle secreta pour les cron jobs
      const { searchParams } = new URL(request.url);
      const secret = searchParams.get('secret');
      const expectedSecret = process.env.CRON_SECRET;
      
      if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json(
          { success: false, error: 'Non autorise' },
          { status: 401 }
        );
      }
    }

    // Nettoyer automatiquement les createaux passes non reserves
    const deletedCount = await cleanupExpiredSlots(prisma);

    return NextResponse.json(
      {
        success: true,
        message: `Nettoyage termine: ${deletedCount} createau(x) passe(s) non reserve(s) supprime(s)`,
        data: {
          deletedCount,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error cleaning up appointment slots:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors du nettoyage des createaux',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
