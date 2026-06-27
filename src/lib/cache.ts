import 'server-only';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Path Revalidation Helpers
// ============================================================================

/**
 * Revalide tous les paths liés au contenu du site
 */
export function revalidateContentPaths(): void {
  revalidatePath('/');
  revalidatePath('/dashboard/content');
}

/**
 * Revalide tous les paths liés aux articles
 * @param articleId - ID de l'article (optionnel, pour revalider la page d'édition)
 */
export function revalidateArticlePaths(articleId?: string): void {
  revalidatePath('/dashboard/articles');
  if (articleId) {
    revalidatePath(`/dashboard/articles/${articleId}/edit`);
  }
}

/**
 * Revalide tous les paths liés aux formulaires
 * @param formId - ID du formulaire (optionnel, pour revalider la page d'édition)
 */
export function revalidateFormPaths(formId?: string): void {
  revalidatePath('/dashboard/forms');
  if (formId) {
    revalidatePath(`/dashboard/forms/${formId}/edit`);
  }
}

/**
 * Revalide tous les paths liés aux demandes de contact
 * @param contactRequestId - ID de la demande de contact (optionnel)
 */
export function revalidateContactRequestPaths(contactRequestId?: string): void {
  revalidatePath('/dashboard/contact-requests');
  if (contactRequestId) {
    revalidatePath(`/dashboard/contact-requests/${contactRequestId}`);
    revalidatePath(`/dashboard/contact-requests/${contactRequestId}/edit`);
  }
}

/**
 * Revalide tous les paths liés aux créneaux de rendez-vous
 */
export function revalidateAppointmentSlotPaths(): void {
  revalidatePath('/dashboard/schedule');
}

/**
 * Revalide tous les paths du dashboard
 */
export function revalidateDashboardPaths(): void {
  revalidatePath('/dashboard');
  revalidateContentPaths();
  revalidateArticlePaths();
  revalidateFormPaths();
  revalidateContactRequestPaths();
  revalidateAppointmentSlotPaths();
}

/**
 * Revalide la page d'accueil
 */
export function revalidateHomePage(): void {
  revalidatePath('/');
}

// ============================================================================
// Batch Revalidation
// ============================================================================

/**
 * Revalide plusieurs paths en une seule fois
 * @param paths - Tableau de paths à revalider
 */
export function revalidateMultiplePaths(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * Revalide les paths liés à une entité spécifique
 * @param entityType - Type d'entité ('article', 'form', 'contactRequest', etc.)
 * @param entityId - ID de l'entité (optionnel)
 */
export function revalidateEntityPaths(entityType: string, entityId?: string): void {
  const pathMap: Record<string, (id?: string) => string[]> = {
    article: (id) => id ? ['/dashboard/articles', `/dashboard/articles/${id}/edit`] : ['/dashboard/articles'],
    form: (id) => id ? ['/dashboard/forms', `/dashboard/forms/${id}/edit`] : ['/dashboard/forms'],
    contactRequest: (id) => id 
      ? ['/dashboard/contact-requests', `/dashboard/contact-requests/${id}`, `/dashboard/contact-requests/${id}/edit`]
      : ['/dashboard/contact-requests'],
    appointmentSlot: () => ['/dashboard/schedule'],
    content: () => ['/', '/dashboard/content'],
  };

  const paths = pathMap[entityType]?.(entityId) || [];
  revalidateMultiplePaths(paths);
}
