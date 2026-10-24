import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, serverError, devErrorDetail } from "@/lib/api";

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
      return apiError('L\'ID du formulaire est requis');
    }

    // Vérifier que le formulaire existe
    const form = await prisma.customForm.findUnique({
      where: { id },
    });

    if (!form) {
      return apiError('Formulaire non trouvé', 404);
    }

    // Mettre à jour le statut
    const updatedForm = await prisma.customForm.update({
      where: { id },
      data: { isActive: !form.isActive },
    });

    return apiSuccess({
      message: `Formulaire ${updatedForm.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: {
        id: updatedForm.id,
        isActive: updatedForm.isActive,
      },
    });

  } catch (error) {
    return serverError(
      'Error toggling form:',
      'Une erreur est survenue lors de la mise à jour du formulaire',
      error,
      { message: devErrorDetail(error) }
    );
  }
}
