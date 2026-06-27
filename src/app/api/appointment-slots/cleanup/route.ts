import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * POST /api/appointment-slots/cleanup
 * Supprime automatiquement les créneaux passés non réservés
 * Peut être appelé par un cron job pour nettoyer régulièrement
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de la session (optionnel pour un cron job, mais on la garde pour sécurité)
    try {
      await verifySession();
    } catch (e) {
      // Si pas de session valide, on vérifie une clé secrète pour les cron jobs
      const { searchParams } = new URL(request.url);
      const secret = searchParams.get('secret');
      const expectedSecret = process.env.CRON_SECRET;
      
      if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json(
          { success: false, error: 'Non autorisé' },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = now.toTimeString().split(' ')[0]; // Format HH:MM:SS
    
    // Supprimer tous les créneaux dont l'heure de début est dans le passé et n'ont pas de rendez-vous
    const result = await prisma.appointmentSlot.deleteMany({
      where: {
        OR: [
          {
            date: {
              lt: today,
            },
          },
          {
            date: today,
            startTime: {
              lt: currentTime,
            },
          },
        ],
        isAvailable: true,
        appointment: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Nettoyage terminé: ${result.count} créneau(x) passé(s) non réservé(s) supprimé(s)`,
        data: {
          deletedCount: result.count,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error cleaning up appointment slots:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors du nettoyage des créneaux',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
