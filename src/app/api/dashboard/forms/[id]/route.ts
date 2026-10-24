import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, serverError, devErrorDetail } from "@/lib/api";

/**
 * Logique commune de suppression d'un formulaire
 * Vérifie la session, l'absence de réponses associées, puis supprime
 */
async function deleteForm(id: string) {
  // Vérification de la session
  await verifySession();

  if (!id) {
    return apiError('L\'ID du formulaire est requis');
  }

  // Vérifier que le formulaire existe
  const form = await prisma.customForm.findUnique({
    where: { id },
    include: { _count: { select: { responses: true } } },
  });

  if (!form) {
    return apiError('Formulaire non trouvé', 404);
  }

  // Vérifier qu'il n'y a pas de réponses
  if (form._count.responses > 0) {
    return apiError(`Impossible de supprimer ce formulaire car il a ${form._count.responses} réponses associées`);
  }

  // Supprimer le formulaire (et ses champs grâce à la cascade)
  await prisma.customForm.delete({
    where: { id },
  });

  return apiSuccess({ message: 'Formulaire supprimé avec succès' });
}

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

    // Vérifier que c'est bien une requête DELETE
    const body = await request.formData();
    const method = body.get('_method');

    if (method !== 'DELETE') {
      return apiError('Méthode non autorisée', 405);
    }

    return await deleteForm(id);

  } catch (error) {
    return serverError(
      'Error deleting form:',
      'Une erreur est survenue lors de la suppression du formulaire',
      error,
      { message: devErrorDetail(error) }
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
    return await deleteForm(id);

  } catch (error) {
    return serverError(
      'Error deleting form:',
      'Une erreur est survenue lors de la suppression du formulaire',
      error,
      { message: devErrorDetail(error) }
    );
  }
}
