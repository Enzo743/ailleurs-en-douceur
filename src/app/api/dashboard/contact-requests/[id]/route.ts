import { NextRequest } from "next/server";
import { ContactRequestStatus, Prisma } from "@prisma/client";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, serverError, devErrorDetail } from "@/lib/api";

/**
 * Logique commune de suppression d'une demande de contact
 * Vérifie la session et refuse la suppression si des réponses
 * ou un rendez-vous sont associés
 */
async function deleteContactRequest(id: string) {
  // Vérification de la session
  await verifySession();

  if (!id) {
    return apiError('L\'ID de la demande de contact est requis');
  }

  // Vérifier que la demande existe
  const existingRequest = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      formResponses: { select: { id: true } },
      appointment: { select: { id: true } },
    },
  });

  if (!existingRequest) {
    return apiError('Demande de contact non trouvée', 404);
  }

  // Si la demande a des réponses ou un rendez-vous, ne pas supprimer
  if (existingRequest.formResponses.length > 0 || existingRequest.appointment) {
    return apiError('Impossible de supprimer cette demande car elle a des réponses ou un rendez-vous associé');
  }

  // Supprimer
  await prisma.contactRequest.delete({
    where: { id },
  });

  return apiSuccess({ message: 'Demande supprimée avec succès' });
}

/**
 * Logique commune de mise à jour d'une demande de contact
 */
async function updateContactRequest(id: string, updateData: Prisma.ContactRequestUncheckedUpdateInput) {
  // Vérification de la session
  await verifySession();

  if (!id) {
    return apiError('L\'ID de la demande de contact est requis');
  }

  // Vérifier que la demande existe
  const existingRequest = await prisma.contactRequest.findUnique({
    where: { id },
  });

  if (!existingRequest) {
    return apiError('Demande de contact non trouvée', 404);
  }

  // Mettre à jour
  await prisma.contactRequest.update({
    where: { id },
    data: updateData,
  });

  return apiSuccess({ message: 'Demande mise à jour avec succès' });
}

/**
 * POST /dashboard/contact-requests/[id]
 * Met à jour ou supprime une demande de contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.formData();
    const method = body.get('_method') as string;

    // Gestion de la suppression
    if (method === 'DELETE') {
      return await deleteContactRequest(id);
    }

    // Gestion de la mise à jour (PATCH via POST)
    const updateData: Prisma.ContactRequestUncheckedUpdateInput = {};
    const firstName = body.get('firstName') as string;
    const lastName = body.get('lastName') as string;
    const email = body.get('email') as string;
    const packageType = body.get('packageType') as string;
    const days = body.get('days') as string;
    const message = body.get('message') as string;
    const status = body.get('status') as string;
    const formId = body.get('formId') as string;

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (packageType !== undefined) updateData.packageType = packageType;
    if (days !== undefined) updateData.days = parseInt(days) || 0;
    if (message !== undefined) updateData.message = message;
    if (status !== undefined) updateData.status = status as ContactRequestStatus;
    if (formId !== undefined) updateData.formId = formId;

    return await updateContactRequest(id, updateData);

  } catch (error) {
    return serverError(
      'Error processing contact request:',
      'Une erreur est survenue',
      error,
      { message: devErrorDetail(error) }
    );
  }
}

/**
 * PATCH /dashboard/contact-requests/[id]
 * Met à jour une demande de contact
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    // Préparer les données de mise à jour
    const updateData: Prisma.ContactRequestUncheckedUpdateInput = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.packageType !== undefined) updateData.packageType = body.packageType;
    if (body.days !== undefined) updateData.days = parseInt(body.days) || 0;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.formId !== undefined) updateData.formId = body.formId;

    return await updateContactRequest(id, updateData);

  } catch (error) {
    return serverError(
      'Error updating contact request:',
      'Une erreur est survenue lors de la mise à jour',
      error,
      { message: devErrorDetail(error) }
    );
  }
}

/**
 * DELETE /dashboard/contact-requests/[id]
 * Supprime une demande de contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await deleteContactRequest(id);

  } catch (error) {
    return serverError(
      'Error deleting contact request:',
      'Une erreur est survenue lors de la suppression',
      error,
      { message: devErrorDetail(error) }
    );
  }
}
