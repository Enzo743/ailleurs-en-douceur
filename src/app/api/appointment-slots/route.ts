import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { doSlotsOverlap, cleanupExpiredSlots, getTodayAtMidnight, calculateDuration, isValidTimeFormat } from '@/lib/time';
import { getEmailConfig, getScheduleUrl } from '@/lib/email';
import { validateAppointmentSlot, type AppointmentSlotData } from '@/lib/validation';

// ============================================================================
// Types
// ============================================================================

interface AppointmentSlotQueryParams {
  date?: string;
  isAvailable?: string;
  page?: string;
  limit?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// GET /api/appointment-slots
// ============================================================================

/**
 * Liste tous les createaux disponibles avec pagination et filtres
 * Accessible publiquement pour afficher les createaux dans le formulaire client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query: AppointmentSlotQueryParams = {
      date: searchParams.get('date') || undefined,
      isAvailable: searchParams.get('isAvailable') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    };

    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(query.limit || '50')));
    const skip = (page - 1) * limit;

    // Construire la condition de filtrage
    const where: any = {};
    
    if (query.date) {
      // Filtrer par date (format: YYYY-MM-DD)
      const dateObj = new Date(query.date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: dateObj,
        lt: nextDay,
      };
    }
    
    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable === 'true';
    }
    
    // Ne montrer que les createaux disponibles par defaut
    where.isAvailable = true;

    // Recuperer les createaux avec leurs rendez-vous
    const [slots, total] = await Promise.all([
      prisma.appointmentSlot.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' },
        ],
        include: {
          appointment: {
            select: {
              id: true,
              googleEventId: true,
              meetLink: true,
              status: true,
            },
          },
        },
      }),
      prisma.appointmentSlot.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Formater les donnees
    const formattedData = slots.map((slot) => ({
      id: slot.id,
      date: slot.date.toISOString().split('T')[0], // Format YYYY-MM-DD
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      isAvailable: slot.isAvailable,
      createdAt: slot.createdAt,
      appointment: slot.appointment ? {
        id: slot.appointment.id,
        googleEventId: slot.appointment.googleEventId,
        meetLink: slot.appointment.meetLink,
        status: slot.appointment.status,
      } : null,
    }));

    const response: ApiResponse = {
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching appointment slots:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la recuperation des createaux',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/appointment-slots
// ============================================================================

/**
 * Cree un nouveau createau de rendez-vous
 * Necessite une session valide
 */
export async function POST(request: NextRequest) {
  try {
    // Verification de la session
    await verifySession();

    const body: AppointmentSlotData = await request.json();

    // Validation complete
    const validation = validateAppointmentSlot(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.errors[0]?.error || 'Donnees invalides',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Validation du format des heures
    if (!isValidTimeFormat(body.startTime) || !isValidTimeFormat(body.endTime)) {
      return NextResponse.json(
        { success: false, error: 'Les heures doivent etre au format HH:MM' },
        { status: 400 }
      );
    }

    // Calculer la duree en minutes
    const duration = calculateDuration(body.startTime, body.endTime);

    if (duration <= 0) {
      return NextResponse.json(
        { success: false, error: 'L\'heure de fin doit etre posterieure a l\'heure de debut' },
        { status: 400 }
      );
    }

    // Convertir la date au format Date
    const dateObj = body.date instanceof Date ? body.date : new Date(body.date);

    // Verifier qu'il n'y a pas deja un createau qui se chevauche
    const existingSlots = await prisma.appointmentSlot.findMany({
      where: {
        date: dateObj,
      },
    });

    for (const existingSlot of existingSlots) {
      if (doSlotsOverlap(
        dateObj,
        body.startTime,
        body.endTime,
        existingSlot.date,
        existingSlot.startTime,
        existingSlot.endTime
      )) {
        return NextResponse.json(
          { success: false, error: 'Un createau existe deja a cette heure ou se chevauche avec un createau existant' },
          { status: 400 }
        );
      }
    }

    // Verifier la disponibilite dans Google Calendar
    const dateTimeStart = new Date(dateObj);
    dateTimeStart.setHours(
      parseInt(body.startTime.split(':')[0]),
      parseInt(body.startTime.split(':')[1]),
      0,
      0
    );
    
    const dateTimeEnd = new Date(dateObj);
    dateTimeEnd.setHours(
      parseInt(body.endTime.split(':')[0]),
      parseInt(body.endTime.split(':')[1]),
      0,
      0
    );

    // Creer le createau
    const slot = await prisma.appointmentSlot.create({
      data: {
        date: dateObj,
        startTime: body.startTime,
        endTime: body.endTime,
        duration: duration,
        isAvailable: true,
      },
    });

    // Nettoyer automatiquement les createaux passes non reserves
    await cleanupExpiredSlots(prisma);

    return NextResponse.json(
      {
        success: true,
        message: 'Createau cree avec succes',
        data: {
          id: slot.id,
          date: slot.date.toISOString().split('T')[0],
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          isAvailable: slot.isAvailable,
          createdAt: slot.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating appointment slot:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la creation du createau',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/appointment-slots/:id
// ============================================================================

/**
 * Supprime un createau de rendez-vous
 * Necessite une session valide
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verification de la session
    await verifySession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du createau est requis' },
        { status: 400 }
      );
    }

    // Verifier que le createau existe
    const existingSlot = await prisma.appointmentSlot.findUnique({
      where: { id },
      include: { appointment: true },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Createau non trouve' },
        { status: 404 }
      );
    }

    // Verifier qu'il n'y a pas de rendez-vous associe
    if (existingSlot.appointment) {
      // Annuler l'evenement Google Calendar si necessaire
      if (existingSlot.appointment.googleEventId) {
        try {
          const { cancelCalendarEvent } = await import('@/lib/google');
          await cancelCalendarEvent(existingSlot.appointment.googleEventId);
        } catch (error) {
          console.error('Error canceling Google Calendar event:', error);
        }
      }

      // Supprimer le rendez-vous
      await prisma.appointment.delete({
        where: { id: existingSlot.appointment.id },
      });
    }

    // Supprimer le createau
    await prisma.appointmentSlot.delete({
      where: { id },
    });

    // Nettoyer automatiquement les createaux passes non reserves
    await cleanupExpiredSlots(prisma);

    return NextResponse.json(
      {
        success: true,
        message: 'Createau supprime avec succes',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting appointment slot:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la suppression du createau',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Autres methodes HTTP
// ============================================================================

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Methode non autorisee. Utilisez PATCH pour les mises a jour.' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Methode non autorisee' },
    { status: 405 }
  );
}

export async function HEAD() {
  return NextResponse.json(
    { success: false, error: 'Methode non autorisee' },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { success: false, error: 'Methode non autorisee' },
    { status: 405 }
  );
}
