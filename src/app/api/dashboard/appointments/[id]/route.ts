import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelCalendarEvent } from "@/lib/google";

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

    // Vérification de la session
    await verifySession();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du rendez-vous est requis' },
        { status: 400 }
      );
    }

    const body = await request.formData();
    const method = body.get('_method') as string;

    if (method !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Méthode non autorisée' },
        { status: 405 }
      );
    }

    // Vérifier que le rendez-vous existe
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Rendez-vous non trouvé' },
        { status: 404 }
      );
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

    return NextResponse.json(
      {
        success: true,
        message: 'Rendez-vous annulé avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error canceling appointment:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de l\'annulation du rendez-vous',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
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

    // Vérification de la session
    await verifySession();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du rendez-vous est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le rendez-vous existe
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Rendez-vous non trouvé' },
        { status: 404 }
      );
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

    return NextResponse.json(
      {
        success: true,
        message: 'Rendez-vous annulé avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error canceling appointment:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de l\'annulation du rendez-vous',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
