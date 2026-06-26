import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /dashboard/forms/[id]
 * Supprime un formulaire
 * Utilise _method=DELETE pour contourner les limitations de Next.js
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
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien une requête DELETE
    const body = await request.formData();
    const method = body.get('_method');
    
    if (method !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Méthode non autorisée' },
        { status: 405 }
      );
    }

    // Vérifier que le formulaire existe
    const form = await prisma.customForm.findUnique({
      where: { id },
      include: { _count: { select: { responses: true } } },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de réponses
    if (form._count.responses > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de supprimer ce formulaire car il a ${form._count.responses} réponses associées`
        },
        { status: 400 }
      );
    }

    // Supprimer le formulaire (et ses champs grâce à la cascade)
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

/**
 * DELETE /dashboard/forms/[id]
 * Alternative pour la suppression directe
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
    const form = await prisma.customForm.findUnique({
      where: { id },
      include: { _count: { select: { responses: true } } },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de réponses
    if (form._count.responses > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de supprimer ce formulaire car il a ${form._count.responses} réponses associées`
        },
        { status: 400 }
      );
    }

    // Supprimer le formulaire (et ses champs grâce à la cascade)
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
