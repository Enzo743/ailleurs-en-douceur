import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/dashboard/forms/[id]/duplicate
 * Duplique un formulaire pour permettre sa modification
 * - Crée une copie du formulaire avec préfixe [COPIE]
 * - Désactive l'ancien avec préfixe [ANCIEN]
 * - Transfère les demandes en cours vers le nouveau formulaire
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de la session
    await verifySession();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le formulaire existe
    const existingForm = await prisma.customForm.findUnique({
      where: { id },
      include: {
        fields: true,
        _count: { select: { responses: true, contactRequests: true } },
        contactRequests: {
          where: {
            status: { in: ['PENDING', 'FORM_SENT'] },
            formId: id
          }
        }
      },
    });

    if (!existingForm) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Si le formulaire n'a pas de réponses, on peut le modifier directement
    if (existingForm._count.responses === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce formulaire n\'a pas de réponses, vous pouvez le modifier directement sans le dupliquer.'
        },
        { status: 400 }
      );
    }

    // Créer la copie du formulaire
    const newForm = await prisma.customForm.create({
      data: {
        name: `[COPIE] ${existingForm.name}`,
        packageType: existingForm.packageType,
        description: existingForm.description ? `[COPIE] ${existingForm.description}` : undefined,
        successMessage: existingForm.successMessage,
        isActive: true,
      },
    });

    // Copier les champs du formulaire
    const newFields = await Promise.all(
      existingForm.fields.map((field, index) =>
        prisma.formField.create({
          data: {
            formId: newForm.id,
            label: field.label,
            key: field.key,
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options,
            defaultValue: field.defaultValue,
            order: field.order,
          },
        })
      )
    );

    // Désactiver l'ancien formulaire et ajouter le préfixe [ANCIEN]
    await prisma.customForm.update({
      where: { id },
      data: {
        name: `[ANCIEN] ${existingForm.name}`,
        isActive: false,
      },
    });

    // Transférer les demandes en cours vers le nouveau formulaire
    if (existingForm.contactRequests.length > 0) {
      await prisma.contactRequest.updateMany({
        where: {
          id: { in: existingForm.contactRequests.map(cr => cr.id) },
          status: { in: ['PENDING', 'FORM_SENT'] }
        },
        data: {
          formId: newForm.id,
        },
      });
    }

    // Récupérer le formulaire complet avec ses champs
    const completeNewForm = await prisma.customForm.findUnique({
      where: { id: newForm.id },
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
        message: 'Formulaire dupliqué avec succès. L\'ancien formulaire a été désactivé.',
        data: {
          id: completeNewForm!.id,
          name: completeNewForm!.name,
          packageType: completeNewForm!.packageType,
          description: completeNewForm!.description,
          successMessage: completeNewForm!.successMessage,
          isActive: completeNewForm!.isActive,
          createdAt: completeNewForm!.createdAt,
          updatedAt: completeNewForm!.updatedAt,
          fields: completeNewForm!.fields.map((field) => ({
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
            responsesCount: completeNewForm!._count.responses,
            requestsCount: completeNewForm!._count.contactRequests,
          },
          oldForm: {
            id: existingForm.id,
            name: `[ANCIEN] ${existingForm.name}`,
            isActive: false,
          },
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error duplicating form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la duplication du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Pour les autres méthodes HTTP
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  );
}
