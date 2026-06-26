import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FieldType } from "@prisma/client";

interface UpdateFormData {
  name?: string;
  packageType?: string;
  description?: string;
  successMessage?: string;
  isActive?: boolean;
}

interface FormFieldUpdate {
  id?: string;
  label: string;
  key: string;
  type: FieldType | string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  order?: number;
  _action?: 'create' | 'update' | 'delete';
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * GET /api/forms/[id]
 * Récupère un formulaire spécifique avec tous ses champs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérification de la session
    await verifySession();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    // Récupérer le formulaire avec ses champs et statistiques
    const form = await prisma.customForm.findUnique({
      where: { id },
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
        responses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            contactRequest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Formater les données
    const response: ApiResponse = {
      success: true,
      data: {
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
        recentResponses: form.responses.map((r) => ({
          id: r.id,
          createdAt: r.createdAt,
          contactRequest: r.contactRequest,
        })),
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la récupération du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forms/[id]
 * Met à jour un formulaire (nom, description, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérification de la session
    await verifySession();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const formData: UpdateFormData = body;

    // Vérifier que le formulaire existe
    const existingForm = await prisma.customForm.findUnique({
      where: { id },
    });

    if (!existingForm) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Mise à jour du formulaire
    const updateData: any = {};
    if (formData.name !== undefined) updateData.name = formData.name.trim();
    if (formData.packageType !== undefined) updateData.packageType = formData.packageType?.trim();
    if (formData.description !== undefined) updateData.description = formData.description?.trim();
    if (formData.successMessage !== undefined) updateData.successMessage = formData.successMessage;
    if (formData.isActive !== undefined) updateData.isActive = formData.isActive;

    const updatedForm = await prisma.customForm.update({
      where: { id },
      data: updateData,
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
        message: 'Formulaire mis à jour avec succès',
        data: {
          id: updatedForm.id,
          name: updatedForm.name,
          packageType: updatedForm.packageType,
          description: updatedForm.description,
          successMessage: updatedForm.successMessage,
          isActive: updatedForm.isActive,
          createdAt: updatedForm.createdAt,
          updatedAt: updatedForm.updatedAt,
          fields: updatedForm.fields.map((field) => ({
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
            responsesCount: updatedForm._count.responses,
            requestsCount: updatedForm._count.contactRequests,
          },
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error updating form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la mise à jour du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/forms/[id]
 * Met à jour un formulaire et/ou ses champs
 * Accepte une liste de champs avec des actions (create, update, delete)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérification de la session
    await verifySession();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const formData: UpdateFormData = body;
    const fieldUpdates: FormFieldUpdate[] = body.fields || [];

    // Vérifier que le formulaire existe
    const existingForm = await prisma.customForm.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!existingForm) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Mise à jour du formulaire
    const updateData: any = {};
    if (formData.name !== undefined) updateData.name = formData.name.trim();
    if (formData.packageType !== undefined) updateData.packageType = formData.packageType?.trim();
    if (formData.description !== undefined) updateData.description = formData.description?.trim();
    if (formData.successMessage !== undefined) updateData.successMessage = formData.successMessage;
    if (formData.isActive !== undefined) updateData.isActive = formData.isActive;

    // Mise à jour des champs
    const fieldOperations = fieldUpdates.map(async (fieldUpdate) => {
      const action = fieldUpdate._action || 'update';
      
      switch (action) {
        case 'create':
          // Créer un nouveau champ
          return prisma.formField.create({
            data: {
              formId: id,
              label: fieldUpdate.label,
              key: fieldUpdate.key,
              type: fieldUpdate.type as FieldType,
              placeholder: fieldUpdate.placeholder,
              required: fieldUpdate.required || false,
              options: fieldUpdate.options || [],
              defaultValue: fieldUpdate.defaultValue,
              order: fieldUpdate.order || existingForm.fields.length,
            },
          });
        
        case 'update':
          // Mettre à jour un champ existant
          if (!fieldUpdate.id) {
            throw new Error('Field ID is required for update');
          }
          const updateFieldData: any = {};
          if (fieldUpdate.label !== undefined) updateFieldData.label = fieldUpdate.label;
          if (fieldUpdate.key !== undefined) updateFieldData.key = fieldUpdate.key;
          if (fieldUpdate.type !== undefined) updateFieldData.type = fieldUpdate.type;
          if (fieldUpdate.placeholder !== undefined) updateFieldData.placeholder = fieldUpdate.placeholder;
          if (fieldUpdate.required !== undefined) updateFieldData.required = fieldUpdate.required;
          if (fieldUpdate.options !== undefined) updateFieldData.options = fieldUpdate.options;
          if (fieldUpdate.defaultValue !== undefined) updateFieldData.defaultValue = fieldUpdate.defaultValue;
          if (fieldUpdate.order !== undefined) updateFieldData.order = fieldUpdate.order;
          
          return prisma.formField.update({
            where: { id: fieldUpdate.id },
            data: updateFieldData,
          });
        
        case 'delete':
          // Supprimer un champ
          if (!fieldUpdate.id) {
            throw new Error('Field ID is required for delete');
          }
          return prisma.formField.delete({
            where: { id: fieldUpdate.id },
          });
        
        default:
          return null;
      }
    });

    // Exécuter toutes les opérations en parallèle
    await Promise.all([
      prisma.customForm.update({
        where: { id },
        data: updateData,
      }),
      ...fieldOperations,
    ]);

    // Récupérer le formulaire mis à jour
    const updatedForm = await prisma.customForm.findUnique({
      where: { id },
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
        message: 'Formulaire et champs mis à jour avec succès',
        data: {
          id: updatedForm!.id,
          name: updatedForm!.name,
          packageType: updatedForm!.packageType,
          description: updatedForm!.description,
          successMessage: updatedForm!.successMessage,
          isActive: updatedForm!.isActive,
          createdAt: updatedForm!.createdAt,
          updatedAt: updatedForm!.updatedAt,
          fields: updatedForm!.fields.map((field) => ({
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
            responsesCount: updatedForm!._count.responses,
            requestsCount: updatedForm!._count.contactRequests,
          },
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error updating form with fields:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la mise à jour du formulaire ou des champs',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forms/[id]
 * Supprime un formulaire et tous ses champs
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
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le formulaire existe
    const existingForm = await prisma.customForm.findUnique({
      where: { id },
      include: { _count: { select: { responses: true } } },
    });

    if (!existingForm) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le formulaire a des réponses (pour éviter la suppression accidentelle)
    if (existingForm._count.responses > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Impossible de supprimer ce formulaire car il a ${existingForm._count.responses} réponses associées` 
        },
        { status: 400 }
      );
    }

    // Supprimer le formulaire (et tous ses champs grâce à la cascade)
    await prisma.customForm.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Formulaire supprimé avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la suppression du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Pour les autres méthodes HTTP
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
