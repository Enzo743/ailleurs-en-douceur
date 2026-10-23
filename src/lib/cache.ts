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
