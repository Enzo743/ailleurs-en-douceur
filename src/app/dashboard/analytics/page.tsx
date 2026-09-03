import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import { getArticleCount } from '@/app/actions/articles';
import { prisma } from '@/lib/prisma';
import {
  AnalyticsCard,
  AnalyticsChart,
  TopPagesTable,
  ReferrersTable,
  DeviceChart,
  ConversionRate,
  BounceRate,
  BlogArticlesTable,
  VisitsChart,
  SessionDuration,
  PagesPerSession,
  ExitPagesTable,
  LandingPagesTable,
  CountryChart,
  TimeOfDayChart,
  DashboardHeader
} from '@/components/dashboard';
import styles from './analytics.module.scss';
import {
  getGeneralStats,
  getTopPages,
  getReferrers,
  getDevices,
  getCountries,
  getExitPages,
  getLandingPages,
  getTimeOfDayStats,
  getConversionRate,
  getTopBlogArticles,
} from '@/app/api/analytics/route';

// Type pour les données analytics
interface AnalyticsData {
  totals: {
    pageviews: number;
    uniqueVisitors: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: number;
    avgPagesPerSession: number;
  };
  stats: {
    pageviews: { value: number; date: string }[];
    uniqueVisitors: { value: number; date: string }[];
    sessions: { value: number; date: string }[];
  };
  topPages: any[];
  referrers: any[];
  devices: any[];
  countries: any[];
  exitPages: any[];
  landingPages: any[];
  timeOfDayStats: any;
  conversionRate: {
    totalUniqueVisitors: number;
    formSubmissions: number;
    conversionRate: number;
  };
  topBlogArticles: any[];
}

export default async function AnalyticsPage() {
  await verifySession();
  
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  
  if (!websiteId) {
    return (
      <section className="dashboard-page">
        <DashboardHeader
          title="Analytics"
          subtitle="Statistiques du site"
        />
        <div className={styles.errorMessage}>
          <h3>⚠️ Configuration Umami manquante</h3>
          <p>Impossible de se connecter à votre instance Umami. Veuillez vérifier :</p>
          <ul>
            <li><strong>UMAMI_WEBSITE_ID</strong> : L'ID de votre site dans Umami</li>
            <li><strong>UMAMI_USERNAME</strong> : Un utilisateur Umami valide</li>
            <li><strong>UMAMI_PASSWORD</strong> : Le mot de passe de cet utilisateur</li>
            <li><strong>UMAMI_API_URL</strong> : L'URL de votre API Umami (ex: https://analytics.ailleurs-en-douceur.com/api)</li>
          </ul>
          <p><strong>Astuce :</strong> Si vous avez installé Umami sur votre VPS, assurez-vous que l'URL est accessible depuis votre application Next.js.</p>
        </div>
      </section>
    );
  }

  try {
    // Récupérer les statistiques du site et les données Umami en parallèle
    const [
      articleCount,
      contactRequests,
      totalTrips,
      confirmedAppointments,
      generalStats,
      topPages,
      referrers,
      devices,
      countries,
      exitPages,
      landingPages,
      timeOfDayStats,
      conversionRate,
      topBlogArticles,
    ] = await Promise.all([
      getArticleCount(),
      prisma.contactRequest.findMany(),
      prisma.contactRequest.count(),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      getGeneralStats(websiteId, 30),
      getTopPages(websiteId, 10),
      getReferrers(websiteId, 10),
      getDevices(websiteId),
      getCountries(websiteId, 10),
      getExitPages(websiteId, 10),
      getLandingPages(websiteId, 10),
      getTimeOfDayStats(websiteId),
      getConversionRate(websiteId, 30),
      getTopBlogArticles(websiteId, 10),
    ]);

    // Calculer les totaux
    const totalPageviews = generalStats.pageviews?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    const totalUniqueVisitors = generalStats.uniqueVisitors?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    const totalSessions = generalStats.sessions?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    const avgBounceRate = generalStats.bounceRate?.reduce((sum: number, day: any) => sum + day.value, 0) / generalStats.bounceRate?.length || 0;
    const avgSessionDuration = generalStats.avgSessionDuration?.reduce((sum: number, day: any) => sum + day.value, 0) / generalStats.avgSessionDuration?.length || 0;
    const avgPagesPerSession = generalStats.pagesPerSession?.reduce((sum: number, day: any) => sum + day.value, 0) / generalStats.pagesPerSession?.length || 0;

    return (
      <section className="dashboard-page">
        <DashboardHeader
          title="Analytics"
          subtitle="Statistiques du site"
        />

        {/* Statistiques du site */}
        <div className={styles.siteStatsSection}>
          <h3 className={styles.siteStatsTitle}>Statistiques du site</h3>
          <div className={styles.siteStatsGrid}>
            <div className={styles.siteStatCard}>
              <h4 className={styles.siteStatTitle}>Articles</h4>
              <p className={styles.siteStatValue}>{articleCount}</p>
            </div>
            <div className={styles.siteStatCard}>
              <h4 className={styles.siteStatTitle}>Voyages</h4>
              <p className={styles.siteStatValue}>{totalTrips}</p>
            </div>
            <div className={styles.siteStatCard}>
              <h4 className={styles.siteStatTitle}>Réservations</h4>
              <p className={styles.siteStatValue}>{confirmedAppointments}</p>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className={styles.metricsGrid}>
          <AnalyticsCard
            title="Vues totales"
            value={totalPageviews.toLocaleString('fr-FR')}
            subtitle="Nombre total de pages consultées"
            icon="👁️"
          />
          
          <AnalyticsCard
            title="Visiteurs uniques"
            value={totalUniqueVisitors.toLocaleString('fr-FR')}
            subtitle="Nombre de visiteurs uniques"
            icon="👥"
          />
          
          <AnalyticsCard
            title="Sessions"
            value={totalSessions.toLocaleString('fr-FR')}
            subtitle="Nombre total de sessions"
            icon="📊"
          />
          
          <BounceRate bounceRate={parseFloat(avgBounceRate.toFixed(2))} />
          
          <SessionDuration avgSessionDuration={Math.round(avgSessionDuration)} />
          
          <PagesPerSession avgPagesPerSession={parseFloat(avgPagesPerSession.toFixed(2))} />
          
          <ConversionRate
            conversionRate={conversionRate.conversionRate}
            totalUniqueVisitors={conversionRate.totalUniqueVisitors}
            formSubmissions={conversionRate.formSubmissions}
          />
        </div>

        {/* Graphique d'évolution des visites */}
        <div className={styles.chartSection}>
          <VisitsChart
            pageviews={generalStats.pageviews || []}
            uniqueVisitors={generalStats.uniqueVisitors || []}
            sessions={generalStats.sessions || []}
            title="Évolution des visites (30 derniers jours)"
            height={350}
          />
        </div>

        {/* Graphiques et tableaux */}
        <div className={styles.dashboardGrid}>
          {/* Appareils utilisés */}
          <div className={styles.chartContainer}>
            <DeviceChart data={devices} height={300} />
          </div>

          {/* Localisation géographique */}
          <div className={styles.chartContainer}>
            <CountryChart data={countries} height={300} />
          </div>

          {/* Heures de pointe */}
          <div className={styles.chartContainer}>
            <TimeOfDayChart data={formatTimeOfDayData(timeOfDayStats)} height={300} />
          </div>

          {/* Pages les plus consultées */}
          <div className={styles.tableContainer}>
            <TopPagesTable data={topPages} limit={5} />
          </div>

          {/* Sources de trafic */}
          <div className={styles.tableContainer}>
            <ReferrersTable data={referrers} limit={5} />
          </div>

          {/* Articles de blog les plus lus */}
          <div className={styles.tableContainer}>
            <BlogArticlesTable data={topBlogArticles} limit={5} />
          </div>

          {/* Pages d'entrée */}
          <div className={styles.tableContainer}>
            <LandingPagesTable data={landingPages} limit={5} />
          </div>

          {/* Pages de sortie */}
          <div className={styles.tableContainer}>
            <ExitPagesTable data={exitPages} limit={5} />
          </div>
        </div>

        <div className={styles.infoMessage}>
          <p>💡 <strong>Conseil:</strong> Les données sont mises à jour toutes les 5 minutes. Pour des statistiques en temps réel, consultez directement votre tableau de bord Umami.</p>
          <Link 
            href={process.env.UMAMI_API_URL?.replace('/api', '') || '/analytics'}
            className={styles.analyticsButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            Aller sur Umami →
          </Link>
        </div>
      </section>
    );
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    return (
      <section className="dashboard-page">
        <DashboardHeader
          title="Analytics"
          subtitle="Statistiques du site"
        />
        <div className={styles.errorMessage}>
          <h3>⚠️ Erreur de connexion à Umami</h3>
          <p>Impossible de récupérer les données analytics.</p>
          <p><strong>Détails :</strong> {String(error)}</p>
          <p><strong>Astuce :</strong> Vérifiez que votre instance Umami est accessible et que vos identifiants sont corrects.</p>
        </div>
      </section>
    );
  }
}

// Fonction pour formater les données "Heures de pointe"
function formatTimeOfDayData(timeOfDayStats: any) {
  if (!timeOfDayStats?.pageviews) return [];
  
  return timeOfDayStats.pageviews.map((item: any) => ({
    hour: new Date(item.date).getHours(),
    pageviews: item.value,
    uniqueVisitors: timeOfDayStats.uniqueVisitors?.find((u: any) => u.date === item.date)?.value || 0,
  }));
}