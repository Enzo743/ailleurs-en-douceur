import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { doSlotsOverlap, cleanupExpiredSlots, calculateDuration } from '@/lib/time';
import { validateAppointmentSlot, validateTimeFormat, validateTimeRange, type AppointmentSlotData } from '@/lib/validation';

// ============================================================================
// Types
// ============================================================================

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// ============================================================================
// POST /api/appointment-slots/batch
// ============================================================================

/**
 * Cree plusieurs createaux en une seule requete
 * Necessite une session valide
 */
export async function POST(request: NextRequest) {
  try {
    // Verification de la session
    await verifySession();

    const body = await request.json();
    const slotsData: AppointmentSlotData[] = body.slots || [];

    if (!Array.isArray(slotsData) || slotsData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun createau a creer' },
        { status: 400 }
      );
    }

    // Valider tous les createaux avant creation
    const errors: string[] = [];
    const createdSlots: any[] = [];

    // D'abord, recuperer tous les createaux existants pour verifier les chevauchements
    const existingSlots = await prisma.appointmentSlot.findMany();

    // Verifier chaque nouveau createau
    const validSlots: any[] = [];
    
    for (let i = 0; i < slotsData.length; i++) {
      const slotData = slotsData[i];
      
      try {
        // Validation basique
        if (!slotData.date || !slotData.startTime || !slotData.endTime) {
          errors.push(`Createau invalide: date, startTime et endTime sont requis`);
          continue;
        }

        const dateObj = slotData.date instanceof Date ? slotData.date : new Date(slotData.date);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // Validation du format des heures
        const startTimeResult = validateTimeFormat(slotData.startTime, 'startTime');
        const endTimeResult = validateTimeFormat(slotData.endTime, 'endTime');
        
        if (!startTimeResult.valid) {
          errors.push(startTimeResult.error || `Format invalide pour startTime: ${dateStr} ${slotData.startTime}`);
          continue;
        }
        
        if (!endTimeResult.valid) {
          errors.push(endTimeResult.error || `Format invalide pour endTime: ${dateStr} ${slotData.endTime}`);
          continue;
        }

        // Calculer la duree
        const duration = calculateDuration(slotData.startTime, slotData.endTime);
        const timeRangeResult = validateTimeRange(slotData.startTime, slotData.endTime);
        
        if (!timeRangeResult.valid) {
          errors.push(timeRangeResult.error || `Duree invalide pour le createau: ${dateStr} ${slotData.startTime}-${slotData.endTime}`);
          continue;
        }

        // Verifier que le createau ne se chevauche pas avec un createau existant
        for (const existingSlot of existingSlots) {
          if (doSlotsOverlap(
            dateObj,
            slotData.startTime,
            slotData.endTime,
            existingSlot.date,
            existingSlot.startTime,
            existingSlot.endTime
          )) {
            errors.push(`Chevauchement avec un createau existant: ${dateStr} ${slotData.startTime}-${slotData.endTime} se chevauche avec ${existingSlot.date.toISOString().split('T')[0]} ${existingSlot.startTime}-${existingSlot.endTime}`);
            break;
          }
        }
        
        if (errors.length > 0 && errors[errors.length - 1].includes(`Chevauchement avec un createau existant: ${dateStr} ${slotData.startTime}-${slotData.endTime}`)) {
          continue;
        }

        // Verifier que le createau ne se chevauche pas avec un autre createau de la batch
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
            errors.push(`Chevauchement entre createaux: ${dateStr} ${slotData.startTime}-${slotData.endTime} se chevauche avec ${otherDateObj.toISOString().split('T')[0]} ${otherSlotData.startTime}-${otherSlotData.endTime}`);
            break;
          }
        }
        
        if (errors.length > 0 && errors[errors.length - 1].includes(`Chevauchement entre createaux: ${dateStr} ${slotData.startTime}-${slotData.endTime}`)) {
          continue;
        }

        // Si on arrive ici, le createau est valide
        validSlots.push(slotData);

      } catch (error: any) {
        errors.push(`Erreur pour un createau: ${error.message}`);
      }
    }

    // Si des erreurs, retourner sans rien creer
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `${validSlots.length} createau(x) valide(s), ${errors.length} erreur(s)`,
          errors: errors,
        },
        { status: 400 }
      );
    }

    // Creer tous les createaux valides
    for (const slotData of validSlots) {
      const dateObj = slotData.date instanceof Date ? slotData.date : new Date(slotData.date);
      const duration = calculateDuration(slotData.startTime, slotData.endTime);

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

    // Nettoyer automatiquement les createaux passes non reserves
    await cleanupExpiredSlots(prisma);

    return NextResponse.json(
      {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `${createdSlots.length} createau(x) cree(s) avec succes`
          : `${createdSlots.length} createau(x) cree(s), ${errors.length} erreur(s)`,
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
        error: 'Une erreur est survenue lors de la creation des createaux',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
