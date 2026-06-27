import 'server-only';
import { randomBytes, randomUUID } from 'crypto';

/**
 * Génère un token unique sécurisé
 * Utilise UUID v4 par défaut pour une bonne unicité
 */
export const generateToken = (): string => {
  return randomUUID();
};

/**
 * Génère un token plus court (pour les URLs)
 * 16 caractères alphanumériques
 */
export const generateShortToken = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
};

/**
 * Génère un token pour une ContactRequest
 * Format: cr-{uuid} pour ContactRequest
 */
export const generateContactRequestToken = (): string => {
  return `cr-${generateToken()}`;
};

/**
 * Génère un token pour un AppointmentSlot
 * Format: ap-{uuid} pour Appointment
 */
export const generateAppointmentToken = (): string => {
  return `ap-${generateToken()}`;
};
