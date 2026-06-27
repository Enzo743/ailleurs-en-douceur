'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import { DashboardHeader, EmptyState } from '@/components/dashboard';
import {
  formatLongDate,
  formatShortDate,
  formatTimeString as formatTime,
  calculateEndTime,
  generateTempId
} from '@/lib/time';

interface AppointmentSlot {
  id: string;
  date: string; // Format YYYY-MM-DD
  startTime: string; // Format HH:MM
  endTime: string;
  duration: number;
  isAvailable: boolean;
  createdAt: string;
  appointment?: {
    id: string;
    contactRequest: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

// Créneau par défaut
const defaultSlot: Omit<AppointmentSlot, 'id' | 'createdAt' | 'appointment'> = {
  date: '',
  startTime: '',
  endTime: '',
  duration: 0,
  isAvailable: true,
};

export default function SchedulePage() {
  const router = useRouter();
  
  // États
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSlots, setNewSlots] = useState<Omit<AppointmentSlot, 'id' | 'createdAt' | 'appointment'>[]>([{ ...defaultSlot }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchData, setBatchData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'] as string[],
  });

  // Fonction pour recharger les créneaux
  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer tous les créneaux (y compris ceux non disponibles)
      const response = await fetch('/api/appointment-slots?limit=200');
      const data = await response.json();

      if (data.success && data.data) {
        // Trier par date puis par heure de début
        const sortedSlots = data.data.sort((a: any, b: any) => {
          const dateA = new Date(a.date + 'T' + a.startTime);
          const dateB = new Date(b.date + 'T' + b.startTime);
          return dateA.getTime() - dateB.getTime();
        });
        setSlots(sortedSlots);
      }

    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les créneaux existants au montage
  useEffect(() => {
    fetchSlots();
    
    // Rafraîchir automatiquement toutes les minutes pour supprimer les créneaux passés
    const intervalId = setInterval(() => {
      fetchSlots();
    }, 60000); // 60 secondes = 1 minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Ajouter un nouveau créneau
  const addSlot = () => {
    setNewSlots(prev => [...prev, { ...defaultSlot }]);
  };

  // Supprimer un nouveau créneau
  const removeNewSlot = (index: number) => {
    setNewSlots(prev => prev.filter((_, i) => i !== index));
  };

  // Mettre à jour un nouveau créneau
  const updateNewSlot = (index: number, property: keyof typeof defaultSlot, value: string | number | boolean) => {
    setNewSlots(prev =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        
        const updatedSlot = { ...slot, [property]: value };
        
        // Recalculer endTime si startTime ou duration change
        if (property === 'startTime' || property === 'duration') {
          const startTime = property === 'startTime' ? (value as string) : slot.startTime;
          const duration = property === 'duration' ? (value as number) : slot.duration;
          
          if (startTime && duration && duration > 0) {
            updatedSlot.endTime = calculateEndTime(startTime, duration);
          }
        }
        
        return updatedSlot;
      })
    );
  };

  // Supprimer un créneau existant
  const deleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointment-slots?id=${slotId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Recharger les créneaux pour avoir la liste à jour
        fetchSlots();
        setSubmitStatus({
          success: true,
          message: 'Créneau supprimé avec succès.'
        });
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la suppression.'
        });
      }

    } catch (error) {
      console.error('Error deleting slot:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de supprimer le créneau.'
      });
    }
  };

  // Valider un créneau
  const validateSlot = (slot: any): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    if (!slot.date) {
      errors.date = 'La date est requise';
    }
    
    if (!slot.startTime) {
      errors.startTime = 'L\'heure de début est requise';
    }
    
    if (!slot.duration || slot.duration <= 0) {
      errors.duration = 'La durée doit être supérieure à 0';
    }
    
    if (!slot.endTime) {
      errors.endTime = 'L\'heure de fin est requise';
    }
    
    // Vérifier que le créneau n'est pas dans le passé
    if (slot.date && slot.startTime) {
      const slotDateTime = new Date(slot.date + 'T' + slot.startTime);
      const now = new Date();
      if (slotDateTime < now) {
        errors.startTime = 'Vous ne pouvez pas créer un créneau dans le passé';
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // Valider tous les nouveaux créneaux
  const validateAllNewSlots = (): boolean => {
    let allValid = true;
    
    newSlots.forEach((slot, index) => {
      const validation = validateSlot(slot);
      if (!validation.valid) {
        allValid = false;
      }
    });
    
    return allValid;
  };

  // Soumettre un seul créneau
  const handleSubmitSingle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAllNewSlots()) {
      setSubmitStatus({
        success: false,
        message: 'Veuillez corriger les erreurs dans les créneaux.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const slotData = newSlots[0];
      
      const response = await fetch('/api/appointment-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: 'Créneau créé avec succès !'
        });
        
        // Recharger les créneaux pour avoir la liste à jour
        fetchSlots();
        setNewSlots([defaultSlot]);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la création du créneau.'
        });
      }

    } catch (error: any) {
      console.error('Error creating slot:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de créer le créneau. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumettre plusieurs créneaux (batch)
  const handleSubmitBatch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!batchData.startDate || !batchData.endDate) {
      setSubmitStatus({
        success: false,
        message: 'Les dates de début et de fin sont requises.'
      });
      return;
    }

    if (!batchData.duration || batchData.duration <= 0) {
      setSubmitStatus({
        success: false,
        message: 'La durée doit être supérieure à 0.'
      });
      return;
    }

    // Vérifier que la date de début n'est pas dans le passé
    const startDateTime = new Date(batchData.startDate + 'T' + (batchData.startTime || '00:00'));
    const now = new Date();
    if (startDateTime < now) {
      setSubmitStatus({
        success: false,
        message: 'Vous ne pouvez pas créer de créneaux dans le passé.'
      });
      return;
    }

    setIsSubmitting(true);
    setShowBatchModal(false);
    setSubmitStatus(null);

    try {
      // Générer les créneaux
      const startDate = new Date(batchData.startDate);
      const endDate = new Date(batchData.endDate);
      const generatedSlots: any[] = [];

      const dayNames: Record<string, number> = {
        'Lundi': 1,
        'Mardi': 2,
        'Mercredi': 3,
        'Jeudi': 4,
        'Vendredi': 5,
        'Samedi': 6,
        'Dimanche': 0,
      };

      const selectedDays = batchData.days.map(d => dayNames[d]);

      // Parcourir chaque jour entre startDate et endDate
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        // Vérifier si le jour de la semaine est sélectionné
        if (selectedDays.includes(date.getDay())) {
          // Calculer le nombre de créneaux dans la journée
          const startMinutes = parseInt(batchData.startTime.split(':')[0]) * 60 + parseInt(batchData.startTime.split(':')[1]);
          const endMinutes = parseInt(batchData.endTime.split(':')[0]) * 60 + parseInt(batchData.endTime.split(':')[1]);
          const totalMinutes = endMinutes - startMinutes;
          const numSlots = Math.floor(totalMinutes / batchData.duration);

          // Créer les créneaux
          for (let i = 0; i < numSlots; i++) {
            const slotStartMinutes = startMinutes + (i * batchData.duration);
            const slotEndMinutes = slotStartMinutes + batchData.duration;
            
            const startHours = Math.floor(slotStartMinutes / 60).toString().padStart(2, '0');
            const startMins = (slotStartMinutes % 60).toString().padStart(2, '0');
            const endHours = Math.floor(slotEndMinutes / 60).toString().padStart(2, '0');
            const endMins = (slotEndMinutes % 60).toString().padStart(2, '0');

            const dateStr = date.toISOString().split('T')[0];
            
            // Vérifier qu'un créneau identique n'existe pas déjà
            const exists = slots.some(slot =>
              slot.date === dateStr &&
              slot.startTime === `${startHours}:${startMins}`
            );

            if (!exists) {
              generatedSlots.push({
                date: dateStr,
                startTime: `${startHours}:${startMins}`,
                endTime: `${endHours}:${endMins}`,
                duration: batchData.duration,
              });
            }
          }
        }
      }

      if (generatedSlots.length === 0) {
        setSubmitStatus({
          success: false,
          message: 'Aucun créneau à créer. Peut-être que ces créneaux existent déjà ?'
        });
        setIsSubmitting(false);
        return;
      }

      // Envoyer les créneaux en batch
      const response = await fetch('/api/appointment-slots/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slots: generatedSlots }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          success: true,
          message: `${result.data.length} créneau(x) créé(s) avec succès ! ${result.errors?.length ? ` (${result.errors.length} erreur(s))` : ''}`
        });
        
        // Recharger les créneaux pour avoir la liste à jour
        fetchSlots();
        setShowBatchModal(false);

      } else {
        setSubmitStatus({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la création des créneaux.'
        });
      }

    } catch (error: any) {
      console.error('Error creating batch slots:', error);
      setSubmitStatus({
        success: false,
        message: 'Impossible de créer les créneaux. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grouper les créneaux par date
  const groupSlotsByDate = () => {
    const grouped: Record<string, AppointmentSlot[]> = {};
    
    slots
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date + 'T' + a.startTime);
        const dateB = new Date(b.date + 'T' + b.startTime);
        return dateA.getTime() - dateB.getTime();
      })
      .forEach((slot) => {
        if (!grouped[slot.date]) {
          grouped[slot.date] = [];
        }
        grouped[slot.date].push(slot);
      });
    
    return grouped;
  };

  // Trier les dates
  const sortedDates = Object.keys(groupSlotsByDate()).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Vérifier si une date a déjà des créneaux
  const hasSlotsOnDate = (date: string): boolean => {
    return slots.some(slot => slot.date === date);
  };

  return (
    <section className="dashboard-page">
      <DashboardHeader
        title="Gestion des créneaux"
        subtitle="Configurez vos disponibilités pour les rendez-vous"
        actionButton={{
          label: '+ Créer plusieurs créneaux',
          onClick: () => setShowBatchModal(true)
        }}
      />

      {submitStatus && (
        <div className={`${styles['status-message']} ${submitStatus.success ? styles.success : styles.error}`}>
          <p>{submitStatus.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner"></div>
          <p>Chargement des créneaux...</p>
        </div>
      ) : (
        <>
          {/* Statistiques */}
          <div className="dashboard-stats">
            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card">
                <h3 className="dashboard-stat-value">{slots.length}</h3>
                <p className="dashboard-stat-label">Total des créneaux</p>
              </div>
              <div className="dashboard-stat-card">
                <h3 className="dashboard-stat-value">
                  {slots.filter(s => s.isAvailable).length}
                </h3>
                <p className="dashboard-stat-label">Créneaux disponibles</p>
              </div>
              <div className="dashboard-stat-card">
                <h3 className="dashboard-stat-value">
                  {slots.filter(s => !s.isAvailable).length}
                </h3>
                <p className="dashboard-stat-label">Créneaux réservés</p>
              </div>
            </div>
          </div>

          {/* Formulaire de création simple */}
          <div className="dashboard-create-section">
            <h2 className="dashboard-section-title">Ajouter un nouveau créneau</h2>
            
            <form onSubmit={handleSubmitSingle} className="dashboard-schedule-form">
              <div className={styles['form-grid']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="date">Date *</label>
                    <input
                      type="date"
                      id="date"
                      value={newSlots[0]?.date || ''}
                      onChange={(e) => updateNewSlot(0, 'date', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor="startTime">Heure de début *</label>
                    <input
                      type="time"
                      id="startTime"
                      value={newSlots[0]?.startTime || ''}
                      onChange={(e) => updateNewSlot(0, 'startTime', e.target.value)}
                      placeholder="HH:MM"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor="endTime">Heure de fin *</label>
                    <input
                      type="time"
                      id="endTime"
                      value={newSlots[0]?.endTime || ''}
                      readOnly
                      className={styles['readonly-field']}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor="duration">Durée (minutes)</label>
                    <input
                      type="number"
                      id="duration"
                      value={newSlots[0]?.duration === 0 ? '' : newSlots[0]?.duration ?? ''}
                      placeholder="60"
                      onChange={(e) => {
                        const numericValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        updateNewSlot(0, 'duration', numericValue);
                      }}
                      min="15"
                      max="480"
                    />
                  </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || newSlots.length === 0}
                className="dashboard-submit-button"
              >
                {isSubmitting ? 'Création en cours...' : 'Créer le créneau'}
              </button>
            </form>
          </div>

          {/* Liste des créneaux */}
          <div className="dashboard-slots-container">
            <h2 className="dashboard-section-title">
              Créneaux existants
            </h2>

            {sortedDates.length === 0 ? (
              <EmptyState
                message="Aucun créneau configuré."
                description="Ajoutez des créneaux pour permettre à vos clients de réserver des rendez-vous."
              />
            ) : (
              sortedDates.map((date) => {
                const dateSlots = groupSlotsByDate()[date];
                const dateObj = new Date(date + 'T00:00:00');
                const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));
                
                return (
                  <div key={date} className="dashboard-date-group">
                    <h3 className="dashboard-date-title">
                      {formatLongDate(date)}
                      {isPast && <span className="dashboard-past-badge">Passé</span>}
                    </h3>
                    
                    <div className="dashboard-slots-grid">
                      {dateSlots.map((slot) => {
                        const isNew = slot.id.startsWith('temp-');
                        const isReserved = !slot.isAvailable;
                        const hasAppointment = !!slot.appointment;

                        return (
                          <div key={slot.id} className={`${styles['slot-card']} ${isReserved ? styles.reserved : ''}`}>
                            <div className="dashboard-slot-info">
                              <span className="dashboard-slot-time">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </span>
                              <span className="dashboard-slot-duration">
                                {slot.duration} min
                              </span>
                            </div>
                            
                            {isReserved && hasAppointment && slot.appointment && (
                              <div className="dashboard-slot-appointment">
                                Réservé par: {slot.appointment.contactRequest.firstName} {slot.appointment.contactRequest.lastName}
                              </div>
                            )}
                            
                            {isNew ? (
                              <button
                                type="button"
                                onClick={() => removeNewSlot(dateSlots.indexOf(slot))}
                                className="dashboard-remove-new-button"
                              >
                                ×
                              </button>
                            ) : (
                              !isReserved && !isPast && (
                                <button
                                  type="button"
                                  onClick={() => deleteSlot(slot.id)}
                                  className="dashboard-remove-button"
                                >
                                  ×
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Modal de création batch */}
      {showBatchModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h3>Créer plusieurs créneaux</h3>
              <button onClick={() => setShowBatchModal(false)} className="dashboard-modal-close">
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitBatch} className="dashboard-modal-form">
              <div className={styles['form-group']}>
                <label htmlFor="batch-startDate">Date de début *</label>
                <input
                  type="date"
                  id="batch-startDate"
                  value={batchData.startDate}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => setBatchData(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="batch-endDate">Date de fin *</label>
                <input
                  type="date"
                  id="batch-endDate"
                  value={batchData.endDate}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => setBatchData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={batchData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className={styles['form-grid']}>
                <div className={styles['form-group']}>
                  <label htmlFor="batch-startTime">Heure de début *</label>
                  <input
                    type="time"
                    id="batch-startTime"
                    value={batchData.startTime}
                    onChange={(e) => {
                      const duration = batchData.duration || 0;
                      const endTime = e.target.value && duration > 0 ? calculateEndTime(e.target.value, duration) : batchData.endTime;
                      setBatchData(prev => ({ ...prev, startTime: e.target.value, endTime }));
                    }}
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="batch-endTime">Heure de fin *</label>
                  <input
                    type="time"
                    id="batch-endTime"
                    value={batchData.endTime}
                    readOnly
                    className={styles['readonly-field']}
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="batch-duration">Durée des créneaux (minutes) *</label>
                  <input
                    type="number"
                    id="batch-duration"
                    value={batchData.duration === 0 ? '' : batchData.duration}
                    placeholder="60"
                    onChange={(e) => {
                      const duration = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      const endTime = batchData.startTime && duration > 0 ? calculateEndTime(batchData.startTime, duration) : batchData.endTime;
                      setBatchData(prev => ({ ...prev, duration, endTime }));
                    }}
                    min="15"
                    max="480"
                  />
                </div>
              </div>

              <div className={styles['form-group']}>
                <label>Jours de la semaine</label>
                <div className={styles['days-selector']}>
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <label key={day} className={styles['day-checkbox']}>
                      <input
                        type="checkbox"
                        checked={batchData.days.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBatchData(prev => ({ ...prev, days: [...prev.days, day] }));
                          } else {
                            setBatchData(prev => ({ ...prev, days: prev.days.filter(d => d !== day) }));
                          }
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="dashboard-cancel-button"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="dashboard-submit-button"
                >
                  {isSubmitting ? 'Création en cours...' : `Créer les créneaux`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
