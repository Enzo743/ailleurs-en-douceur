import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache pour le token Umami (en mémoire, dure 50 minutes)
let umamiTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

// Fonction pour obtenir un token d'authentification Umami
async function getUmamiToken(): Promise<string | null> {
  const username = process.env.UMAMI_USERNAME;
  const password = process.env.UMAMI_PASSWORD;
  let baseUrl = process.env.UMAMI_API_URL || 'https://analytics.ailleurs-en-douceur.com';
  baseUrl = baseUrl.replace(/\/api$/, '');
  
  if (umamiTokenCache && umamiTokenCache.expiresAt > Date.now()) {
    return umamiTokenCache.token;
  }
  
  if (!username || !password) {
    console.error('Umami username and password not configured');
    return null;
  }
  
  try {
    const loginUrl = `${baseUrl}/api/auth/login`;
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      next: { revalidate: 0 },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Umami login failed: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }
    
    const data = await response.json();
    if (data.token) {
      umamiTokenCache = {
        token: data.token,
        expiresAt: Date.now() + (50 * 60 * 1000),
      };
      console.log('Umami token obtained successfully');
      return data.token;
    }
    
    console.error('No token received from Umami');
    return null;
  } catch (error) {
    console.error('Error getting Umami token:', error);
    return null;
  }
}

// Fonction pour vérifier si le token est valide
async function verifyUmamiToken(token: string): Promise<boolean> {
  let baseUrl = process.env.UMAMI_API_URL || 'https://analytics.ailleurs-en-douceur.com';
  baseUrl = baseUrl.replace(/\/api$/, '');
  
  try {
    const verifyUrl = `${baseUrl}/api/auth/verify`;
    const response = await fetch(verifyUrl, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      next: { revalidate: 0 },
    });
    return response.ok;
  } catch (error) {
    console.error('Error verifying Umami token:', error);
    return false;
  }
}

// Fonction générique pour appeler l'API Umami
async function callUmamiApi(
  endpoint: string,
  websiteId: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  try {
    let baseUrl = process.env.UMAMI_API_URL || 'https://analytics.ailleurs-en-douceur.com';
    baseUrl = baseUrl.replace(/\/api$/, '');
    
    const url = new URL(`${baseUrl}/api/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    
    let token = await getUmamiToken();
    if (!token) throw new Error('No Umami token');
    
    const isTokenValid = await verifyUmamiToken(token);
    if (!isTokenValid) {
      umamiTokenCache = null;
      token = await getUmamiToken();
      if (!token) throw new Error('Invalid Umami token');
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Umami API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in callUmamiApi:', error);
    return null;
  }
}

interface UmamiMetricData {
  x?: string;
  name?: string;
  y?: number;
  pageviews?: number;
  visitors?: number;
  visits?: number;
  bounces?: number;
  totaltime?: number;
}

// Statistiques générales
export async function getGeneralStats(websiteId: string, days: number = 30) {
  const startAt = Date.now() - days * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const stats: UmamiStatsData = await callUmamiApi(
      `websites/${websiteId}/stats`,
      websiteId,
      { startAt, endAt }
    );
    
    if (stats) {
      return {
        pageviews: [{ value: stats.pageviews || 0, date: new Date().toISOString() }],
        uniqueVisitors: [{ value: stats.visitors || 0, date: new Date().toISOString() }],
        sessions: [{ value: stats.visits || 0, date: new Date().toISOString() }],
        bounceRate: [{ value: stats.visits ? (stats.bounces / stats.visits) * 100 : 0, date: new Date().toISOString() }],
        avgSessionDuration: [{ value: stats.visits ? stats.totaltime / stats.visits : 0, date: new Date().toISOString() }],
        pagesPerSession: [{ value: stats.visits ? stats.pageviews / stats.visits : 0, date: new Date().toISOString() }],
      };
    }
    
    return { pageviews: [], uniqueVisitors: [], sessions: [], bounceRate: [], avgSessionDuration: [], pagesPerSession: [] };
  } catch (error) {
    console.error('Error getting general stats:', error);
    return { pageviews: [], uniqueVisitors: [], sessions: [], bounceRate: [], avgSessionDuration: [], pagesPerSession: [] };
  }
}

interface UmamiStatsData {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

// Pages les plus visitées
export async function getTopPages(websiteId: string, limit: number = 10) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const metrics: UmamiMetricData[] = await callUmamiApi(
      `websites/${websiteId}/metrics`,
      websiteId,
      { startAt, endAt, type: 'path', limit }
    );
    
    if (metrics) {
      return metrics.map(item => ({
        page: item.x || item.name || '/',
        pageviews: item.y || item.pageviews || 0,
        uniqueVisitors: item.visitors || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting top pages:', error);
    return [];
  }
}

// Referrers
export async function getReferrers(websiteId: string, limit: number = 10) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const metrics: UmamiMetricData[] = await callUmamiApi(
      `websites/${websiteId}/metrics`,
      websiteId,
      { startAt, endAt, type: 'referrer', limit }
    );
    
    if (metrics) {
      return metrics.map(item => ({
        referrer: item.x || item.name || 'Direct',
        pageviews: item.y || item.pageviews || 0,
        uniqueVisitors: item.visitors || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting referrers:', error);
    return [];
  }
}

// Appareils
export async function getDevices(websiteId: string) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const metrics: UmamiMetricData[] = await callUmamiApi(
      `websites/${websiteId}/metrics`,
      websiteId,
      { startAt, endAt, type: 'device' }
    );
    
    if (metrics) {
      return metrics.map(item => ({
        device: item.x || item.name || 'Unknown',
        pageviews: item.y || item.pageviews || 0,
        uniqueVisitors: item.visitors || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
}

// Pays
export async function getCountries(websiteId: string, limit: number = 10) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const metrics: UmamiMetricData[] = await callUmamiApi(
      `websites/${websiteId}/metrics`,
      websiteId,
      { startAt, endAt, type: 'country', limit }
    );
    
    if (metrics) {
      return metrics.map(item => ({
        country: item.x || item.name || 'Unknown',
        pageviews: item.y || item.pageviews || 0,
        uniqueVisitors: item.visitors || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting countries:', error);
    return [];
  }
}

// Pages de sortie
export async function getExitPages(websiteId: string, limit: number = 10) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const metrics: UmamiMetricData[] = await callUmamiApi(
      `websites/${websiteId}/metrics`,
      websiteId,
      { startAt, endAt, type: 'exit', limit }
    );
    
    if (metrics) {
      return metrics.map(item => ({
        page: item.x || item.name || '/',
        pageviews: item.y || item.pageviews || 0,
        uniqueVisitors: item.visitors || 0,
        exitRate: item.visits ? (item.bounces || 0) / item.visits * 100 : 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting exit pages:', error);
    return [];
  }
}

// Pages d'entrée
export async function getLandingPages(websiteId: string, limit: number = 10) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const metrics: UmamiMetricData[] = await callUmamiApi(
      `websites/${websiteId}/metrics`,
      websiteId,
      { startAt, endAt, type: 'entry', limit }
    );
    
    if (metrics) {
      return metrics.map(item => ({
        page: item.x || item.name || '/',
        pageviews: item.y || item.pageviews || 0,
        uniqueVisitors: item.visitors || 0,
        entranceRate: item.visits ? item.visits / (item.visitors || 1) * 100 : 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting landing pages:', error);
    return [];
  }
}

// Heures de pointe
export async function getTimeOfDayStats(websiteId: string) {
  const startAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  
  try {
    const data = await callUmamiApi(
      `websites/${websiteId}/pageviews`,
      websiteId,
      { startAt, endAt, unit: 'hour' }
    );
    return data || {};
  } catch (error) {
    console.error('Error getting time of day stats:', error);
    return {};
  }
}

// Taux de conversion
export async function getConversionRate(websiteId: string, days: number = 30) {
  try {
    const stats = await getGeneralStats(websiteId, days);
    const totalUniqueVisitors = stats.uniqueVisitors?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    
    const formSubmissions = await prisma.contactRequest.count({
      where: { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
    });
    
    const conversionRate = totalUniqueVisitors > 0 ? (formSubmissions / totalUniqueVisitors) * 100 : 0;
    
    return {
      totalUniqueVisitors,
      formSubmissions,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  } catch (error) {
    console.error('Error calculating conversion rate:', error);
    return { totalUniqueVisitors: 0, formSubmissions: 0, conversionRate: 0 };
  }
}

// Articles de blog les plus lus
export async function getTopBlogArticles(websiteId: string, limit: number = 10) {
  try {
    const pages = await getTopPages(websiteId, limit * 2);
    const blogArticles = pages.filter((page: any) => 
      page.page.startsWith('/blog/') && !page.page.endsWith('/blog')
    );
    return blogArticles.slice(0, limit);
  } catch (error) {
    console.error('Error getting top blog articles:', error);
    return [];
  }
}

// Endpoint principal
export async function GET(request: NextRequest) {
  try {
    const websiteId = process.env.UMAMI_WEBSITE_ID;
    const username = process.env.UMAMI_USERNAME;
    const password = process.env.UMAMI_PASSWORD;
    
    if (!websiteId) {
      return NextResponse.json({ error: 'Umami website ID not configured' }, { status: 500 });
    }
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Umami credentials not configured' }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const [generalStats, topPages, referrers, devices, countries, exitPages, landingPages, timeOfDayStats, conversionRate, topBlogArticles] = await Promise.all([
      getGeneralStats(websiteId, days),
      getTopPages(websiteId, limit),
      getReferrers(websiteId, limit),
      getDevices(websiteId),
      getCountries(websiteId, limit),
      getExitPages(websiteId, limit),
      getLandingPages(websiteId, limit),
      getTimeOfDayStats(websiteId),
      getConversionRate(websiteId, days),
      getTopBlogArticles(websiteId, limit),
    ]);
    
    const totalPageviews = generalStats.pageviews?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    const totalUniqueVisitors = generalStats.uniqueVisitors?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    const totalSessions = generalStats.sessions?.reduce((sum: number, day: any) => sum + day.value, 0) || 0;
    const avgBounceRate = generalStats.bounceRate?.reduce((sum: number, day: any) => sum + day.value, 0) / generalStats.bounceRate?.length || 0;
    const avgSessionDuration = generalStats.avgSessionDuration?.reduce((sum: number, day: any) => sum + day.value, 0) / generalStats.avgSessionDuration?.length || 0;
    const avgPagesPerSession = generalStats.pagesPerSession?.reduce((sum: number, day: any) => sum + day.value, 0) / generalStats.pagesPerSession?.length || 0;
    
    return NextResponse.json({
      success: true,
      data: {
        totals: {
          pageviews: totalPageviews,
          uniqueVisitors: totalUniqueVisitors,
          sessions: totalSessions,
          bounceRate: parseFloat(avgBounceRate.toFixed(2)),
          avgSessionDuration: Math.round(avgSessionDuration),
          avgPagesPerSession: parseFloat(avgPagesPerSession.toFixed(2)),
        },
        stats: generalStats,
        topPages,
        referrers,
        devices,
        countries,
        exitPages,
        landingPages,
        timeOfDayStats,
        conversionRate,
        topBlogArticles,
        charts: {
          pageviews: generalStats.pageviews || [],
          uniqueVisitors: generalStats.uniqueVisitors || [],
          sessions: generalStats.sessions || [],
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}

// Méthodes non autorisées
export async function POST() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }