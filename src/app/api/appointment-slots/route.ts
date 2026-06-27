import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTimeSlotAvailability, createMeetEvent, cancelCalendarEvent } from "@/lib/google";
import nodemailer from "nodemailer";

// Types
interface AppointmentSlotQueryParams {
  date?: string;
  isAvailable?: string;
  page?: string;
  limit?: string;
}

interface CreateAppointmentSlotData {
  date: string | Date;
  startTime: string;
  endTime: string;
  duration?: number;
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

// Configuration du transporteur Nodemailer
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = parseInt(process.env.EMAIL_PORT || "587");
  const emailSecure = process.env.EMAIL_SECURE === "true";

  if (!emailUser || !emailPass) {
    throw new Error("Les variables d'environnement EMAIL_USER et EMAIL_PASS sont requises");
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

// Génère l'URL du planning pour le client
const getScheduleUrl = (token: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://votre-domaine.com');
  return `${baseUrl}/schedule/${token}`;
};

// Vérifie si deux créneaux se chevauchent
function doSlotsOverlap(
  date1: string | Date,
  startTime1: string,
  endTime1: string,
  date2: string | Date,
  startTime2: string,
  endTime2: string
): boolean {
  // Convertir les dates en string YYYY-MM-DD pour comparaison
  const date1Str = date1 instanceof Date ? date1.toISOString().split('T')[0] : date1;
  const date2Str = date2 instanceof Date ? date2.toISOString().split('T')[0] : date2;
  
  // Si dates différentes, pas de chevauchement
  if (date1Str !== date2Str) return false;
  
  // Convertir les heures en minutes
  const [h1, m1] = startTime1.split(':').map(Number);
  const [h2, m2] = startTime2.split(':').map(Number);
  const [eh1, em1] = endTime1.split(':').map(Number);
  const [eh2, em2] = endTime2.split(':').map(Number);
  
  const start1 = h1 * 60 + m1;
  const end1 = eh1 * 60 + em1;
  const start2 = h2 * 60 + m2;
  const end2 = eh2 * 60 + em2;
  
  // Chevauchement si : slot1 commence avant que slot2 ne finisse ET slot1 finit après que slot2 ne commence
  return start1 < end2 && end1 > start2;
}

/**
 * GET /api/appointment-slots
 * Liste tous les créneaux disponibles avec pagination et filtres
 * Accessible publiquement pour afficher les créneaux dans le formulaire client
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
    
    // Ne montrer que les créneaux disponibles par défaut
    where.isAvailable = true;

    // Récupérer les créneaux avec leurs rendez-vous
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

    // Formater les données
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
        error: 'Une erreur est survenue lors de la récupération des créneaux',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointment-slots
 * Crée un nouveau créneau de rendez-vous
 * Nécessite une session valide
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de la session
    await verifySession();

    const body: CreateAppointmentSlotData = await request.json();

    // Validation
    if (!body.date) {
      return NextResponse.json(
        { success: false, error: 'La date est requise' },
        { status: 400 }
      );
    }

    if (!body.startTime) {
      return NextResponse.json(
        { success: false, error: 'L\'heure de début est requise' },
        { status: 400 }
      );
    }

    if (!body.endTime) {
      return NextResponse.json(
        { success: false, error: 'L\'heure de fin est requise' },
        { status: 400 }
      );
    }

    // Valider le format des heures (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.startTime) || !timeRegex.test(body.endTime)) {
      return NextResponse.json(
        { success: false, error: 'Les heures doivent être au format HH:MM' },
        { status: 400 }
      );
    }

    // Calculer la durée en minutes
    const startMinutes = parseInt(body.startTime.split(':')[0]) * 60 + parseInt(body.startTime.split(':')[1]);
    const endMinutes = parseInt(body.endTime.split(':')[0]) * 60 + parseInt(body.endTime.split(':')[1]);
    const duration = endMinutes - startMinutes;

    if (duration <= 0) {
      return NextResponse.json(
        { success: false, error: 'L\'heure de fin doit être postérieure à l\'heure de début' },
        { status: 400 }
      );
    }

    // Convertir la date au format Date
    const dateObj = body.date instanceof Date ? body.date : new Date(body.date);

    // Vérifier qu'il n'y a pas déjà un créneau qui se chevauche
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
          { success: false, error: 'Un créneau existe déjà à cette heure ou se chevauche avec un créneau existant' },
          { status: 400 }
        );
      }
    }

    // Vérifier la disponibilité dans Google Calendar
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

    // Créer le créneau
    const slot = await prisma.appointmentSlot.create({
      data: {
        date: dateObj,
        startTime: body.startTime,
        endTime: body.endTime,
        duration: duration,
        isAvailable: true,
      },
    });

    // Nettoyer automatiquement les créneaux passés non réservés (basé sur heure de début)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = now.toTimeString().split(' ')[0]; // Format HH:MM:SS
    
    await prisma.appointmentSlot.deleteMany({
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
        message: 'Créneau créé avec succès',
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
        error: 'Une erreur est survenue lors de la création du créneau',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}



/**
 * DELETE /api/appointment-slots/:id
 * Supprime un créneau de rendez-vous
 * Nécessite une session valide
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérification de la session
    await verifySession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du créneau est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le créneau existe
    const existingSlot = await prisma.appointmentSlot.findUnique({
      where: { id },
      include: { appointment: true },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Créneau non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de rendez-vous associé
    if (existingSlot.appointment) {
      // Annuler l'événement Google Calendar si nécessaire
      if (existingSlot.appointment.googleEventId) {
        try {
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

    // Supprimer le créneau
    await prisma.appointmentSlot.delete({
      where: { id },
    });

    // Nettoyer automatiquement les créneaux passés non réservés (basé sur heure de début)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = now.toTimeString().split(' ')[0]; // Format HH:MM:SS
    
    await prisma.appointmentSlot.deleteMany({
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
        message: 'Créneau supprimé avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting appointment slot:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la suppression du créneau',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Pour les autres méthodes HTTP
export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée. Utilisez PATCH pour les mises à jour.' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

export async function HEAD() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  );
}
