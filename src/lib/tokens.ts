import 'server-only';
import { randomUUID } from 'crypto';

/**
 * Génère un token unique sécurisé
 * Utilise UUID v4 par défaut pour une bonne unicité
 */
const generateToken = (): string => {
  return randomUUID();
};

/**
 * Génère un token pour une ContactRequest
 * Format: cr-{uuid} pour ContactRequest
 */
export const generateContactRequestToken = (): string => {
  return `cr-${generateToken()}`;
};
