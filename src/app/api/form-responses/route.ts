import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types
interface FormResponseQueryParams {
  formId?: string;
  contactRequestId?: string;
  page?: string;
  limit?: string;
}

interface CreateFormResponseData {
  contactRequestId: string;
  formId: string;
  values: Record<string, any>;
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

/**
 * GET /api/form-responses
 * Liste toutes les réponses aux formulaires avec pagination et filtres
 * Nécessite une session valide (dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    // Note: La vérification de session est gérée au niveau du frontend
    // ou peut être ajoutée ici avec await verifySession()

    const { searchParams } = new URL(request.url);
    const query: FormResponseQueryParams = {
      formId: searchParams.get('formId') || undefined,
      contactRequestId: searchParams.get('contactRequestId') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    // Construire la condition de filtrage
    const where: any = {};
    
    if (query.formId) {
      where.formId = query.formId;
    }
    
    if (query.contactRequestId) {
      where.contactRequestId = query.contactRequestId;
    }

    // Récupérer les réponses avec leurs relations
    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
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
              nights: true,
              createdAt: true,
            },
          },
          form: {
            select: {
              id: true,
              name: true,
              packageType: true,
            },
          },
        },
      }),
      prisma.formResponse.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Formater les données
    const formattedData = responses.map((response) => ({
      id: response.id,
      formId: response.formId,
      contactRequestId: response.contactRequestId,
      values: response.values as Record<string, any>,
      createdAt: response.createdAt,
      contactRequest: response.contactRequest,
      form: response.form,
    }));

    const result: ApiResponse = {
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching form responses:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la récupération des réponses',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/form-responses
 * Soumet une nouvelle réponse à un formulaire personnalisé
 * Cette route est PUBLIQUE - accessible sans session
 * Mais nécessite un contactRequestId valide
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateFormResponseData = await request.json();

    // Validation des champs requis
    if (!body.contactRequestId) {
      return NextResponse.json(
        { success: false, error: 'Le contactRequestId est requis' },
        { status: 400 }
      );
    }

    if (!body.formId) {
      return NextResponse.json(
        { success: false, error: 'Le formId est requis' },
        { status: 400 }
      );
    }

    if (!body.values || typeof body.values !== 'object' || Object.keys(body.values).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Les valeurs du formulaire sont requises' },
        { status: 400 }
      );
    }

    // Vérifier que la demande de contact existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: body.contactRequestId },
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que le formulaire existe
    const form = await prisma.customForm.findUnique({
      where: { id: body.formId },
      include: { fields: true },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le formulaire est actif
    if (!form.isActive) {
      return NextResponse.json(
        { success: false, error: 'Ce formulaire n\'est plus disponible' },
        { status: 400 }
      );
    }

    // Vérifier que la demande de contact est associée à ce formulaire
    if (contactRequest.formId && contactRequest.formId !== body.formId) {
      return NextResponse.json(
        { success: false, error: 'Cette demande de contact n\'est pas associée à ce formulaire' },
        { status: 400 }
      );
    }

    // Créer la réponse
    const response = await prisma.formResponse.create({
      data: {
        contactRequestId: body.contactRequestId,
        formId: body.formId,
        values: body.values,
      },
      include: {
        contactRequest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        form: {
          select: {
            id: true,
            name: true,
            successMessage: true,
          },
        },
      },
    });

    // Mettre à jour le statut de la demande de contact
    await prisma.contactRequest.update({
      where: { id: body.contactRequestId },
      data: { status: 'FORM_SENT' },
    });

    return NextResponse.json(
      {
        success: true,
        message: form.successMessage || 'Votre formulaire a été soumis avec succès',
        data: {
          id: response.id,
          formId: response.formId,
          contactRequestId: response.contactRequestId,
          values: response.values,
          createdAt: response.createdAt,
          form: response.form,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating form response:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la soumission du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/form-responses/:id
 * Récupère une réponse spécifique
 */
export async function GET_BY_ID(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la réponse est requis' },
        { status: 400 }
      );
    }

    const response = await prisma.formResponse.findUnique({
      where: { id },
      include: {
        contactRequest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            packageType: true,
            createdAt: true,
          },
        },
        form: {
          select: {
            id: true,
            name: true,
            packageType: true,
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Réponse non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: response.id,
          formId: response.formId,
          contactRequestId: response.contactRequestId,
          values: response.values,
          createdAt: response.createdAt,
          contactRequest: response.contactRequest,
          form: response.form,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching form response:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la récupération de la réponse',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/form-responses/:id
 * Supprime une réponse
 * Nécessite une session valide
 */
export async function DELETE(request: NextRequest) {
  try {
    // Note: La vérification de session peut être ajoutée ici
    // await verifySession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la réponse est requis' },
        { status: 400 }
      );
    }

    const existingResponse = await prisma.formResponse.findUnique({
      where: { id },
    });

    if (!existingResponse) {
      return NextResponse.json(
        { success: false, error: 'Réponse non trouvée' },
        { status: 404 }
      );
    }

    await prisma.formResponse.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Réponse supprimée avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting form response:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la suppression de la réponse',
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
