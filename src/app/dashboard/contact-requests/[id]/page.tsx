import { verifySession } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import styles from './page.module.scss';
import { getPackageLabel } from '@/lib/constants';
import { formatDate } from '@/lib/time';
import { StatusBadge } from '@/components/dashboard';
import AssignFormClient from '@/components/dashboard/AssignFormClient';
import ActionFormClient from '@/components/dashboard/ActionFormClient';
import DownloadFilledFormPdfButton from '@/components/dashboard/DownloadFilledFormPdfButton';

// Formater les valeurs JSON pour affichage
const formatValue = (value: any, allValues: Record<string, any> = {}, fieldKey?: string): string => {
  if (value === null || value === undefined) return 'Non renseigné';
  if (Array.isArray(value)) {
    // Pour les tableaux, vérifier si '_OTHER_' est présent et remplacer par la valeur personnalisée
    const formattedArray = value.map((v: any) => {
      if (v === '_OTHER_' && fieldKey && allValues[`${fieldKey}_other`]) {
        return allValues[`${fieldKey}_other`];
      }
      return String(v);
    });
    return formattedArray.join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return JSON.stringify(value);
  
  // Cas spécial : si la valeur est '_OTHER_', afficher la valeur personnalisée
  if (value === '_OTHER_' && fieldKey && allValues[`${fieldKey}_other`]) {
    return String(allValues[`${fieldKey}_other`]);
  }
  
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
          sections: {
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
          <StatusBadge status={contactRequest.status} />
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
            <div className={styles['info-label']}>Nombre de jours:</div>
            <div className={styles['info-value']}>{contactRequest.days} jour{contactRequest.days > 1 ? 's' : ''}</div>
          </div>
          <div className={styles['info-item']}>
            <div className={styles['info-label']}>Date de création:</div>
            <div className={styles['info-value']}>
              {formatDate(contactRequest.createdAt, { month: 'long' })}
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
                <AssignFormClient 
                  contactRequestId={contactRequest.id} 
                  availableForms={availableForms} 
                />
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
                <div className={styles['response-header-actions']}>
                  <span className={styles['response-date']}>
                    {formatDate(formResponse.createdAt, { month: 'long' })}
                  </span>
                  {contactRequest.form && (
                    <DownloadFilledFormPdfButton
                      form={contactRequest.form as any}
                      formResponse={formResponse as any}
                      clientName={`${contactRequest.firstName} ${contactRequest.lastName}`}
                    />
                  )}
                </div>
              </div>
              
              {contactRequest.form && (
                <div className={styles['response-grid']}>
                  {contactRequest.form.fields.map((field) => {
                    const allValues = (formResponse.values as Record<string, any>) || {};
                    const value = allValues[field.key];
                    return (
                      <div key={field.id} className={styles['response-item']}>
                        <div className={styles['response-field-label']}>
                          {field.label}{field.required && <span className={styles.required}>*</span>}
                        </div>
                        <div className={styles['response-field-value']}>
                          {formatValue(value, allValues, field.key)}
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
                <StatusBadge status={contactRequest.appointment.status} />
              </div>
              
              <div className={styles['appointment-details']}>
                <div className={styles['appointment-detail']}>
                  <span className={styles['detail-label']}>Date:</span>
                  <span className={styles['detail-value']}>
                    {formatDate(contactRequest.appointment.slot.date, { month: 'long' })}
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
                {contactRequest.appointment.contactPreference && (
                  <div className={styles['appointment-detail']}>
                    <span className={styles['detail-label']}>Préférence de contact:</span>
                    <span className={styles['detail-value']}>
                      {contactRequest.appointment.contactPreference}
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
                <ActionFormClient
                  actionUrl={`/api/dashboard/appointments/${contactRequest.appointment.id}`}
                  method="POST"
                  hiddenInputs={{ _method: 'DELETE' }}
                  submitText="Annuler le rendez-vous"
                  successMessage="Rendez-vous annulé avec succès !"
                  errorMessage="Impossible d'annuler le rendez-vous."
                  reloadOnSuccess={true}
                  className={styles['cancel-form']}
                />
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
          <ActionFormClient
            actionUrl={`/api/dashboard/contact-requests/${contactRequest.id}/resend-form`}
            method="POST"
            submitText="Renvoyer le lien du formulaire"
            successMessage="Lien du formulaire renvoyé avec succès ! Le client a reçu un nouvel email."
            errorMessage="Impossible de renvoyer le lien du formulaire."
            className={styles['resend-form']}
          />
        )}
        <ActionFormClient
          actionUrl={`/api/dashboard/contact-requests/${contactRequest.id}`}
          method="POST"
          hiddenInputs={{ _method: 'DELETE' }}
          submitText="Supprimer la demande"
          successMessage="Demande supprimée avec succès !"
          errorMessage="Impossible de supprimer la demande."
          redirectOnSuccess="/dashboard/contact-requests"
          className={styles['delete-form']}
        />
      </div>
    </section>
  );
}
