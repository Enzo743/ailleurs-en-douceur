import 'server-only';
import { PACKAGE_TYPES } from './constants';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Résultat d'une validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Résultat de validation multiple
 */
export interface ValidationResults {
  valid: boolean;
  errors: ValidationResult[];
}

// ============================================================================
// String Validators
// ============================================================================

/**
 * Vérifie qu'une valeur n'est pas vide
 * @param value - Valeur à vérifier
 * @param fieldName - Nom du champ (pour le message d'erreur)
 * @returns Résultat de validation
 */
function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return {
      valid: false,
      error: `Le champ ${fieldName} est requis`,
      field: fieldName,
    };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return {
      valid: false,
      error: `Le champ ${fieldName} est requis`,
      field: fieldName,
    };
  }
  
  return { valid: true };
}

/**
 * Vérifie qu'une valeur est une string valide
 * @param value - Valeur à vérifier
 * @param fieldName - Nom du champ
 * @returns Résultat de validation
 */
function validateString(value: unknown, fieldName: string): ValidationResult {
  const requiredResult = validateRequired(value, fieldName);
  if (!requiredResult.valid) return requiredResult;
  
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `Le champ ${fieldName} doit être une chaîne de caractères`,
      field: fieldName,
    };
  }
  
  return { valid: true };
}

/**
 * Vérifie qu'une valeur est un email valide
 * @param value - Valeur à vérifier
 * @param fieldName - Nom du champ
 * @returns Résultat de validation
 */
function validateEmail(value: unknown, fieldName: string = 'email'): ValidationResult {
  const stringResult = validateString(value, fieldName);
  if (!stringResult.valid) return stringResult;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value as string)) {
    return {
      valid: false,
      error: 'Veuillez fournir un email valide',
      field: fieldName,
    };
  }
  
  return { valid: true };
}

/**
 * Vérifie qu'une valeur est un nombre valide
 * @param value - Valeur à vérifier
 * @param fieldName - Nom du champ
 * @param options - Options (min, max)
 * @returns Résultat de validation
 */
function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): ValidationResult {
  const { min, max, integer = false } = options;
  
  if (value === undefined || value === null || value === '') {
    return {
      valid: false,
      error: `Le champ ${fieldName} est requis`,
      field: fieldName,
    };
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return {
      valid: false,
      error: `Le champ ${fieldName} doit être un nombre valide`,
      field: fieldName,
    };
  }
  
  if (integer && !Number.isInteger(num)) {
    return {
      valid: false,
      error: `Le champ ${fieldName} doit être un nombre entier`,
      field: fieldName,
    };
  }
  
  if (min !== undefined && num < min) {
    return {
      valid: false,
      error: `Le champ ${fieldName} doit être supérieur ou égal à ${min}`,
      field: fieldName,
    };
  }
  
  if (max !== undefined && num > max) {
    return {
      valid: false,
      error: `Le champ ${fieldName} doit être inférieur ou égal à ${max}`,
      field: fieldName,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// Time Validators
// ============================================================================

/**
 * Vérifie qu'une heure est au format HH:MM valide
 * @param value - Heure à vérifier
 * @param fieldName - Nom du champ
 * @returns Résultat de validation
 */
export function validateTimeFormat(value: unknown, fieldName: string): ValidationResult {
  const stringResult = validateString(value, fieldName);
  if (!stringResult.valid) return stringResult;
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(value as string)) {
    return {
      valid: false,
      error: `Le champ ${fieldName} doit être au format HH:MM`,
      field: fieldName,
    };
  }
  
  return { valid: true };
}

/**
 * Vérifie que l'heure de fin est après l'heure de début
 * @param startTime - Heure de début
 * @param endTime - Heure de fin
 * @returns Résultat de validation
 */
export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
  const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
  
  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      error: 'L\'heure de fin doit être postérieure à l\'heure de début',
      field: 'endTime',
    };
  }
  
  return { valid: true };
}

// ============================================================================
// Package Type Validators
// ============================================================================

/**
 * Vérifie qu'une valeur est un type de package valide
 * @param value - Valeur à vérifier
 * @param fieldName - Nom du champ
 * @returns Résultat de validation
 */
function validatePackageType(value: unknown, fieldName: string = 'packageType'): ValidationResult {
  const stringResult = validateString(value, fieldName);
  if (!stringResult.valid) return stringResult;
  
  const validTypes = Object.values(PACKAGE_TYPES) as string[];
  if (!validTypes.includes(value as string)) {
    return {
      valid: false,
      error: `Le type de package doit être l'un des suivants: ${validTypes.join(', ')}`,
      field: fieldName,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// Privacy Validators
// ============================================================================

/**
 * Vérifie que la case "J'accepte la politique de confidentialité" est cochée
 * @param accepted - Valeur du checkbox
 * @returns Résultat de validation
 */
function validatePrivacyAccepted(accepted: boolean | undefined): ValidationResult {
  if (accepted !== true) {
    return {
      valid: false,
      error: 'Vous devez accepter la politique de confidentialité',
      field: 'privacyAccepted',
    };
  }
  
  return { valid: true };
}

// ============================================================================
// Contact Form Validation
// ============================================================================

/**
 * Données du formulaire de contact
 */
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  days: string;
  message: string;
  privacyAccepted: boolean;
}

/**
 * Valide les données d'un formulaire de contact
 * @param data - Données à valider
 * @returns Résultat de validation
 */
export function validateContactForm(data: ContactFormData): ValidationResults {
  const errors: ValidationResult[] = [];
  
  // Champs requis
  const requiredFields = ['firstName', 'lastName', 'email', 'packageType', 'days', 'message'];
  for (const field of requiredFields) {
    const result = validateRequired((data as unknown as Record<string, unknown>)[field], field);
    if (!result.valid) {
      errors.push(result);
    }
  }
  
  // Validation de l'email
  const emailResult = validateEmail(data.email, 'email');
  if (!emailResult.valid) {
    errors.push(emailResult);
  }
  
  // Validation du type de package
  const packageTypeResult = validatePackageType(data.packageType, 'packageType');
  if (!packageTypeResult.valid) {
    errors.push(packageTypeResult);
  }
  
  // Validation du nombre de jours
  const daysResult = validateNumber(data.days, 'days', { min: 1, integer: true });
  if (!daysResult.valid) {
    errors.push(daysResult);
  }
  
  // Validation de la politique de confidentialité
  const privacyResult = validatePrivacyAccepted(data.privacyAccepted);
  if (!privacyResult.valid) {
    errors.push(privacyResult);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Appointment Slot Validation
// ============================================================================

/**
 * Données d'un créneau de rendez-vous
 */
export interface AppointmentSlotData {
  date: string | Date;
  startTime: string;
  endTime: string;
  duration?: number;
}

/**
 * Valide les données d'un créneau de rendez-vous
 * @param data - Données à valider
 * @returns Résultat de validation
 */
export function validateAppointmentSlot(data: AppointmentSlotData): ValidationResults {
  const errors: ValidationResult[] = [];
  
  // Validation de la date
  const dateResult = validateRequired(data.date, 'date');
  if (!dateResult.valid) {
    errors.push(dateResult);
  }
  
  // Validation des heures
  const startTimeResult = validateTimeFormat(data.startTime, 'startTime');
  if (!startTimeResult.valid) {
    errors.push(startTimeResult);
  }
  
  const endTimeResult = validateTimeFormat(data.endTime, 'endTime');
  if (!endTimeResult.valid) {
    errors.push(endTimeResult);
  }
  
  // Validation que l'heure de fin est après l'heure de début
  if (startTimeResult.valid && endTimeResult.valid) {
    const timeRangeResult = validateTimeRange(data.startTime, data.endTime);
    if (!timeRangeResult.valid) {
      errors.push(timeRangeResult);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
