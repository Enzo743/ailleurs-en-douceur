'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

interface AppointmentSlot {
  id: string;
  date: string; // Format YYYY-MM-DD
  startTime: string; // Format HH:MM
  endTime: string;
  duration: number;
  isAvailable: boolean;
}

interface ContactRequestData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  nights: number;
  status: string;
  hasFormResponse: boolean;
}

// Mapper les libellés des types de formule
const getPackageLabel = (value: string): string => {
  const labels: Record<string, string> = {
    'escapade-en-douceur': 'Escapade en douceur',
    'voyage-sur-mesure': 'Voyage sur-mesure',
    'voyage-de-noces': 'Voyage de noces',
  };
  return labels[value] || value;
};

// Formater la date en français
const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Formater l'heure
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

// Grouper les créneaux par date
const groupSlotsByDate = (slots: AppointmentSlot[]): Record<string, AppointmentSlot[]> => {
  const grouped: Record<string, AppointmentSlot[]> = {};
  
  slots.forEach((slot) => {
    if (!grouped[slot.date]) {
      grouped[slot.date] = [];
    }
    grouped[slot.date].push(slot);
  });
  
  return grouped;
};

// Trier les dates
const sortDates = (dates: string[]): string[] => {
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

export default function SchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [contactRequest, setContactRequest] = useState<ContactRequestData | null>(null);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    success?: boolean;
    message: string;
    meetLink?: string;
    date?: string;
    time?: string;
  } | null>(null);

  // Récupérer les données au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Récupérer la demande de contact
        const contactResponse = await fetch(`/api/contact-requests?search=${token}`);
        const contactData = await contactResponse.json();

        if (!contactData.success || !contactData.data || contactData.data.length === 0) {
          throw new Error('Demande de contact non trouvée');
        }

        const contactReq = contactData.data[0];
        setContactRequest({
          id: contactReq.id,
          firstName: contactReq.firstName,
          lastName: contactReq.lastName,
          email: contactReq.email,
          packageType: contactReq.packageType,
          nights: contactReq.nights,
          status: contactReq.status,
          hasFormResponse: contactReq.formResponses && contactReq.formResponses.length > 0,
        });

        // Récupérer les créneaux disponibles
        const slotsResponse = await fetch('/api/appointment-slots?isAvailable=true');
        const slotsData = await slotsResponse.json();

        if (slotsData.success && slotsData.data) {
          // Filtrer les créneaux déjà passés
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const futureSlots = slotsData.data.filter((slot: any) => {
            const slotDate = new Date(slot.date + 'T' + slot.startTime);
            return slotDate >= now;
          });
          
          setAppointmentSlots(futureSlots);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setConfirmation({
          success: false,
          message: 'Une erreur est survenue lors du chargement des créneaux disponibles.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Sélectionner un créneau
  const handleSlotSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
  };

  // Confirmer la sélection
  const handleConfirm = async () => {
    if (!selectedSlot || !contactRequest) return;

    setIsConfirming(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactRequestId: contactRequest.id,
          slotId: selectedSlot.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConfirmation({
          success: true,
          message: 'Votre rendez-vous a été confirmé avec succès !',
          meetLink: result.data.meetLink,
          date: formatDate(selectedSlot.date),
          time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
        });
      } else {
        setConfirmation({
          success: false,
          message: result.error || 'Une erreur est survenue lors de la confirmation du rendez-vous.'
        });
      }

    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      setConfirmation({
        success: false,
        message: 'Impossible de confirmer le rendez-vous. Veuillez vérifier votre connexion.'
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Annuler la sélection
  const handleCancel = () => {
    setSelectedSlot(null);
  };

  // Vérifier si le client a déjà rempli le formulaire
  const shouldShowFormNotice = contactRequest && !contactRequest.hasFormResponse && contactRequest.status !== 'FORM_SENT';

  // Si chargement
  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['loading-spinner']}></div>
          <p>Chargement des créneaux disponibles...</p>
        </div>
      </main>
    );
  }

  // Si erreur
  if (confirmation && !confirmation.success && !appointmentSlots.length) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['error-box']}>
            <h2>Erreur</h2>
            <p>{confirmation.message}</p>
            {shouldShowFormNotice && (
              <>
                <p>Il semble que vous n'avez pas encore rempli le formulaire personnalisé.</p>
                <button 
                  onClick={() => router.push(`/custom-form/${token}`)}
                  className={styles['back-button']}
                >
                  Compléter le formulaire
                </button>
              </>
            )}
            <button onClick={() => router.push('/contact')} className={styles['back-button']}>
              Retour au formulaire de contact
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Si pas de créneaux disponibles
  if (!appointmentSlots.length) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['info-box']}>
            <h2>Aucun créneau disponible</h2>
            <p>Il n'y a actuellement aucun créneau de rendez-vous disponible.</p>
            <p>Nous vous contacterons directement pour convenir d'une date.</p>
            
            {shouldShowFormNotice && (
              <button 
                onClick={() => router.push(`/custom-form/${token}`)}
                className={styles['primary-button']}
              >
                Compléter le formulaire
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Si confirmation réussie
  if (confirmation?.success) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles['success-message']}>
            <h2>Rendez-vous confirmé !</h2>
            <p>{confirmation.message}</p>
            
            <div className={styles['appointment-details']}>
              <div className={styles['detail-item']}>
                <strong>Date :</strong>
                <span>{confirmation.date}</span>
              </div>
              <div className={styles['detail-item']}>
                <strong>Heure :</strong>
                <span>{confirmation.time}</span>
              </div>
              <div className={styles['detail-item']}>
                <strong>Lien Google Meet :</strong>
                <a 
                  href={confirmation.meetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles['meet-link']}
                >
                  {confirmation.meetLink}
                </a>
              </div>
            </div>

            <div className={styles['actions']}>
              <a 
                href={confirmation.meetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles['primary-button']}
              >
                Joindre la réunion maintenant
              </a>
              <button 
                onClick={() => router.push('/')}
                className={styles['secondary-button']}
              >
                Retour à l'accueil
              </button>
            </div>

            <p className={styles['note']}>
              <strong>Note :</strong> Un email de confirmation avec le lien Google Meet 
              vous a été envoyé. Vous recevrez également un rappel 24h avant le rendez-vous.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Affichage normal
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Choisissez un créneau</h1>
          {contactRequest && (
            <p className={styles.subtitle}>
              Bonjour {contactRequest.firstName}, sélectionnez un créneau pour votre 
              rendez-vous concernant : <strong>{getPackageLabel(contactRequest.packageType)}</strong>
            </p>
          )}
        </div>

        {shouldShowFormNotice && (
          <div className={styles['warning-box']}>
            <p>
              <strong>Attention :</strong> Il semble que vous n'avez pas encore rempli 
              le formulaire personnalisé. Nous vous recommandons de le faire avant de 
              choisir un rendez-vous.
            </p>
            <button 
              onClick={() => router.push(`/custom-form/${token}`)}
              className={styles['warning-button']}
            >
              Compléter le formulaire
            </button>
          </div>
        )}

        <div className={styles['slots-container']}>
          {(() => {
            const groupedSlots = groupSlotsByDate(appointmentSlots);
            const sortedDates = sortDates(Object.keys(groupedSlots));

            return sortedDates.map((date) => (
              <div key={date} className={styles['date-group']}>
                <h3 className={styles['date-title']}>{formatDate(date)}</h3>
                <div className={styles['slots-grid']}>
                  {groupedSlots[date]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      const isDisabled = isConfirming;

                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          disabled={isDisabled}
                          className={`${styles['slot-card']} ${isSelected ? styles['selected'] : ''}`}
                        >
                          <div className={styles['slot-time']}>
                            <span>{formatTime(slot.startTime)}</span>
                            <span> - </span>
                            <span>{formatTime(slot.endTime)}</span>
                          </div>
                          <div className={styles['slot-duration']}>
                            {slot.duration} min
                          </div>
                          {isSelected && (
                            <div className={styles['selection-indicator']}>
                              ✓ Sélectionné
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ));
          })()}
        </div>

        {selectedSlot && (
          <div className={styles['selection-panel']}>
            <div className={styles['selection-info']}>
              <p>
                Vous avez sélectionné :
                <strong> {formatDate(selectedSlot.date)} </strong>
                de <strong>{formatTime(selectedSlot.startTime)}</strong> 
                à <strong>{formatTime(selectedSlot.endTime)}</strong>
              </p>
            </div>
            <div className={styles['selection-actions']}>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className={styles['confirm-button']}
              >
                {isConfirming ? 'Confirmation en cours...' : 'Confirmer ce créneau'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isConfirming}
                className={styles['cancel-button']}
              >
                Choisir un autre créneau
              </button>
            </div>
          </div>
        )}

        {!selectedSlot && (
          <div className={styles['no-selection']}>
            <p>Sélectionnez un créneau pour continuer.</p>
          </div>
        )}

        <div className={styles.footer}>
          <p>
            Si aucun créneau ne vous convient, contactez-nous directement et 
            nous trouverons une solution ensemble.
          </p>
        </div>
      </div>
    </main>
  );
}
