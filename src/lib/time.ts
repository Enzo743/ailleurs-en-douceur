import 'server-only';

// ============================================================================
// Time Slot Overlap Detection
// ============================================================================

interface TimeSlot {
  date: string | Date;
  startTime: string;
  endTime: string;
}

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
 * Vérifie si un créneau se chevauche avec une liste de créneaux existants
 * 
 * @param newSlot - Le nouveau créneau à vérifier
 * @param existingSlots - Liste des créneaux existants
 * @returns true si chevauchement détecté, false sinon
 */
export function hasSlotOverlap(newSlot: TimeSlot, existingSlots: TimeSlot[]): boolean {
  for (const existingSlot of existingSlots) {
    if (doSlotsOverlap(
      newSlot.date,
      newSlot.startTime,
      newSlot.endTime,
      existingSlot.date,
      existingSlot.startTime,
      existingSlot.endTime
    )) {
      return true;
    }
  }
  return false;
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

/**
 * Convertit une heure HH:MM en minutes depuis minuit
 * 
 * @param time - Heure à convertir (format HH:MM)
 * @returns Nombre de minutes depuis minuit
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convertit des minutes depuis minuit en heure HH:MM
 * 
 * @param minutes - Nombre de minutes depuis minuit
 * @returns Heure au format HH:MM
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Génère une liste d'heures pour un créneau (ex: 09:00, 09:30, 10:00, etc.)
 * 
 * @param startTime - Heure de début (format HH:MM)
 * @param endTime - Heure de fin (format HH:MM)
 * @param interval - Intervalle en minutes (default: 30)
 * @returns Tableau d'heures au format HH:MM
 */
export function generateTimeSlots(startTime: string, endTime: string, interval: number = 30): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  for (let current = startMinutes; current < endMinutes; current += interval) {
    slots.push(minutesToTime(current));
  }
  
  return slots;
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Récupère la date d'aujourd'hui à minuit
 */
export function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Récupère la date et heure actuelle
 */
export function getNow(): Date {
  return new Date();
}

/**
 * Vérifie si une date est dans le passé
 * 
 * @param date - Date à vérifier
 * @param time - Heure à vérifier (format HH:MM), optionnelle
 * @returns true si la date/heure est dans le passé
 */
export function isInPast(date: Date | string, time?: string): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
  }
  
  return dateObj < now;
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

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Nettoie automatiquement les créneaux passés non réservés
 * 
 * @param prisma - Instance Prisma
 * @returns Promise avec le nombre de créneaux supprimés
 */
export async function cleanupExpiredSlots(prisma: any): Promise<number> {
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
