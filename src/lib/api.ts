import { NextResponse } from 'next/server';

/**
 * Réponse d'erreur standard
 * Format commun à toutes les routes API : { success: false, error }
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Réponse de succès standard
 * Format commun à toutes les routes API : { success: true, ...body }
 */
export function apiSuccess(body: Record<string, unknown> = {}, status: number = 200) {
  return NextResponse.json(
    { success: true, ...body },
    { status }
  );
}

/**
 * Log l'erreur côté serveur et renvoie la réponse 500 standard
 * À utiliser dans les blocs catch des routes API
 */
export function serverError(
  context: string,
  message: string,
  error: unknown,
  extra: Record<string, unknown> = {}
) {
  console.error(context, error);
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status: 500 }
  );
}
