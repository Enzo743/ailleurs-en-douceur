import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /dashboard/forms/[id]/toggle
 * Active ou désactive un formulaire
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

    // Vérifier que le formulaire existe
    const form = await prisma.customForm.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut
    const updatedForm = await prisma.customForm.update({
      where: { id },
      data: { isActive: !form.isActive },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Formulaire ${updatedForm.isActive ? 'activé' : 'désactivé'} avec succès`,
        data: {
          id: updatedForm.id,
          isActive: updatedForm.isActive,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error toggling form:', error);
    
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
