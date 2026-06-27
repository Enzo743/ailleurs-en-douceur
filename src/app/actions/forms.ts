'use server';

import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateFormPaths, revalidateContactRequestPaths } from '@/lib/cache';
import { redirect } from 'next/navigation';

/**
 * Active ou désactive un formulaire
 */
export async function toggleForm(formId: string) {
  try {
    // Vérification de la session
    await verifySession();

    // Vérifier que le formulaire existe
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new Error('Formulaire non trouvé');
    }

    // Mettre à jour le statut
    const updatedForm = await prisma.customForm.update({
      where: { id: formId },
      data: { isActive: !form.isActive },
    });

    // Revalider le cache
    revalidateFormPaths(formId);

    return { success: true, message: `Formulaire ${updatedForm.isActive ? 'activé' : 'désactivé'} avec succès` };

  } catch (error: any) {
    console.error('Error toggling form:', error);
    return { success: false, error: 'Une erreur est survenue lors de la mise à jour du formulaire' };
  }
}

/**
 * Supprime un formulaire
 */
export async function deleteForm(formId: string) {
  try {
    // Vérification de la session
    await verifySession();

    // Vérifier que le formulaire existe
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
      include: { _count: { select: { responses: true } } },
    });

    if (!form) {
      throw new Error('Formulaire non trouvé');
    }

    // Vérifier qu'il n'y a pas de réponses
    if (form._count.responses > 0) {
      return { 
        success: false, 
        error: `Impossible de supprimer ce formulaire car il a ${form._count.responses} réponses associées` 
      };
    }

    // Supprimer le formulaire (et ses champs grâce à la cascade)
    await prisma.customForm.delete({
      where: { id: formId },
    });

    // Revalider le cache
    revalidateFormPaths();

    return { success: true, message: 'Formulaire supprimé avec succès' };

  } catch (error: any) {
    console.error('Error deleting form:', error);
    return { 
      success: false, 
      error: 'Une erreur est survenue lors de la suppression du formulaire' 
    };
  }
}

/**
 * Assigne un formulaire à une demande de contact
 */
export async function assignFormToContactRequest(formId: string, contactRequestId: string) {
  try {
    // Vérification de la session
    await verifySession();

    // Vérifier que le formulaire existe et est actif
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new Error('Formulaire non trouvé');
    }

    if (!form.isActive) {
      throw new Error('Le formulaire doit être actif pour être associé');
    }

    // Vérifier que la demande de contact existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: contactRequestId },
    });

    if (!contactRequest) {
      throw new Error('Demande de contact non trouvée');
    }

    // Associer le formulaire
    await prisma.contactRequest.update({
      where: { id: contactRequestId },
      data: { formId: form.id },
    });

    // Revalider le cache
    revalidateContactRequestPaths(contactRequestId);

    return { success: true, message: 'Formulaire associé avec succès' };

  } catch (error: any) {
    console.error('Error assigning form:', error);
    return { success: false, error: error.message || 'Une erreur est survenue' };
  }
}

/**
 * Met à jour une demande de contact
 */
export async function updateContactRequest(
  contactRequestId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    packageType?: string;
    nights?: number;
    message?: string;
    status?: string;
    formId?: string;
  }
) {
  try {
    // Vérification de la session
    await verifySession();

    // Vérifier que la demande existe
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: contactRequestId },
    });

    if (!existingRequest) {
      throw new Error('Demande de contact non trouvée');
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.packageType !== undefined) updateData.packageType = data.packageType;
    if (data.nights !== undefined) updateData.nights = data.nights;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.formId !== undefined) updateData.formId = data.formId;

    // Mettre à jour
    await prisma.contactRequest.update({
      where: { id: contactRequestId },
      data: updateData,
    });

    // Revalider le cache
    revalidateContactRequestPaths(contactRequestId);

    return { success: true, message: 'Demande mise à jour avec succès' };

  } catch (error: any) {
    console.error('Error updating contact request:', error);
    return { success: false, error: error.message || 'Une erreur est survenue' };
  }
}

/**
 * Supprime une demande de contact
 */
export async function deleteContactRequest(contactRequestId: string) {
  try {
    // Vérification de la session
    await verifySession();

    // Vérifier que la demande existe
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: contactRequestId },
      include: {
        formResponses: { select: { id: true } },
        appointment: { select: { id: true } },
      },
    });

    if (!existingRequest) {
      throw new Error('Demande de contact non trouvée');
    }

    // Si la demande a des réponses ou un rendez-vous, ne pas supprimer
    if (existingRequest.formResponses.length > 0 || existingRequest.appointment) {
      return {
        success: false,
        error: 'Impossible de supprimer cette demande car elle a des réponses ou un rendez-vous associé'
      };
    }

    // Supprimer
    await prisma.contactRequest.delete({
      where: { id: contactRequestId },
    });

    // Revalider le cache
    revalidateContactRequestPaths();

    return { success: true, message: 'Demande supprimée avec succès' };

  } catch (error: any) {
    console.error('Error deleting contact request:', error);
    return { success: false, error: error.message || 'Une erreur est survenue' };
  }
}

/**
 * Annule un rendez-vous
 */
export async function cancelAppointment(appointmentId: string) {
  try {
    // Vérification de la session
    await verifySession();

    // Vérifier que le rendez-vous existe
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé');
    }

    // Annuler l'événement Google Calendar
    if (appointment.googleEventId) {
      // Note: L'annulation Google Calendar est gérée dans l'API /api/appointments
      // On ne fait que mettre à jour la base ici
    }

    // Marquer le créneau comme disponible à nouveau
    await prisma.appointmentSlot.update({
      where: { id: appointment.slotId },
      data: { isAvailable: true },
    });

    // Mettre à jour le statut de la demande de contact
    await prisma.contactRequest.update({
      where: { id: appointment.contactRequestId },
      data: { status: 'FORM_SENT' },
    });

    // Supprimer le rendez-vous
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    // Revalider le cache
    revalidateContactRequestPaths();

    return { success: true, message: 'Rendez-vous annulé avec succès' };

  } catch (error: any) {
    console.error('Error canceling appointment:', error);
    return { success: false, error: error.message || 'Une erreur est survenue' };
  }
}
