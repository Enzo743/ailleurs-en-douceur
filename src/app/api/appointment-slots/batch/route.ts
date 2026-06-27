import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CreateAppointmentSlotData {
  date: string | Date;
  startTime: string;
  endTime: string;
  duration?: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Vérifie si deux créneaux se chevauchent
function doSlotsOverlap(
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
 * POST /api/appointment-slots/batch
 * Crée plusieurs créneaux en une seule requête
 * Nécessite une session valide
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de la session
    await verifySession();

    const body = await request.json();
    const slotsData: CreateAppointmentSlotData[] = body.slots || [];

    if (!Array.isArray(slotsData) || slotsData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun créneau à créer' },
        { status: 400 }
      );
    }

    // Valider tous les créneaux avant création
    const errors: string[] = [];
    const createdSlots: any[] = [];

    // D'abord, récupérer tous les créneaux existants pour vérifier les chevauchements
    const existingSlots = await prisma.appointmentSlot.findMany();

    // Vérifier chaque nouveau créneau
    const validSlots: any[] = [];
    
    for (let i = 0; i < slotsData.length; i++) {
      const slotData = slotsData[i];
      
      try {
        // Validation basique
        if (!slotData.date || !slotData.startTime || !slotData.endTime) {
          errors.push(`Créneau invalide: date, startTime et endTime sont requis`);
          continue;
        }

        const dateObj = slotData.date instanceof Date ? slotData.date : new Date(slotData.date);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // Calculer la durée
        const startMinutes = parseInt(slotData.startTime.split(':')[0]) * 60 + parseInt(slotData.startTime.split(':')[1]);
        const endMinutes = parseInt(slotData.endTime.split(':')[0]) * 60 + parseInt(slotData.endTime.split(':')[1]);
        const duration = endMinutes - startMinutes;
        
        if (duration <= 0) {
          errors.push(`Durée invalide pour le créneau: ${dateStr} ${slotData.startTime}-${slotData.endTime}`);
          continue;
        }

        // Vérifier que le créneau ne se chevauche pas avec un créneau existant
        for (const existingSlot of existingSlots) {
          if (doSlotsOverlap(
            dateObj,
            slotData.startTime,
            slotData.endTime,
            existingSlot.date,
            existingSlot.startTime,
            existingSlot.endTime
          )) {
            errors.push(`Chevauchement avec un créneau existant: ${dateStr} ${slotData.startTime}-${slotData.endTime} se chevauche avec ${existingSlot.date.toISOString().split('T')[0]} ${existingSlot.startTime}-${existingSlot.endTime}`);
            break;
          }
        }
        
        if (errors.length > 0 && errors[errors.length - 1].includes(`Chevauchement avec un créneau existant: ${dateStr} ${slotData.startTime}-${slotData.endTime}`)) {
          continue;
        }

        // Vérifier que le créneau ne se chevauche pas avec un autre créneau de la batch
        for (let j = 0; j < i; j++) {
          const otherSlotData = slotsData[j];
          const otherDateObj = otherSlotData.date instanceof Date ? otherSlotData.date : new Date(otherSlotData.date);
          
          if (doSlotsOverlap(
            dateObj,
            slotData.startTime,
            slotData.endTime,
            otherDateObj,
            otherSlotData.startTime,
            otherSlotData.endTime
          )) {
            errors.push(`Chevauchement entre créneaux: ${dateStr} ${slotData.startTime}-${slotData.endTime} se chevauche avec ${otherDateObj.toISOString().split('T')[0]} ${otherSlotData.startTime}-${otherSlotData.endTime}`);
            break;
          }
        }
        
        if (errors.length > 0 && errors[errors.length - 1].includes(`Chevauchement entre créneaux: ${dateStr} ${slotData.startTime}-${slotData.endTime}`)) {
          continue;
        }

        // Si on arrive ici, le créneau est valide
        validSlots.push(slotData);

      } catch (error: any) {
        errors.push(`Erreur pour un créneau: ${error.message}`);
      }
    }

    // Si des erreurs, retourner sans rien créer
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `${validSlots.length} créneau(x) valide(s), ${errors.length} erreur(s)`,
          errors: errors,
        },
        { status: 400 }
      );
    }

    // Créer tous les créneaux valides
    for (const slotData of validSlots) {
      const dateObj = slotData.date instanceof Date ? slotData.date : new Date(slotData.date);
      const startMinutes = parseInt(slotData.startTime.split(':')[0]) * 60 + parseInt(slotData.startTime.split(':')[1]);
      const endMinutes = parseInt(slotData.endTime.split(':')[0]) * 60 + parseInt(slotData.endTime.split(':')[1]);
      const duration = endMinutes - startMinutes;

      const slot = await prisma.appointmentSlot.create({
        data: {
          date: dateObj,
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          duration: duration,
          isAvailable: true,
        },
      });

      createdSlots.push({
        id: slot.id,
        date: slot.date.toISOString().split('T')[0],
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        isAvailable: slot.isAvailable,
      });
    }

    // Nettoyer automatiquement les créneaux passés non réservés (basé sur heure de début)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = now.toTimeString().split(' ')[0]; // Format HH:MM:SS
    
    await prisma.appointmentSlot.deleteMany({
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

    return NextResponse.json(
      {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `${createdSlots.length} créneau(x) créé(s) avec succès`
          : `${createdSlots.length} créneau(x) créé(s), ${errors.length} erreur(s)`,
        data: createdSlots,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: errors.length === 0 ? 201 : 207 } // 207 = Multi-Status
    );

  } catch (error: any) {
    console.error('Error creating batch appointment slots:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la création des créneaux',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
