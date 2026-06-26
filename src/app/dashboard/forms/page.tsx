import { verifySession } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './page.module.scss';

// Mapper les types de formule
const packageLabels: Record<string, string> = {
  'escapade-en-douceur': 'Escapade en douceur',
  'voyage-sur-mesure': 'Voyage sur-mesure',
  'voyage-de-noces': 'Voyage de noces',
};

const getPackageLabel = (value: string): string => {
  return packageLabels[value] || value;
};

// Mapper les types de champs
const fieldTypeLabels: Record<string, string> = {
  TEXT: 'Texte court',
  TEXTAREA: 'Texte long',
  NUMBER: 'Nombre',
  EMAIL: 'Email',
  SELECT: 'Sélection unique',
  MULTISELECT: 'Sélection multiple',
  CHECKBOX: 'Case à cocher',
  DATE: 'Date',
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

export default async function FormsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Vérification de la session
  await verifySession();

  // Récupérer les paramètres de filtrage (searchParams est une Promise en Next.js 16)
  const params = await searchParams;
  const packageType = typeof params.packageType === 'string' ? params.packageType : undefined;
  const isActive = typeof params.isActive === 'string' ? params.isActive : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

  // Construire la condition de filtrage pour Prisma
  const where: any = {};
  if (packageType) where.packageType = packageType;
  if (isActive) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Récupérer les données
  const [forms, total] = await Promise.all([
    prisma.customForm.findMany({
      where,
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            responses: true,
            contactRequests: true,
          },
        },
      },
    }),
    prisma.customForm.count({ where }),
  ]);

  const totalPages = Math.ceil(total / 20);

  // Calculer les statistiques globales
  const stats = await prisma.customForm.groupBy({
    by: ['packageType'],
    _count: {
      _all: true,
    },
  });

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div className={styles['header-left']}>
          <h1 className={styles.pageTitle}>Formulaires personnalisés</h1>
          <p className={styles.pageSubtitle}>
            Créez et gérez les formulaires envoyés à vos clients
          </p>
        </div>
        <div className={styles['header-right']}>
          <Link href="/dashboard/forms/new" className={styles['create-button']}>
            + Nouveau formulaire
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className={styles.stats}>
        <div className={styles['stats-grid']}>
          <div className={styles['stat-card']}>
            <h3 className={styles['stat-value']}>{total}</h3>
            <p className={styles['stat-label']}>Total des formulaires</p>
          </div>
          <div className={styles['stat-card']}>
            <h3 className={styles['stat-value']}>
              {forms.reduce((acc, form) => acc + form._count.responses, 0)}
            </h3>
            <p className={styles['stat-label']}>Réponses reçues</p>
          </div>
          <div className={styles['stat-card']}>
            <h3 className={styles['stat-value']}>
              {forms.reduce((acc, form) => acc + form._count.contactRequests, 0)}
            </h3>
            <p className={styles['stat-label']}>Demandes associées</p>
          </div>
          <div className={styles['stat-card']}>
            <h3 className={styles['stat-value']}>
              {forms.filter(f => f.isActive).length}
            </h3>
            <p className={styles['stat-label']}>Formulaires actifs</p>
          </div>
        </div>

        {stats.length > 0 && (
          <div className={styles['stats-grid']}>
            {stats.map((stat) => (
              <div key={stat.packageType || 'unknown'} className={styles['stat-card']}>
                <h3 className={styles['stat-value']}>{stat._count._all}</h3>
                <p className={styles['stat-label']}>
                  {stat.packageType ? getPackageLabel(stat.packageType) : 'Non spécifié'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <form action="" method="get" className={styles['filter-form']}>
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
            <label htmlFor="isActive">Statut :</label>
            <select id="isActive" name="isActive" defaultValue={isActive || ''}>
              <option value="">Tous les statuts</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <div className={styles['filter-group']}>
            <label htmlFor="search">Recherche :</label>
            <input
              type="text"
              id="search"
              name="search"
              defaultValue={search || ''}
              placeholder="Nom du formulaire..."
            />
          </div>

          <button type="submit" className={styles['filter-button']}>
            Filtrer
          </button>
          <Link href="/dashboard/forms" className={styles['filter-button']}>
            Réinitialiser
          </Link>
        </form>
      </div>

      {/* Liste des formulaires */}
      <div className={styles.cards}>
        {forms.map((form) => (
          <div key={form.id} className={styles.card}>
            <div className={styles['card-header']}>
              <div className={styles['card-title-row']}>
                <h3 className={styles['card-title']}>{form.name}</h3>
                <span
                  className={`${styles['status-badge']} ${form.isActive ? styles.active : styles.inactive}`}
                >
                  {form.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className={styles['card-package']}>
                {form.packageType ? getPackageLabel(form.packageType) : 'Toutes les offres'}
              </p>
            </div>

            {form.description && (
              <p className={styles['card-description']}>{form.description}</p>
            )}

            <div className={styles['card-fields']}>
              <strong>{form.fields.length} champ(s) :</strong>
              <ul className={styles['fields-list']}>
                {form.fields.slice(0, 5).map((field) => (
                  <li key={field.id}>
                    {fieldTypeLabels[field.type] || field.type}{' '}
                    <span className={styles['field-name']}>{field.label}</span>
                    {field.required && <span className={styles.required}>*</span>}
                  </li>
                ))}
                {form.fields.length > 5 && (
                  <li className={styles['more-fields']}>+ {form.fields.length - 5} autre(s)</li>
                )}
              </ul>
            </div>

            <div className={styles['card-stats']}>
              <div className={styles['stat-item']}>
                <span className={styles['stat-count']}>{form._count.responses}</span>
                <span className={styles['stat-label']}>réponse(s)</span>
              </div>
              <div className={styles['stat-item']}>
                <span className={styles['stat-count']}>{form._count.contactRequests}</span>
                <span className={styles['stat-label']}>demande(s)</span>
              </div>
            </div>

            <div className={styles['card-actions']}>
              <Link href={`/dashboard/forms/${form.id}/edit`} className={styles['action-button']}>
                Modifier
              </Link>
              <Link href={`/dashboard/responses?formId=${form.id}`} className={styles['action-button']}>
                Voir réponses
              </Link>
              <form action={`/api/dashboard/forms/${form.id}/toggle`} method="POST">
                <button type="submit" className={styles['action-button']}>
                  {form.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </form>
              {form._count.responses === 0 && (
                <form action={`/api/dashboard/forms/${form.id}`} method="POST">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button type="submit" className={styles['delete-button']}>
                    Supprimer
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}

        {forms.length === 0 && (
          <div className={styles['empty-state']}>
            <p>Aucun formulaire trouvé.</p>
            <Link href="/dashboard/forms/new" className={styles['create-button']}>
              Créer votre premier formulaire
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles['pagination-info']}>
            Page {page} sur {totalPages} ({total} formulaires)
          </div>
          <div className={styles['pagination-controls']}>
            {page > 1 && (
              <Link
                href={`/dashboard/forms?page=${page - 1}${packageType ? `&packageType=${packageType}` : ''}${isActive ? `&isActive=${isActive}` : ''}${search ? `&search=${search}` : ''}`}
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
                  href={`/dashboard/forms?page=${pageNum}${packageType ? `&packageType=${packageType}` : ''}${isActive ? `&isActive=${isActive}` : ''}${search ? `&search=${search}` : ''}`}
                  className={`${styles['pagination-button']} ${pageNum === page ? styles['active'] : ''}`}
                >
                  {pageNum}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link
                href={`/dashboard/forms?page=${page + 1}${packageType ? `&packageType=${packageType}` : ''}${isActive ? `&isActive=${isActive}` : ''}${search ? `&search=${search}` : ''}`}
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
