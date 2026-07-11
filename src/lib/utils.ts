/**
 * Calcule le temps de lecture estimé en minutes
 * Basé sur environ 100 caractères par minute (caractères visibles uniquement)
 * @param text - Le texte à analyser
 * @returns Temps de lecture en minutes, arrondi à l'entier supérieur
 */
export function calculateReadingTime(text: string | null | undefined): number {
  if (!text) return 0;

  // Nettoyer le texte : enlever les balises HTML et les espaces superflus
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')  // Supprimer les balises HTML
    .replace(/\s+/g, ' ')     // Remplacer plusieurs espaces par un seul
    .trim();

  // Compter les caractères visibles (lettres, chiffres, ponctuation)
  const visibleChars = cleanText.replace(/[\s]/g, '').length;

  // Calculer : 1 minute = 100 caractères
  const readingTime = Math.ceil(visibleChars / 100);

  // Retourner au minimum 1 minute si il y a du contenu
  return Math.max(1, readingTime);
}

/**
 * Formate une date en français
 * @param date - La date à formater
 * @returns Date formatée en français (ex: "12 mai 2026")
 */
export function formatDateFr(date: Date | null | undefined): string {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
