import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /dashboard/contact-requests/[id]/assign-form
 * Associe un formulaire à une demande de contact
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
        { success: false, error: 'L\'ID de la demande de contact est requis' },
        { status: 400 }
      );
    }

    // Récupérer les données du formulaire
    const body = await request.formData();
    const formId = body.get('formId') as string;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le formulaire existe et est actif
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    if (!form.isActive) {
      return NextResponse.json(
        { success: false, error: 'Le formulaire doit être actif pour être associé' },
        { status: 400 }
      );
    }

    // Vérifier que la demande de contact existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Associer le formulaire
    await prisma.contactRequest.update({
      where: { id },
      data: { formId: form.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Formulaire associé avec succès',
        data: {
          contactRequestId: id,
          formId: form.id,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error assigning form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de l\'association du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
