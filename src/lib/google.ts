import 'server-only';
import { google } from 'googleapis';

// Type pour les tokens OAuth2 stockés en session ou base de données
interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

// Configuration de l'OAuth2 Client
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Configuration pour Service Account (alternative pour production)
const getServiceAccountAuth = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return null;
  }

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
    subject: process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT
  });
};

/**
 * Récupère un client authentifié Google Calendar
 * Priorité : Service Account > OAuth2 avec tokens stockés
 */
export const getCalendarClient = async (tokens?: GoogleTokens) => {
  // Essayer Service Account d'abord (meilleur pour server-side)
  const serviceAuth = getServiceAccountAuth();
  if (serviceAuth) {
    return google.calendar({ version: 'v3', auth: serviceAuth });
  }

  // Sinon, utiliser OAuth2
  const oauth2Client = getOAuth2Client();
  
  if (tokens) {
    oauth2Client.setCredentials(tokens);
  }
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Génère l'URL d'autorisation pour OAuth2
 */
export const getGoogleAuthUrl = () => {
  const oauth2Client = getOAuth2Client();
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force le refresh token
  });
};

/**
 * Échange le code d'autorisation contre des tokens
 */
export const exchangeCodeForTokens = async (code: string): Promise<GoogleTokens> => {
  const oauth2Client = getOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Missing tokens in Google OAuth response');
  }

  const expiryDate = tokens.expiry_date 
    ? tokens.expiry_date 
    : Date.now() + ((tokens as any).expires_in || 3600) * 1000;

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: expiryDate,
  };
};

/**
 * Crée un événement Google Calendar avec Google Meet
 */
export interface CreateMeetEventParams {
  summary: string;
  description?: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  attendeeEmail: string;
  attendeeName?: string;
}

export interface MeetEventResult {
  eventId: string;
  meetLink: string;
  htmlLink: string;
  calendarEvent: any;
}

export const createMeetEvent = async (
  params: CreateMeetEventParams,
  tokens?: GoogleTokens
): Promise<MeetEventResult> => {
  const calendar = await getCalendarClient(tokens);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const startDateTime = new Date(params.startDateTime).toISOString();
  const endDateTime = new Date(params.endDateTime).toISOString();

  const attendees = [
    { email: params.attendeeEmail, displayName: params.attendeeName },
  ];

  // Pour forcer la création d'un lien Meet, on utilise conferenceData
  const eventRequest = {
    summary: params.summary,
    description: params.description || '',
    start: { dateTime: startDateTime, timeZone: 'Europe/Paris' },
    end: { dateTime: endDateTime, timeZone: 'Europe/Paris' },
    attendees: attendees.map(a => ({ email: a.email, displayName: a.displayName })),
    conferenceData: {
      createRequest: {
        conferenceSolutionKey: { type: 'hangoutsMeet' },
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      },
    },
    reminders: {
      useDefault: true,
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventRequest,
      conferenceDataVersion: 1,
    });

    const event = response.data;

    if (!event.hangoutLink) {
      throw new Error('No Meet link created');
    }

    return {
      eventId: event.id!,
      meetLink: event.hangoutLink,
      htmlLink: event.htmlLink || event.hangoutLink,
      calendarEvent: event,
    };
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    throw new Error(`Failed to create Google Calendar event: ${error.message}`);
  }
};

/**
 * Vérifie la disponibilité d'un créneau
 */
export const checkTimeSlotAvailability = async (
  startDateTime: Date | string,
  endDateTime: Date | string,
  tokens?: GoogleTokens
): Promise<boolean> => {
  const calendar = await getCalendarClient(tokens);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const startIso = new Date(startDateTime).toISOString();
  const endIso = new Date(endDateTime).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startIso,
      timeMax: endIso,
      singleEvents: true,
    });

    // Si des événements existent dans ce créneau, il n'est pas disponible
    return response.data.items?.length === 0;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    // En cas d'erreur, on considère que le créneau est disponible
    // (pour éviter de bloquer la réservation)
    return true;
  }
};

/**
 * Annule un événement Google Calendar
 */
export const cancelCalendarEvent = async (eventId: string, tokens?: GoogleTokens): Promise<void> => {
  const calendar = await getCalendarClient(tokens);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error canceling Google Calendar event:', error);
    throw new Error(`Failed to cancel Google Calendar event: ${(error as Error).message}`);
  }
};

/**
 * Met à jour un événement Google Calendar
 */
export const updateCalendarEvent = async (
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    startDateTime?: Date | string;
    endDateTime?: Date | string;
  },
  tokens?: GoogleTokens
): Promise<any> => {
  const calendar = await getCalendarClient(tokens);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const updateBody: any = {};
  
  if (updates.summary) {
    updateBody.summary = updates.summary;
  }
  if (updates.description) {
    updateBody.description = updates.description;
  }
  if (updates.startDateTime) {
    updateBody.start = { dateTime: new Date(updates.startDateTime).toISOString(), timeZone: 'Europe/Paris' };
  }
  if (updates.endDateTime) {
    updateBody.end = { dateTime: new Date(updates.endDateTime).toISOString(), timeZone: 'Europe/Paris' };
  }

  try {
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: updateBody,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw new Error(`Failed to update Google Calendar event: ${(error as Error).message}`);
  }
};

/**
 * Récupère un événement Google Calendar
 */
export const getCalendarEvent = async (eventId: string, tokens?: GoogleTokens): Promise<any> => {
  const calendar = await getCalendarClient(tokens);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const response = await calendar.events.get({
      calendarId,
      eventId,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting Google Calendar event:', error);
    throw new Error(`Failed to get Google Calendar event: ${(error as Error).message}`);
  }
};

export default {
  getCalendarClient,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  createMeetEvent,
  checkTimeSlotAvailability,
  cancelCalendarEvent,
  updateCalendarEvent,
  getCalendarEvent,
};
