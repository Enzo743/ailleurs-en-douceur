import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createMeetEvent, cancelCalendarEvent } from '@/lib/google';
import { getEmailConfig, getPackageLabel } from '@/lib/email';
import { doSlotsOverlap, calculateDuration, formatDateForDisplay } from '@/lib/time';
import { validateAppointmentSlot, type AppointmentSlotData } from '@/lib/validation';

// ============================================================================
// Types
// ============================================================================

interface CreateAppointmentData {
  contactRequestId: string;
  slotId: string;
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
// GET /api/appointments
// ============================================================================

/**
 * Liste tous les rendez-vous avec pagination et filtres
 * Accessible uniquement avec une session valide (dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactRequestId = searchParams.get('contactRequestId') || undefined;
    const slotId = searchParams.get('slotId') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Construire la condition de filtrage
    const where: any = {};
    
    if (contactRequestId) {
      where.contactRequestId = contactRequestId;
    }
    
    if (slotId) {
      where.slotId = slotId;
    }
    
    if (status) {
      where.status = status;
    }

    // Recuperer les rendez-vous avec leurs relations
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contactRequest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              packageType: true,
              token: true,
            },
          },
          slot: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              duration: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Formater les donnees
    const formattedData = appointments.map((appointment) => ({
      id: appointment.id,
      contactRequestId: appointment.contactRequestId,
      slotId: appointment.slotId,
      googleEventId: appointment.googleEventId,
      meetLink: appointment.meetLink,
      status: appointment.status,
      createdAt: appointment.createdAt,
      contactRequest: appointment.contactRequest,
      slot: {
        id: appointment.slot.id,
        date: appointment.slot.date.toISOString().split('T')[0],
        startTime: appointment.slot.startTime,
        endTime: appointment.slot.endTime,
        duration: appointment.slot.duration,
        fullDateTime: `${appointment.slot.date.toISOString().split('T')[0]}T${appointment.slot.startTime}`,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la recuperation des rendez-vous',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/appointments
// ============================================================================

/**
 * Cree un nouveau rendez-vous
 * Cette route est PUBLIQUE - accessible sans session
 * Mais necessite un contactRequestId et slotId valides
 */
export async function POST(request: NextRequest) {
  const { contactRequestId, slotId }: CreateAppointmentData = await request.json();

  try {
    // Validation
    if (!contactRequestId) {
      return NextResponse.json(
        { success: false, error: 'Le contactRequestId est requis' },
        { status: 400 }
      );
    }

    if (!slotId) {
      return NextResponse.json(
        { success: false, error: 'Le slotId est requis' },
        { status: 400 }
      );
    }

    // Verifier que la demande de contact existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: contactRequestId },
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvee' },
        { status: 404 }
      );
    }

    // Verifier que le createau existe et est disponible
    const slot = await prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Createau non trouve' },
        { status: 404 }
      );
    }

    if (!slot.isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Ce createau n\'est plus disponible' },
        { status: 400 }
      );
    }

    // Verifier qu'il n'y a pas deja un rendez-vous sur ce createau
    const existingAppointment = await prisma.appointment.findUnique({
      where: { slotId: slotId },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Ce createau est deja reserve' },
        { status: 400 }
      );
    }

    // Creer les DateTime pour Google Calendar
    const date = new Date(slot.date);
    const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
    const [endHours, endMinutes] = slot.endTime.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Creer l'evenement Google Calendar avec Meet
    const meetResult = await createMeetEvent({
      summary: `Rendez-vous avec ${contactRequest.firstName} ${contactRequest.lastName} - ${contactRequest.packageType}`,
      description: `Rendez-vous pour discuter du projet: ${contactRequest.message?.substring(0, 200) || ''}

Client: ${contactRequest.firstName} ${contactRequest.lastName}
Email: ${contactRequest.email}
Formule: ${contactRequest.packageType}
Nombre de nuits: ${contactRequest.nights}`,
      startDateTime,
      endDateTime,
      attendeeEmail: contactRequest.email,
      attendeeName: `${contactRequest.firstName} ${contactRequest.lastName}`,
    });

    // Creer le rendez-vous en base de donnees
    const appointment = await prisma.appointment.create({
      data: {
        contactRequestId: contactRequestId,
        slotId: slotId,
        googleEventId: meetResult.eventId,
        meetLink: meetResult.meetLink,
        status: 'CONFIRMED',
      },
      include: {
        slot: true,
        contactRequest: true,
      },
    });

    // Marquer le createau comme non disponible
    await prisma.appointmentSlot.update({
      where: { id: slotId },
      data: { isAvailable: false },
    });

    // Mettre a jour le statut de la demande de contact
    await prisma.contactRequest.update({
      where: { id: contactRequestId },
      data: { status: 'COMPLETED' },
    });

    // Envoyer un email de confirmation au client
    try {
      const { transporter, emailFrom } = getEmailConfig();
      
      const emailSubject = `Confirmation de votre rendez-vous - Ailleurs en Douceur`;
      const packageLabel = getPackageLabel(contactRequest.packageType);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f4e4c1; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; color: #4a3f2f; }
              .content { background: #fff; padding: 20px; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 15px; }
              .field strong { display: inline-block; width: 150px; color: #4a3f2f; }
              .cta-button { display: inline-block; background: #4a3f2f; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 4px; margin: 15px 0; font-weight: bold; text-align: center; }
              .info-box { background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2e7d32; }
              .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Rendez-vous confirme</h1>
              </div>
              <div class="content">
                <p>Bonjour ${contactRequest.firstName},</p>
                
                <p>Votre rendez-vous a ete confirme. Voici les details :</p>
                
                <div class="field"><strong>Date:</strong> ${formatDateForDisplay(slot.date, true)}</div>
                <div class="field"><strong>Heure:</strong> ${slot.startTime} - ${slot.endTime}</div>
                <div class="field"><strong>Duree:</strong> ${slot.duration} minutes</div>
                
                <div class="info-box">
                  <p style="margin: 0 0 15px 0;"><strong>Lien Google Meet :</strong></p>
                  <a href="${meetResult.meetLink}" class="cta-button">Rejoindre la visioconference</a>
                  <p style="margin: 10px 0 0 0; font-size: 12px;">Lien : ${meetResult.meetLink}</p>
                </div>
                
                <p>Un rappel sera envoye 24h avant le rendez-vous avec le lien de visioconference.</p>
                
                <p>A tres bientot,<br>Nelly d'Ailleurs en Douceur</p>
              </div>
              <div class="footer">
                <p>Ce message a ete envoye automatiquement.</p>
                <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailText = `
${emailSubject}

Bonjour ${contactRequest.firstName},

Votre rendez-vous a ete confirme. Voici les details :

Date: ${formatDateForDisplay(slot.date, true)}
Heure: ${slot.startTime} - ${slot.endTime}
Duree: ${slot.duration} minutes

Lien Google Meet : ${meetResult.meetLink}

Un rappel sera envoye automatiquement 24h avant le rendez-vous avec le lien de visioconference.

A tres bientot,
Nelly d'Ailleurs en Douceur

Date: ${new Date().toLocaleString('fr-FR')}
      `;

      await transporter.sendMail({
        from: `"Ailleurs en Douceur" <${emailFrom}>`,
        to: contactRequest.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      // Envoyer aussi a la cliente (Nelly)
      const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || process.env.EMAIL_USER;
      if (recipientEmail && recipientEmail !== emailFrom) {
        const clientFullName = `${contactRequest.firstName} ${contactRequest.lastName}`;

        await transporter.sendMail({
          from: `"Ailleurs en Douceur" <${emailFrom}>`,
          to: recipientEmail,
          subject: `NOUVEAU RENDEZ-VOUS: ${clientFullName} - ${packageLabel}`,
          
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                  .header { background: #f4e4c1; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .header h1 { margin: 0; color: #4a3f2f; font-size: 24px; }
                  .content { background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; }
                  .field { margin-bottom: 12px; }
                  .field strong { color: #4a3f2f; display: inline-block; width: 150px; }
                  .highlight { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #4a3f2f; }
                  .meet-link { display: inline-block; background: #4a3f2f; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; font-weight: bold; }
                  .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
                </style>
              </head>
              <body>
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                  <div class="header">
                    <h1>Nouveau Rendez-Vous</h1>
                  </div>
                  <div class="content">
                    <p><strong>Bonjour Nelly,</strong></p>
                    <p>Un nouveau rendez-vous a ete confirme par <strong>${clientFullName}</strong>.</p>

                    <div class="field"><strong>Email:</strong> ${contactRequest.email}</div>
                    <div class="field"><strong>Formule:</strong> ${packageLabel}</div>
                    ${contactRequest.nights ? `<div class="field"><strong>Nombre de nuits:</strong> ${contactRequest.nights}</div>` : ''}
                    
                    <div class="highlight">
                      <div class="field"><strong>Date:</strong> ${formatDateForDisplay(slot.date, true)}</div>
                      <div class="field"><strong>Heure:</strong> ${slot.startTime} - ${slot.endTime} (${slot.duration} min)</div>
                    </div>

                    <p style="margin: 20px 0 10px 0;"><strong>Lien Google Meet :</strong></p>
                    <a href="${meetResult.meetLink}" class="meet-link">Rejoindre la visioconference</a>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">${meetResult.meetLink}</div>

                    ${contactRequest.message ? `
                    <div class="highlight" style="margin-top: 20px;">
                      <strong>Message du client :</strong>
                      <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${contactRequest.message}</p>
                    </div>
                    ` : ''}

                    <p style="margin: 25px 0 5px 0;">Un rappel sera envoye automatiquement au client 24h avant.</p>
                  </div>
                  <div class="footer">
                    <p>Ce message a ete genere automatiquement.</p>
                    <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </body>
            </html>
          `,
          
          text: `
Nouveau Rendez-Vous avec ${clientFullName}

Client: ${contactRequest.firstName} ${contactRequest.lastName}
Email: ${contactRequest.email}
Formule: ${packageLabel}
${contactRequest.nights ? `Nombre de nuits: ${contactRequest.nights}` : ''}

Date: ${formatDateForDisplay(slot.date, true)}
Heure: ${slot.startTime} - ${slot.endTime}

Lien Google Meet: ${meetResult.meetLink}

${contactRequest.message ? `
Message du client:
${contactRequest.message}` : ''}
          `,
        });
      }

    } catch (emailError) {
      console.error('Error sending appointment confirmation email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Rendez-vous confirme avec succes',
        data: {
          id: appointment.id,
          contactRequestId: appointment.contactRequestId,
          slotId: appointment.slotId,
          googleEventId: appointment.googleEventId,
          meetLink: appointment.meetLink,
          status: appointment.status,
          createdAt: appointment.createdAt,
          slot: {
            id: appointment.slot.id,
            date: appointment.slot.date.toISOString().split('T')[0],
            startTime: appointment.slot.startTime,
            endTime: appointment.slot.endTime,
          },
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating appointment:', error);
    
    // En cas d'erreur, essayer de remettre le createau comme disponible
    try {
      await prisma.appointmentSlot.update({
        where: { id: slotId },
        data: { isAvailable: true },
      });
    } catch (resetError) {
      console.error('Error resetting slot availability:', resetError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la confirmation du rendez-vous',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/appointments/:id
// ============================================================================

/**
 * Annule un rendez-vous
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du rendez-vous est requis' },
        { status: 400 }
      );
    }

    // Verifier que le rendez-vous existe
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Rendez-vous non trouve' },
        { status: 404 }
      );
    }

    // Annuler l'evenement Google Calendar
    if (appointment.googleEventId) {
      try {
        await cancelCalendarEvent(appointment.googleEventId);
      } catch (error) {
        console.error('Error canceling Google Calendar event:', error);
      }
    }

    // Marquer le createau comme disponible a nouveau
    await prisma.appointmentSlot.update({
      where: { id: appointment.slotId },
      data: { isAvailable: true },
    });

    // Supprimer le rendez-vous
    await prisma.appointment.delete({
      where: { id },
    });

    // Mettre a jour le statut de la demande de contact
    await prisma.contactRequest.update({
      where: { id: appointment.contactRequestId },
      data: { status: 'FORM_SENT' }, // Retour au statut precedent
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Rendez-vous annule avec succes',
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

// ============================================================================
// GET /api/appointments/:id
// ============================================================================

/**
 * Recupere un rendez-vous specifique
 */
export async function GET_BY_ID(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du rendez-vous est requis' },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        contactRequest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            packageType: true,
          },
        },
        slot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            duration: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Rendez-vous non trouve' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: appointment.id,
          contactRequestId: appointment.contactRequestId,
          slotId: appointment.slotId,
          googleEventId: appointment.googleEventId,
          meetLink: appointment.meetLink,
          status: appointment.status,
          createdAt: appointment.createdAt,
          contactRequest: appointment.contactRequest,
          slot: {
            id: appointment.slot.id,
            date: appointment.slot.date.toISOString().split('T')[0],
            startTime: appointment.slot.startTime,
            endTime: appointment.slot.endTime,
            duration: appointment.slot.duration,
          },
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la recuperation du rendez-vous',
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
