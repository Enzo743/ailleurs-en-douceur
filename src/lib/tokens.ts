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
 * Génère un token avec préfixe pour mieux identifier son usage
 */
export const generatePrefixedToken = (prefix: string, length: number = 24): string => {
  const randomPart = generateShortToken(length - prefix.length - 1);
  return `${prefix}-${randomPart}`;
};

/**
 * Hash un token pour stockage sécurisé (si nécessaire)
 * Note: Dans notre cas, les tokens sont stockés en clair en base
 * mais on peut les hasher pour plus de sécurité
 */
export const hashToken = async (token: string): Promise<string> => {
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(token);
  hash.update(process.env.JWT_SECRET || '');
  return hash.digest('hex');
};

/**
 * Vérifie qu'un token a un format valide (UUID v4)
 */
export const isValidUUID = (token: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
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

/**
 * Génère un token pour un FormResponse
 * Format: fr-{uuid} pour FormResponse
 */
export const generateFormResponseToken = (): string => {
  return `fr-${generateToken()}`;
};

/**
 * Extrait le type de token à partir de son préfixe
 */
export const getTokenType = (token: string): 'contact-request' | 'appointment' | 'form-response' | 'unknown' => {
  if (token.startsWith('cr-')) return 'contact-request';
  if (token.startsWith('ap-')) return 'appointment';
  if (token.startsWith('fr-')) return 'form-response';
  return 'unknown';
};

/**
 * Génère un secret pour une session
 */
export const generateSessionSecret = (): string => {
  return generateShortToken(32);
};


