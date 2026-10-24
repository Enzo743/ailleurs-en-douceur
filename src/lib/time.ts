import type { PrismaClient } from "@prisma/client";
// import 'server-only';

// ============================================================================
// Time Helpers
// ============================================================================

/**
 * Vérifie si deux créneaux se chevauchent
 * 
 * @param date1 - Date du premier créneau
 * @param startTime1 - Heure de début du premier créneau (format HH:MM)
 * @param endTime1 - Heure de fin du premier créneau (format HH:MM)
 * @param date2 - Date du deuxième créneau
 * @param startTime2 - Heure de début du deuxième créneau (format HH:MM)
 * @param endTime2 - Heure de fin du deuxième créneau (format HH:MM)
 * @returns true si les créneaux se chevauchent, false sinon
 */
export function doSlotsOverlap(
  date1: string | Date,
  startTime1: string,
  endTime1: string,
  date2: string | Date,
  startTime2: string,
  endTime2: string
): boolean {
  // Convertir les dates en string YYYY-MM-DD pour comparaison
  const date1Str = date1 instanceof Date ? date1.toISOString().split('T')[0] : date1;
  const date2Str = date2 instanceof Date ? date2.toISOString().split('T')[0] : date2;

  // Si dates différentes, pas de chevauchement
  if (date1Str !== date2Str) return false;

  // Convertir les heures en minutes
  const [h1, m1] = startTime1.split(':').map(Number);
  const [h2, m2] = startTime2.split(':').map(Number);
  const [eh1, em1] = endTime1.split(':').map(Number);
  const [eh2, em2] = endTime2.split(':').map(Number);

  const start1 = h1 * 60 + m1;
  const end1 = eh1 * 60 + em1;
  const start2 = h2 * 60 + m2;
  const end2 = eh2 * 60 + em2;

  // Chevauchement si : slot1 commence avant que slot2 ne finisse ET slot1 finit après que slot2 ne commence
  return start1 < end2 && end1 > start2;
}

/**
 * Calcule la durée en minutes entre deux heures
 * 
 * @param startTime - Heure de début (format HH:MM)
 * @param endTime - Heure de fin (format HH:MM)
 * @returns Durée en minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  
  return endTotal - startTotal;
}

/**
 * Vérifie qu'une heure est au format valide HH:MM
 * 
 * @param time - Heure à valider (format HH:MM)
 * @returns true si valide, false sinon
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Récupère la date d'aujourd'hui à minuit
 */
function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Formate une date pour l'affichage en français
 * 
 * @param date - Date à formater
 * @param includeTime - Inclure l'heure (default: false)
 * @returns Date formatée en français
 */
export function formatDateForDisplay(date: Date | string, includeTime: boolean = false): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('fr-FR', options);
}

/**
 * Formate une date en français
 * @param date - Date à formater
 * @param options - Options de formatage (par défaut : format court JJ MMM AAAA)
 * @returns Date formatée en français
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Formate une date complète en français avec jour de la semaine
 * @param dateString - Date à formater (format YYYY-MM-DD)
 * @returns Date formatée (ex: "lundi 15 juin 2026")
 */
export function formatLongDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formate une heure HH:MM (sans conversion de Date)
 * @param timeString - Heure à formater (format HH:MM)
 * @returns Heure formatée HH:MM
 */
export function formatTimeString(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

/**
 * Calcule l'heure de fin à partir de l'heure de début et de la durée
 * @param startTime - Heure de début (format HH:MM)
 * @param duration - Durée en minutes
 * @returns Heure de fin (format HH:MM)
 */
export function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Nettoie automatiquement les créneaux passés non réservés
 * 
 * @param prisma - Instance Prisma
 * @returns Promise avec le nombre de créneaux supprimés
 */
export async function cleanupExpiredSlots(prisma: PrismaClient): Promise<number> {
  const now = new Date();
  const today = getTodayAtMidnight();
  const currentTime = now.toTimeString().split(' ')[0]; // Format HH:MM:SS

  const result = await prisma.appointmentSlot.deleteMany({
    where: {
      OR: [
        {
          date: {
            lt: today,
          },
        },
        {
          date: today,
          startTime: {
            lt: currentTime,
          },
        },
      ],
      isAvailable: true,
      appointment: null,
    },
  });

  return result.count;
}
