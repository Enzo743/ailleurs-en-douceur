import { verifySession } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './page.module.scss';
import { getPackageLabel, PACKAGE_TYPE_OPTIONS } from '@/lib/constants';
import { formatDate } from '@/lib/time';
import {
  DashboardHeader,
  EmptyState,
  FilterForm,
  FormCard,
  Pagination,
  StatsGrid,
  StatusBadge
} from '@/components/dashboard';



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

  // Préparer les données pour les stats
  const mainStats = [
    { value: total, label: 'Total des formulaires' },
    {
      value: forms.reduce((acc, form) => acc + form._count.responses, 0),
      label: 'Réponses reçues'
    },
    {
      value: forms.reduce((acc, form) => acc + form._count.contactRequests, 0),
      label: 'Demandes associées'
    },
    { value: forms.filter(f => f.isActive).length, label: 'Formulaires actifs' }
  ];

  const packageStats = stats.length > 0
    ? stats.map(stat => ({
        value: stat._count._all,
        label: stat.packageType ? getPackageLabel(stat.packageType) : 'Non spécifié'
      }))
    : [];

  // Champs pour le formulaire de filtre
  const filterFields = [
    {
      type: 'select' as const,
      name: 'packageType',
      label: 'Type d\'offre',
      options: [
        { value: '', label: 'Toutes les offres' },
        ...PACKAGE_TYPE_OPTIONS
      ]
    },
    {
      type: 'select' as const,
      name: 'isActive',
      label: 'Statut',
      options: [
        { value: '', label: 'Tous les statuts' },
        { value: 'true', label: 'Actif' },
        { value: 'false', label: 'Inactif' }
      ]
    },
    {
      type: 'text' as const,
      name: 'search',
      label: 'Recherche',
      placeholder: 'Nom du formulaire...'
    }
  ];

  return (
    <section className="dashboard-page">
      <DashboardHeader
        title="Formulaires personnalisés"
        subtitle="Créez et gérez les formulaires envoyés à vos clients"
        actionButton={{
          label: '+ Nouveau formulaire',
          href: '/dashboard/forms/new'
        }}
      />

      {/* Statistiques */}
      <div className="dashboard-stats">
        <StatsGrid items={mainStats} />
        
        {packageStats.length > 0 && (
          <StatsGrid items={packageStats} />
        )}
      </div>

      {/* Filtres */}
      <FilterForm
        fields={filterFields}
        basePath="/dashboard/forms"
      />

      {/* Liste des formulaires */}
      <div className={styles.cards}>
        {forms.length === 0 ? (
          <EmptyState
            message="Aucun formulaire trouvé."
            action={{ label: 'Créer votre premier formulaire', href: '/dashboard/forms/new' }}
          />
        ) : (
          forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/dashboard/forms"
          searchParams={{ packageType, isActive, search }}
        />
      )}
    </section>
  );
}
