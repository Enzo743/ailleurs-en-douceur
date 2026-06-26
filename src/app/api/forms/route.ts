import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FieldType } from "@prisma/client";

// Types
interface FormQueryParams {
  packageType?: string;
  isActive?: string;
  page?: string;
  limit?: string;
  search?: string;
}

interface CreateFormData {
  name: string;
  packageType?: string;
  description?: string;
  successMessage: string;
  isActive?: boolean;
  fields?: Array<{
    label: string;
    key: string;
    type: FieldType | string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    defaultValue?: string;
    order?: number;
  }>;
}

interface UpdateFormData extends Partial<CreateFormData> {
  fieldsToAdd?: Array<{
    label: string;
    key: string;
    type: FieldType | string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    defaultValue?: string;
    order?: number;
  }>;
  fieldsToUpdate?: Array<{
    id: string;
    label?: string;
    key?: string;
    type?: FieldType | string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    defaultValue?: string;
    order?: number;
  }>;
  fieldsToRemove?: string[];
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
 * GET /api/forms
 * Liste tous les formulaires avec pagination et filtres
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification de la session
    await verifySession();

    const { searchParams } = new URL(request.url);
    const query: FormQueryParams = {
      packageType: searchParams.get('packageType') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
    };

    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    // Construire la condition de filtrage
    const where: any = {};
    
    if (query.packageType) {
      where.packageType = query.packageType;
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Récupérer les formulaires avec leurs champs
    const [forms, total] = await Promise.all([
      prisma.customForm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              responses: true,
              contactRequests: true,
            },
          },
        },
      }),
      prisma.customForm.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Formater les données
    const formattedData = forms.map((form) => ({
      id: form.id,
      name: form.name,
      packageType: form.packageType,
      description: form.description,
      successMessage: form.successMessage,
      isActive: form.isActive,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      fields: form.fields.map((field) => ({
        id: field.id,
        label: field.label,
        key: field.key,
        type: field.type,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        defaultValue: field.defaultValue,
        order: field.order,
      })),
      stats: {
        responsesCount: form._count.responses,
        requestsCount: form._count.contactRequests,
      },
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
    console.error('Error fetching forms:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la récupération des formulaires',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms
 * Créer un nouveau formulaire personnalisé
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de la session
    await verifySession();

    const body: CreateFormData = await request.json();

    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le nom du formulaire est requis' },
        { status: 400 }
      );
    }

    if (!body.successMessage?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le message de confirmation est requis' },
        { status: 400 }
      );
    }

    // Créer le formulaire
    const form = await prisma.customForm.create({
      data: {
        name: body.name.trim(),
        packageType: body.packageType?.trim(),
        description: body.description?.trim(),
        successMessage: body.successMessage,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    // Créer les champs si fournis
    let fields = [];
    if (body.fields && body.fields.length > 0) {
      fields = await Promise.all(
        body.fields.map((field, index) =>
          prisma.formField.create({
            data: {
              formId: form.id,
              label: field.label,
              key: field.key || `field_${index}`,
              type: field.type as FieldType,
              placeholder: field.placeholder,
              required: field.required || false,
              options: field.options || [],
              defaultValue: field.defaultValue,
              order: field.order !== undefined ? field.order : index,
            },
          })
        )
      );
    }

    // Récupérer le formulaire complet avec ses champs
    const completeForm = await prisma.customForm.findUnique({
      where: { id: form.id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            responses: true,
            contactRequests: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Formulaire créé avec succès',
        data: {
          id: completeForm!.id,
          name: completeForm!.name,
          packageType: completeForm!.packageType,
          description: completeForm!.description,
          successMessage: completeForm!.successMessage,
          isActive: completeForm!.isActive,
          createdAt: completeForm!.createdAt,
          updatedAt: completeForm!.updatedAt,
          fields: completeForm!.fields.map((field) => ({
            id: field.id,
            label: field.label,
            key: field.key,
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options,
            defaultValue: field.defaultValue,
            order: field.order,
          })),
          stats: {
            responsesCount: completeForm!._count.responses,
            requestsCount: completeForm!._count.contactRequests,
          },
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la création du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forms
 * Supprimer plusieurs formulaires (non implémenté - utiliser DELETE /api/forms/[id])
 */
export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Utilisez DELETE /api/forms/[id] pour supprimer un formulaire' },
    { status: 405 }
  );
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
