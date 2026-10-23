import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelCalendarEvent } from "@/lib/google";
import { apiError, apiSuccess, serverError } from "@/lib/api";

/**
 * Logique commune d'annulation d'un rendez-vous
 * Vérifie la session, annule l'événement Google Calendar, libère le créneau
 * et supprime le rendez-vous
 */
async function cancelAppointment(id: string) {
  // Vérification de la session
  await verifySession();

  if (!id) {
    return apiError('L\'ID du rendez-vous est requis');
  }

  // Vérifier que le rendez-vous existe
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { slot: true },
  });

  if (!appointment) {
    return apiError('Rendez-vous non trouvé', 404);
  }

  // Annuler l'événement Google Calendar
  if (appointment.googleEventId) {
    try {
      await cancelCalendarEvent(appointment.googleEventId);
    } catch (error) {
      console.error('Error canceling Google Calendar event:', error);
    }
  }

  // Marquer le créneau comme disponible à nouveau
  await prisma.appointmentSlot.update({
    where: { id: appointment.slotId },
    data: { isAvailable: true },
  });

  // Mettre à jour le statut de la demande de contact
  await prisma.contactRequest.update({
    where: { id: appointment.contactRequestId },
    data: { status: 'FORM_SENT' },
  });

  // Supprimer le rendez-vous
  await prisma.appointment.delete({
    where: { id },
  });

  return apiSuccess({ message: 'Rendez-vous annulé avec succès' });
}

/**
 * POST /dashboard/appointments/[id]
 * Annule un rendez-vous
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.formData();
    const method = body.get('_method') as string;

    if (method !== 'DELETE') {
      return apiError('Méthode non autorisée', 405);
    }

    return await cancelAppointment(id);

  } catch (error: any) {
    return serverError(
      'Error canceling appointment:',
      'Une erreur est survenue lors de l\'annulation du rendez-vous',
      error,
      { message: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
}

/**
 * DELETE /dashboard/appointments/[id]
 * Alternative pour annuler un rendez-vous
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await cancelAppointment(id);

  } catch (error: any) {
    return serverError(
      'Error canceling appointment:',
      'Une erreur est survenue lors de l\'annulation du rendez-vous',
      error,
      { message: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
}
