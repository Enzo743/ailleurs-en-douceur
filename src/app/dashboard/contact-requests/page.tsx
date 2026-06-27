import { verifySession } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './page.module.scss';
import { getPackageLabel } from '@/lib/constants';
import { CONTACT_REQUEST_STATUS_LABELS } from '@/lib/client-constants';

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
    month: 'short',
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

export default async function ContactRequestsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Vérification de la session
  await verifySession();

  // Récupérer les paramètres de filtrage (searchParams est une Promise en Next.js 16)
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const packageType = typeof params.packageType === 'string' ? params.packageType : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

  // Construire la condition de filtrage pour Prisma
  const where: any = {};
  if (status) where.status = status;
  if (packageType) where.packageType = packageType;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Récupérer les données
  const [contactRequests, total] = await Promise.all([
    prisma.contactRequest.findMany({
      where,
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        form: {
          select: {
            id: true,
            name: true,
          },
        },
        formResponses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            form: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        appointment: {
          include: {
            slot: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
        _count: {
          select: {
            formResponses: true,
          },
        },
      },
    }),
    prisma.contactRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / 20);

  // Calculer les statistiques globales
  const stats = await prisma.contactRequest.groupBy({
    by: ['status'],
    _count: {
      _all: true,
    },
  });

  const statsByPackage = await prisma.contactRequest.groupBy({
    by: ['packageType'],
    _count: {
      _all: true,
    },
  });

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Demandes de contact</h1>
        <p className={styles.pageSubtitle}>
          Gestion de toutes les demandes reçues via le formulaire de contact
        </p>
      </div>

      {/* Statistiques */}
      <div className={styles.stats}>
        <div className={styles['stats-grid']}>
          <div className={styles['stat-card']}>
            <h3 className={styles['stat-value']}>{total}</h3>
            <p className={styles['stat-label']}>Total des demandes</p>
          </div>
          {stats.map((stat) => (
            <div key={stat.status} className={styles['stat-card']}>
              <h3 className={`${styles['stat-value']} ${styles[stat.status.toLowerCase()]}`}>
                {stat._count._all}
              </h3>
              <p className={styles['stat-label']}>
                {statusLabels[stat.status]?.label || stat.status}
              </p>
            </div>
          ))}
        </div>

        <div className={styles['stats-grid']}>
          {statsByPackage.map((stat) => (
            <div key={stat.packageType} className={styles['stat-card']}>
              <h3 className={styles['stat-value']}>{stat._count._all}</h3>
              <p className={styles['stat-label']}>
                {getPackageLabel(stat.packageType)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <form action="" method="get" className={styles['filter-form']}>
          <div className={styles['filter-group']}>
            <label htmlFor="status">Statut :</label>
            <select id="status" name="status" defaultValue={status || ''}>
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="FORM_SENT">Formulaire rempli</option>
              <option value="COMPLETED">Terminé</option>
            </select>
          </div>

          <div className={styles['filter-group']}>
            <label htmlFor="packageType">Type d'offre :</label>
            <select id="packageType" name="packageType" defaultValue={packageType || ''}>
              <option value="">Toutes les offres</option>
              <option value="escapade-en-douceur">Escapade en douceur</option>
              <option value="voyage-sur-mesure">Voyage sur-mesure</option>
              <option value="voyage-de-noces">Voyage de noces</option>
            </select>
          </div>

          <div className={styles['filter-group']}>
            <label htmlFor="search">Recherche :</label>
            <input
              type="text"
              id="search"
              name="search"
              defaultValue={search || ''}
              placeholder="Nom, email..."
            />
          </div>

          <button type="submit" className={styles['filter-button']}>
            Filtrer
          </button>
          <Link href="/dashboard/contact-requests" className={styles['filter-button']}>
            Réinitialiser
          </Link>
        </form>
      </div>

      {/* Liste des demandes */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Email</th>
              <th>Offre</th>
              <th>Nuits</th>
              <th>Statut</th>
              <th>Formulaire</th>
              <th>Rendez-vous</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contactRequests.map((request) => (
              <tr key={request.id}>
                <td>{formatDate(request.createdAt)}</td>
                <td>
                  {request.firstName} {request.lastName}
                </td>
                <td>
                  <a href={`mailto:${request.email}`} className={styles.email}>
                    {request.email}
                  </a>
                </td>
                <td>{getPackageLabel(request.packageType)}</td>
                <td>{request.nights}</td>
                <td>
                  <span
                    className={`${styles['status-badge']} ${styles[request.status.toLowerCase()]}`}
                  >
                    {statusLabels[request.status]?.label || request.status}
                  </span>
                </td>
                <td>
                  {request.form ? (
                    <span className={styles['form-badge']}>
                      {request.form.name}
                    </span>
                  ) : (
                    <span className={styles['no-form']}>Aucun</span>
                  )}
                  {request._count.formResponses > 0 && (
                    <span className={styles['response-count']}>
                      +{request._count.formResponses} réponse(s)
                    </span>
                  )}
                </td>
                <td>
                  {request.appointment ? (
                    <span className={styles['appointment-badge']}>
                      {formatDate(request.appointment.slot.date)}
                      <br />
                      {request.appointment.slot.startTime} - {request.appointment.slot.endTime}
                      {request.appointment.meetLink && (
                        <>
                          <br />
                          <a
                            href={request.appointment.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles['meet-link']}
                          >
                            Meet
                          </a>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className={styles['no-appointment']}>Aucun</span>
                  )}
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      href={`/dashboard/contact-requests/${request.id}`}
                      className={styles['action-button']}
                      title="Voir les détails"
                    >
                      Voir
                    </Link>
                    {request.status === 'PENDING' && !request.formId && (
                      <Link
                        href={`/dashboard/contact-requests/${request.id}/assign-form`}
                        className={styles['action-button']}
                        title="Assigner un formulaire"
                      >
                        Form
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contactRequests.length === 0 && (
          <div className={styles['empty-state']}>
            <p>Aucune demande de contact trouvée.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles['pagination-info']}>
            Page {page} sur {totalPages} ({total} demandes)
          </div>
          <div className={styles['pagination-controls']}>
            {page > 1 && (
              <Link
                href={`/dashboard/contact-requests?page=${page - 1}${status ? `&status=${status}` : ''}${packageType ? `&packageType=${packageType}` : ''}${search ? `&search=${search}` : ''}`}
                className={styles['pagination-button']}
              >
                Précédente
              </Link>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, page - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <Link
                  key={pageNum}
                  href={`/dashboard/contact-requests?page=${pageNum}${status ? `&status=${status}` : ''}${packageType ? `&packageType=${packageType}` : ''}${search ? `&search=${search}` : ''}`}
                  className={`${styles['pagination-button']} ${pageNum === page ? styles['active'] : ''}`}
                >
                  {pageNum}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link
                href={`/dashboard/contact-requests?page=${page + 1}${status ? `&status=${status}` : ''}${packageType ? `&packageType=${packageType}` : ''}${search ? `&search=${search}` : ''}`}
                className={styles['pagination-button']}
              >
                Suivante
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
