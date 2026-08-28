import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPackageLabel } from '@/lib/constants';
import { DEFAULT_VALUES } from '@/lib/constants';
import { FieldType } from '@prisma/client';
import { generateFieldKey } from '@/lib/field-utils';

// ============================================================================
// Types
// ============================================================================

interface FormQueryParams {
  packageType?: string;
  isActive?: string;
  page?: string;
  limit?: string;
  search?: string;
}

interface FormSectionData {
  id?: string;
  name: string;
  description?: string;
  order?: number;
  fieldIds?: string[];
}

interface CreateFormData {
  name: string;
  packageType?: string;
  description?: string;
  successMessage: string;
  isActive?: boolean;
  sections?: FormSectionData[];
  fields?: Array<{
    label: string;
    key: string;
    type: FieldType | string;
    placeholder?: string;
    required?: boolean;
    allowOtherOption?: boolean;
    options?: string[];
    defaultValue?: string;
    minValue?: string;
    maxValue?: string;
    order?: number;
    sectionId?: string;
  }>;
}

interface UpdateFormData extends Partial<CreateFormData> {
  fieldsToAdd?: Array<{
    label: string;
    key: string;
    type: FieldType | string;
    placeholder?: string;
    required?: boolean;
    allowOtherOption?: boolean;
    options?: string[];
    defaultValue?: string;
    minValue?: string;
    maxValue?: string;
    order?: number;
  }>;
  fieldsToUpdate?: Array<{
    id: string;
    label?: string;
    key?: string;
    type?: FieldType | string;
    placeholder?: string;
    required?: boolean;
    allowOtherOption?: boolean;
    options?: string[];
    defaultValue?: string;
    minValue?: string;
    maxValue?: string;
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

// ============================================================================
// Validation Helpers
// ============================================================================

function validateFormData(data: CreateFormData): { valid: boolean; error?: string } {
  if (!data.name?.trim()) {
    return { valid: false, error: 'Le nom du formulaire est requis' };
  }
  if (!data.successMessage?.trim()) {
    return { valid: false, error: 'Le message de confirmation est requis' };
  }
  return { valid: true };
}

// ============================================================================
// GET /api/forms
// ============================================================================

/**
 * Liste tous les formulaires avec pagination et filtres
 */
export async function GET(request: NextRequest) {
  try {
    // Verification de la session
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
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || String(DEFAULT_VALUES.DEFAULT_LIMIT))));
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

    // Recuperer les formulaires avec leurs champs et sections
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
          sections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                orderBy: { order: 'asc' },
              },
            },
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

    // Formater les donnees
    const formattedData = forms.map((form) => ({
      id: form.id,
      name: form.name,
      packageType: form.packageType,
      packageTypeLabel: form.packageType ? getPackageLabel(form.packageType) : null,
      description: form.description,
      successMessage: form.successMessage,
      isActive: form.isActive,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      sections: form.sections.map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        order: section.order,
        fieldIds: section.fields.map(f => f.id),
      })),
      fields: form.fields.map((field) => ({
        id: field.id,
        label: field.label,
        key: field.key,
        type: field.type,
        placeholder: field.placeholder,
        required: field.required,
        allowOtherOption: field.allowOtherOption,
        options: field.options,
        defaultValue: field.defaultValue,
        minValue: field.minValue,
        maxValue: field.maxValue,
        order: field.order,
        sectionId: field.sectionId,
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
        error: 'Une erreur est survenue lors de la recuperation des formulaires',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/forms
// ============================================================================

/**
 * Cree un nouveau formulaire personnalise
 */
export async function POST(request: NextRequest) {
  try {
    // Verification de la session
    await verifySession();

    const body: CreateFormData = await request.json();

    // Validation
    const validation = validateFormData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Creer le formulaire
    const form = await prisma.customForm.create({
      data: {
        name: body.name.trim(),
        packageType: body.packageType?.trim(),
        description: body.description?.trim(),
        successMessage: body.successMessage,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    // Creer les sections si fournies
    let sections: { id: string }[] = [];
    if (body.sections && body.sections.length > 0) {
      sections = await Promise.all(
        body.sections.map((section, index) =>
          prisma.formSection.create({
            data: {
              formId: form.id,
              name: section.name,
              description: section.description,
              order: section.order !== undefined ? section.order : index,
            },
          })
        )
      );
    }

    // Creer les champs si fournis
    let fields = [];
    if (body.fields && body.fields.length > 0) {
      // Générer les clés pour tous les champs d'un coup pour éviter les doublons
      const existingKeys: string[] = [];
      const fieldsWithKeys = body.fields.map((field) => {
        // Si le champ a déjà une clé et qu'elle n'est pas en conflit, la garder
        if (field.key && !existingKeys.includes(field.key)) {
          existingKeys.push(field.key);
          return field;
        }
        // Sinon, générer une nouvelle clé unique
        const generatedKey = generateFieldKey(field.label, existingKeys);
        existingKeys.push(generatedKey);
        return { ...field, key: generatedKey };
      });
      
      // Trouver la section correspondante pour chaque champ
      // Créer une map des anciens IDs de section (du client) vers les nouveaux IDs (base de données)
      const sectionMap = new Map<string, string>();
      if (sections.length > 0 && body.sections) {
        body.sections.forEach((section, index) => {
          if (sections[index]) {
            // Mapper l'ancien ID (section.id) vers le nouvel ID (sections[index].id)
            if (section.id) {
              sectionMap.set(section.id, sections[index].id);
            }
          }
        });
      }

      fields = await Promise.all(
        fieldsWithKeys.map((field, index) => {
          // Trouver l'ID de la section pour ce champ
          let sectionId: string | undefined = undefined;
          if (field.sectionId) {
            // Utiliser la map pour trouver le nouvel ID de section
            sectionId = sectionMap.get(field.sectionId);
            // Si pas trouvé dans la map, ne pas assigner de section (plutôt que d'utiliser l'ID temporaire)
            if (!sectionId) {
              console.warn(`Section ID ${field.sectionId} not found in sectionMap, field will be created without section`);
              sectionId = undefined;
            }
          }

          return prisma.formField.create({
            data: {
              formId: form.id,
              sectionId: sectionId,
              label: field.label,
              key: field.key,
              type: field.type as FieldType,
              placeholder: field.placeholder,
              required: field.required || false,
              allowOtherOption: field.allowOtherOption || false,
              options: field.options || [],
              defaultValue: field.defaultValue,
              minValue: field.minValue,
              maxValue: field.maxValue,
              order: field.order !== undefined ? field.order : index,
            },
          });
        })
      );
    }

    // Recuperer le formulaire complet avec ses champs et sections
    const completeForm = await prisma.customForm.findUnique({
      where: { id: form.id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
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
        message: 'Formulaire cree avec succes',
        data: {
          id: completeForm!.id,
          name: completeForm!.name,
          packageType: completeForm!.packageType,
          packageTypeLabel: completeForm!.packageType ? getPackageLabel(completeForm!.packageType) : null,
          description: completeForm!.description,
          successMessage: completeForm!.successMessage,
          isActive: completeForm!.isActive,
          createdAt: completeForm!.createdAt,
          updatedAt: completeForm!.updatedAt,
          sections: completeForm!.sections.map((section) => ({
            id: section.id,
            name: section.name,
            description: section.description,
            order: section.order,
            fieldIds: section.fields.map(f => f.id),
          })),
          fields: completeForm!.fields.map((field) => ({
            id: field.id,
            label: field.label,
            key: field.key,
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            allowOtherOption: field.allowOtherOption,
            options: field.options,
            defaultValue: field.defaultValue,
            minValue: field.minValue,
            maxValue: field.maxValue,
            order: field.order,
            sectionId: field.sectionId,
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
        error: 'Une erreur est survenue lors de la creation du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/forms
// ============================================================================

/**
 * Supprimer plusieurs formulaires (non implemente - utiliser DELETE /api/forms/[id])
 */
export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Utilisez DELETE /api/forms/[id] pour supprimer un formulaire' },
    { status: 405 }
  );
}

// ============================================================================
// Autres methodes HTTP
// ============================================================================

export async function PUT() {
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
