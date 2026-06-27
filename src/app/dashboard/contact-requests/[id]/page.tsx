import { verifySession } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import styles from './page.module.scss';
import { getPackageLabel } from '@/lib/constants';
import { CONTACT_REQUEST_STATUS_LABELS } from '@/lib/constants';

// Mapper les statuts
const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: CONTACT_REQUEST_STATUS_LABELS.PENDING, className: 'pending' },
  FORM_SENT: { label: CONTACT_REQUEST_STATUS_LABELS.FORM_SENT, className: 'form-sent' },
  COMPLETED: { label: CONTACT_REQUEST_STATUS_LABELS.COMPLETED, className: 'completed' },
  CANCELLED: { label: CONTACT_REQUEST_STATUS_LABELS.CANCELLED, className: 'cancelled' },
};

// Formater la date
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Formater l'heure
const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formater les valeurs JSON pour affichage
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'Non renseigné';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default async function ContactRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Vérification de la session
  await verifySession();
  
  const { id } = await params;

  // Récupérer la demande de contact avec toutes ses relations
  const contactRequest = await prisma.contactRequest.findUnique({
    where: { id: id },
    include: {
      form: {
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
        },
      },
      formResponses: {
        orderBy: { createdAt: 'desc' },
        include: {
          form: {
            select: {
              id: true,
              name: true,
              successMessage: true,
            },
          },
        },
      },
      appointment: {
        include: {
          slot: true,
        },
      },
    },
  });

  if (!contactRequest) {
    notFound();
  }

  // Récupérer les formulaires disponibles pour assignation
  const availableForms = await prisma.customForm.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      packageType: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div className={styles['header-left']}>
          <Link href="/dashboard/contact-requests" className={styles['back-link']}>
            ← Retour aux demandes
          </Link>
          <h1 className={styles.pageTitle}>
            Demande de {contactRequest.firstName} {contactRequest.lastName}
          </h1>
        </div>
        <div className={styles['header-right']}>
          <span
            className={`${styles['status-badge']} ${styles[contactRequest.status.toLowerCase().replace('_', '-')]}`}
          >
            {statusLabels[contactRequest.status]?.label || contactRequest.status}
          </span>
        </div>
      </div>

      {/* Section Informations générales */}
      <div className={styles.section}>
        <h2 className={styles['section-title']}>Informations générales</h2>
        <div className={styles['info-grid']}>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Nom complet:</div>
            <div className={styles['info-value']}>
              {contactRequest.firstName} {contactRequest.lastName}
            </div>
          </div>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Email:</div>
            <div className={styles['info-value']}>
              <a href={`mailto:${contactRequest.email}`} className={styles.email}>
                {contactRequest.email}
              </a>
            </div>
          </div>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Type d'offre:</div>
            <div className={styles['info-value']}>
              {getPackageLabel(contactRequest.packageType)}
            </div>
          </div>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Nombre de nuits:</div>
            <div className={styles['info-value']}>{contactRequest.nights} nuit{contactRequest.nights > 1 ? 's' : ''}</div>
          </div>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Date de création:</div>
            <div className={styles['info-value']}>
              {formatDate(contactRequest.createdAt)}
            </div>
          </div>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Token:</div>
            <div className={styles['info-value']}>
              <code className={styles.token}>{contactRequest.token}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Section Message */}
      {contactRequest.message && (
        <div className={styles.section}>
          <h2 className={styles['section-title']}>Message du client</h2>
          <div className={styles['message-box']}>
            <p>{contactRequest.message}</p>
          </div>
        </div>
      )}

      {/* Section Formulaire associé */}
      <div className={styles.section}>
        <h2 className={styles['section-title']}>Formulaire associé</h2>
        <div className={styles['form-info']}>
          {contactRequest.form ? (
            <>
              <div className={styles['form-header']}>
                <h3 className={styles['form-name']}>{contactRequest.form.name}</h3>
                {contactRequest.form.packageType && (
                  <span className={styles['form-package']}>
                    {getPackageLabel(contactRequest.form.packageType)}
                  </span>
                )}
              </div>
              {contactRequest.form.description && (
                <p className={styles['form-description']}>{contactRequest.form.description}</p>
              )}
            </>
          ) : (
            <div className={styles['no-form']}>
              <p>Aucun formulaire associé à cette demande.</p>
              
              {/* Si la demande est en attente, proposer d'assigner un formulaire */}
              {contactRequest.status === 'PENDING' && availableForms.length > 0 && (
                <div className={styles['assign-form-section']}>
                  <h4>Associer un formulaire:</h4>
                  <form action={`/api/dashboard/contact-requests/${contactRequest.id}/assign-form`} method="POST">
                    <select
                      name="formId"
                      required
                      className={styles['form-select']}
                    >
                      <option value="">Sélectionnez un formulaire...</option>
                      {availableForms.map((form) => (
                        <option key={form.id} value={form.id}>
                          {form.name} {form.packageType && ` - ${getPackageLabel(form.packageType)}`}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={styles['assign-button']}>
                      Assigner le formulaire
                    </button>
                  </form>
                </div>
              )}
              
              {contactRequest.status === 'PENDING' && availableForms.length === 0 && (
                <p>
                  <Link href="/dashboard/forms/new" className={styles['create-link']}>
                    Créez d'abord un formulaire
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Réponses au formulaire */}
      {contactRequest.formResponses.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles['section-title']}>
            Réponses au formulaire ({contactRequest.formResponses.length})
          </h2>
          
          {contactRequest.formResponses.map((formResponse, index) => (
            <div key={formResponse.id} className={styles['response-card']}>
              <div className={styles['response-header']}>
                <h3 className={styles['response-title']}>
                  Réponse #{index + 1}
                </h3>
                <span className={styles['response-date']}>
                  {formatDate(formResponse.createdAt)}
                </span>
              </div>
              
              {contactRequest.form && (
                <div className={styles['response-grid']}>
                  {contactRequest.form.fields.map((field) => {
                    const value = (formResponse.values as Record<string, any>)[field.key];
                    return (
                      <div key={field.id} className={styles['response-item']}>
                        <div className={styles['response-field-label']}>
                          {field.label}{field.required && <span className={styles.required}>*</span>}
                        </div>
                        <div className={styles['response-field-value']}>
                          {formatValue(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section Rendez-vous */}
      <div className={styles.section}>
        <h2 className={styles['section-title']}>Rendez-vous</h2>
        <div className={styles['appointment-info']}>
          {contactRequest.appointment ? (
            <>
              <div className={styles['appointment-header']}>
                <h3 className={styles['appointment-title']}>Rendez-vous confirmé</h3>
                <span
                  className={`${styles['appointment-status']} ${styles[contactRequest.appointment.status.toLowerCase()]}`}
                >
                  {statusLabels[contactRequest.appointment.status]?.label || contactRequest.appointment.status}
                </span>
              </div>
              
              <div className={styles['appointment-details']}>
                <div className={styles['appointment-detail']}>
                  <span className={styles['detail-label']}>Date:</span>
                  <span className={styles['detail-value']}>
                    {formatDate(contactRequest.appointment.slot.date)}
                  </span>
                </div>
                <div className={styles['appointment-detail']}>
                  <span className={styles['detail-label']}>Heure:</span>
                  <span className={styles['detail-value']}>
                    {contactRequest.appointment.slot.startTime} - {contactRequest.appointment.slot.endTime}
                  </span>
                </div>
                <div className={styles['appointment-detail']}>
                  <span className={styles['detail-label']}>Durée:</span>
                  <span className={styles['detail-value']}>
                    {contactRequest.appointment.slot.duration} minutes
                  </span>
                </div>
                {contactRequest.appointment.googleEventId && (
                  <div className={styles['appointment-detail']}>
                    <span className={styles['detail-label']}>Google Event ID:</span>
                    <span className={styles['detail-value']}>
                      <code>{contactRequest.appointment.googleEventId}</code>
                    </span>
                  </div>
                )}
                {contactRequest.appointment.meetLink && (
                  <div className={styles['appointment-detail']}>
                    <span className={styles['detail-label']}>Lien Google Meet:</span>
                    <span className={styles['detail-value']}>
                      <a
                        href={contactRequest.appointment.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles['meet-link']}
                      >
                        {contactRequest.appointment.meetLink}
                      </a>
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles['appointment-actions']}>
                <a
                  href={contactRequest.appointment.meetLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles['join-button']}
                >
                  Rejoindre la réunion
                </a>
                <form action={`/api/dashboard/appointments/${contactRequest.appointment.id}`} method="POST">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button type="submit" className={styles['cancel-button']}>
                    Annuler le rendez-vous
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className={styles['no-appointment']}>
              <p>Aucun rendez-vous planifié pour cette demande.</p>
              
              {/* Si le formulaire a été envoyé, proposer de planifier */}
              {(contactRequest.status === 'FORM_SENT' || contactRequest.formResponses.length > 0) && (
                <p>
                  <Link
                    href={`/schedule/${contactRequest.token}`}
                    target="_blank"
                    className={styles['schedule-link']}
                  >
                    Voir le planning disponible pour ce client
                  </Link>
                </p>
              )}
              
              {contactRequest.status === 'PENDING' && (
                <p>
                  Le client doit d'abord remplir le formulaire avant de pouvoir planifier un rendez-vous.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Link href={`/dashboard/contact-requests/${contactRequest.id}/edit`} className={styles['action-button']}>
          Modifier la demande
        </Link>
        {contactRequest.status !== 'COMPLETED' && (
          <form action={`/api/dashboard/contact-requests/${contactRequest.id}/resend-form`} method="POST">
            <button type="submit" className={styles['action-button']}>
              Renvoyer le lien du formulaire
            </button>
          </form>
        )}
        <form action={`/api/dashboard/contact-requests/${contactRequest.id}`} method="POST">
          <input type="hidden" name="_method" value="DELETE" />
          <button type="submit" className={styles['delete-button']}>
            Supprimer la demande
          </button>
        </form>
      </div>
    </section>
  );
}
