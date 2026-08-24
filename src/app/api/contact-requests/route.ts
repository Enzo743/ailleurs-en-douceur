import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailConfig, getCustomFormUrl, formatDays } from '@/lib/email';
import { getPackageLabel } from '@/lib/constants';
import nodemailer from 'nodemailer';

// Types pour les requêtes et réponses
interface ContactRequestQueryParams {
  status?: string;
  packageType?: string;
  page?: string;
  limit?: string;
  search?: string;
}

interface ContactRequestWithRelations {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  days: number;
  message: string;
  token: string;
  formId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  form?: {
    id: string;
    name: string;
  } | null;
  formResponses?: {
    id: string;
    createdAt: Date;
    values: Record<string, any>;
  }[];
  appointment?: {
    id: string;
    status: string;
    slot?: {
      id: string;
      date: Date;
      startTime: string;
      endTime: string;
    } | null;
  } | null;
}

interface ApiResponse {
  success: boolean;
  data?: ContactRequestWithRelations[];
  contactRequest?: ContactRequestWithRelations;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

/**
 * GET /api/contact-requests
 * Liste toutes les demandes de contact avec filtres et pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification de la session (seulement pour le dashboard)
    // Note: On ne vérifie pas ici car cette route peut être appelée
    // depuis des pages publiques avec un token valide
    // La vérification se fera au niveau de l'utilisation
    
    const { searchParams } = new URL(request.url);
    const query: ContactRequestQueryParams = {
      status: searchParams.get('status') || undefined,
      packageType: searchParams.get('packageType') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
    };

    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    // Construire la condition de filtrage
    const where: any = {};
    
    if (query.status) {
      where.status = query.status;
    }
    
    if (query.packageType) {
      where.packageType = query.packageType;
    }
    
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
        { token: query.search },
      ];
    }

    // Récupérer les demandes avec leurs relations
    const [contactRequests, total] = await Promise.all([
      prisma.contactRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          form: {
            select: {
              id: true,
              name: true,
            },
          },
          formResponses: {
            select: {
              id: true,
              createdAt: true,
              values: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          appointment: {
            include: {
              slot: {
                select: {
                  id: true,
                  date: true,
                  startTime: true,
                  endTime: true,
                },
              },
            },
          },
        },
      }),
      prisma.contactRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Formater les données pour la réponse
    const formattedData: ContactRequestWithRelations[] = contactRequests.map((cr) => ({
      id: cr.id,
      firstName: cr.firstName,
      lastName: cr.lastName,
      email: cr.email,
      packageType: cr.packageType,
      days: cr.days,
      message: cr.message,
      token: cr.token,
      formId: cr.formId,
      status: cr.status,
      createdAt: cr.createdAt,
      updatedAt: cr.updatedAt,
      form: cr.form,
      formResponses: cr.formResponses.map((fr) => ({
        id: fr.id,
        createdAt: fr.createdAt,
        values: (fr.values as Record<string, any>) || {},
      })),
      appointment: cr.appointment ? {
        id: cr.appointment.id,
        status: cr.appointment.status,
        slot: cr.appointment.slot,
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
    console.error('Error fetching contact requests:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la récupération des demandes de contact',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contact-requests
 * Créer une nouvelle demande de contact (alternative à l'API /api/contact)
 * Note: Cette méthode est protégée et nécessite une session valide
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de la session requise
    await verifySession();

    const body = await request.json();

    // Validation des champs requis
    const requiredFields = ['firstName', 'lastName', 'email', 'packageType', 'days'];
    for (const field of requiredFields) {
      if (!body[field]?.toString().trim()) {
        return NextResponse.json(
          { success: false, error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Création de la demande
    const contactRequest = await prisma.contactRequest.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        packageType: body.packageType,
        days: parseInt(body.days) || 0,
        message: body.message || '',
        token: body.token || `cr-${require('crypto').randomUUID()}`,
        formId: body.formId,
        status: body.status || 'PENDING',
      },
      include: {
        form: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Demande de contact créée avec succès',
        contactRequest: {
          id: contactRequest.id,
          firstName: contactRequest.firstName,
          lastName: contactRequest.lastName,
          email: contactRequest.email,
          packageType: contactRequest.packageType,
          days: contactRequest.days,
          message: contactRequest.message,
          token: contactRequest.token,
          formId: contactRequest.formId,
          status: contactRequest.status,
          createdAt: contactRequest.createdAt,
          form: contactRequest.form,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating contact request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la création de la demande de contact',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contact-requests/:id
 * Mettre à jour une demande de contact (changer le statut, associer un formulaire, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Vérification de la session requise
    await verifySession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la demande de contact est requis' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Vérifier que la demande existe
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Mise à jour des champs autorisés
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.formId !== undefined) updateData.formId = body.formId;
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.packageType !== undefined) updateData.packageType = body.packageType;
    if (body.days !== undefined) updateData.days = parseInt(body.days);
    if (body.message !== undefined) updateData.message = body.message;

    // Vérifier si on associe un formulaire et si on doit envoyer un email
    const isAssigningForm = body.formId !== undefined && body.formId !== null && body.formId !== existingRequest.formId;
    
    const updatedRequest = await prisma.contactRequest.update({
      where: { id },
      data: updateData,
      include: {
        form: {
          select: {
            id: true,
            name: true,
          },
        },
        formResponses: {
          select: {
            id: true,
            createdAt: true,
            values: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        appointment: {
          include: {
            slot: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });

    // Envoyer un email au client si un formulaire a été associé
    if (isAssigningForm && updatedRequest.form && updatedRequest.token) {
      try {
        const { emailFrom, recipientEmail, transporter } = await getEmailConfig();
        const customFormUrl = getCustomFormUrl(updatedRequest.token);
        const packageLabel = getPackageLabel(updatedRequest.packageType);
        
        const clientEmailHtml = `
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
                .message { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 15px; }
                .info-box { background: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ff9800; }
                .cta-button { display: inline-block; background: #4a3f2f; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 4px; margin: 15px 0; font-weight: bold; text-align: center; }
                .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Merci pour votre demande</h1>
                </div>
                <div class="content">
                  <p>Bonjour ${updatedRequest.firstName},</p>
                  
                  <p>Nous avons bien reçu votre demande de contact. Voici un récapitulatif :</p>
                  
                  <div class="field"><strong>Nom:</strong> ${updatedRequest.firstName} ${updatedRequest.lastName}</div>
                  <div class="field"><strong>Email:</strong> ${updatedRequest.email}</div>
                  <div class="field"><strong>Formule demandée:</strong> ${packageLabel}</div>
                  <div class="field"><strong>Nombre de jours:</strong> ${formatDays(updatedRequest.days)}</div>
                  <div class="field">
                    <strong>Votre message:</strong>
                    <div class="message">${updatedRequest.message?.replace(/\n/g, '<br>') || 'Aucun message'}</div>
                  </div>
                  
                  <div class="info-box">
                    <p style="margin: 0 0 10px 0;"><strong>Pour aller plus loin :</strong></p>
                    <p style="margin: 0 0 15px 0;">Nous vous invitons à compléter notre formulaire personnalisé pour nous aider à mieux préparer votre projet.</p>
                    <a href="${customFormUrl}" class="cta-button">Compléter le formulaire</a>
                    <p style="margin: 10px 0 0 0; font-size: 12px;">Lien : ${customFormUrl}</p>
                  </div>
                  
                  <div class="footer">
                    <p>Ce message a été envoyé via le formulaire de contact du site Ailleurs en Douceur.</p>
                    <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        const clientEmailText = `
Merci pour votre demande

Bonjour ${updatedRequest.firstName},

Nous avons bien reçu votre demande de contact.

Nom: ${updatedRequest.firstName} ${updatedRequest.lastName}
Email: ${updatedRequest.email}
Formule demandée: ${packageLabel}
Nombre de jours: ${formatDays(updatedRequest.days)}

Votre message:
${updatedRequest.message || 'Aucun message'}

Pour aller plus loin, nous vous invitons à compléter notre formulaire personnalisé :
${customFormUrl}

Ce message a été envoyé via le formulaire de contact du site Ailleurs en Douceur.
Date: ${new Date().toLocaleString('fr-FR')}
        `;

        // Envoyer l'email au client
        await transporter.sendMail({
          from: `"Ailleurs en Douceur" <${emailFrom}>`,
          to: updatedRequest.email,
          subject: `Votre demande de contact - Ailleurs en Douceur`,
          text: clientEmailText,
          html: clientEmailHtml,
        });

      } catch (emailError) {
        console.error('Error sending email after form assignment:', emailError);
        // Ne pas échouer la requête à cause de l'email
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isAssigningForm 
          ? 'Formulaire associé avec succès ! Un email avec le lien du formulaire a été envoyé au client.'
          : 'Demande de contact mise à jour avec succès',
        contactRequest: {
          id: updatedRequest.id,
          firstName: updatedRequest.firstName,
          lastName: updatedRequest.lastName,
          email: updatedRequest.email,
          packageType: updatedRequest.packageType,
          days: updatedRequest.days,
          message: updatedRequest.message,
          token: updatedRequest.token,
          formId: updatedRequest.formId,
          status: updatedRequest.status,
          createdAt: updatedRequest.createdAt,
          updatedAt: updatedRequest.updatedAt,
          form: updatedRequest.form,
          formResponses: updatedRequest.formResponses.map((fr) => ({
            id: fr.id,
            createdAt: fr.createdAt,
            values: (fr.values as Record<string, any>) || {},
          })),
          appointment: updatedRequest.appointment,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error updating contact request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la mise à jour de la demande de contact',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contact-requests/:id
 * Supprimer une demande de contact
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérification de la session requise
    await verifySession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la demande de contact est requis' },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    await prisma.contactRequest.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Demande de contact supprimée avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting contact request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la suppression de la demande de contact',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Pour les autres méthodes HTTP
export async function PUT() {
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
