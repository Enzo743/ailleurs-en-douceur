import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  nights: number;
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
      nights: cr.nights,
      message: cr.message,
      token: cr.token,
      formId: cr.formId,
      status: cr.status,
      createdAt: cr.createdAt,
      updatedAt: cr.updatedAt,
      form: cr.form,
      formResponses: cr.formResponses,
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
    const requiredFields = ['firstName', 'lastName', 'email', 'packageType', 'nights'];
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
        nights: parseInt(body.nights) || 0,
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
          nights: contactRequest.nights,
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
    if (body.nights !== undefined) updateData.nights = parseInt(body.nights);
    if (body.message !== undefined) updateData.message = body.message;

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

    return NextResponse.json(
      {
        success: true,
        message: 'Demande de contact mise à jour avec succès',
        contactRequest: {
          id: updatedRequest.id,
          firstName: updatedRequest.firstName,
          lastName: updatedRequest.lastName,
          email: updatedRequest.email,
          packageType: updatedRequest.packageType,
          nights: updatedRequest.nights,
          message: updatedRequest.message,
          token: updatedRequest.token,
          formId: updatedRequest.formId,
          status: updatedRequest.status,
          createdAt: updatedRequest.createdAt,
          updatedAt: updatedRequest.updatedAt,
          form: updatedRequest.form,
          formResponses: updatedRequest.formResponses,
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
