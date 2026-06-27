import 'server-only';
import nodemailer from 'nodemailer';

// ============================================================================
// Configuration Email
// ============================================================================

interface EmailConfig {
  transporter: nodemailer.Transporter;
  emailFrom: string;
  emailUser: string;
  recipientEmail: string;
}

/**
 * Récupère la configuration email complète à partir des variables d'environnement
 * Lève une erreur si la configuration est incomplète
 */
export function getEmailConfig(): EmailConfig {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailSecure = process.env.EMAIL_SECURE === 'true';
  const emailFrom = process.env.EMAIL_FROM || emailUser || '';
  const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || emailUser || '';

  if (!emailUser || !emailPass) {
    throw new Error('Les variables d\'environnement EMAIL_USER et EMAIL_PASS sont requises');
  }

  if (!emailFrom) {
    throw new Error('La variable d\'environnement EMAIL_FROM est requise');
  }

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return {
    transporter,
    emailFrom,
    emailUser,
    recipientEmail,
  };
}

/**
 * Crée un transporteur Nodemailer simple (sans lever d'erreur)
 * Utile pour les cas où on veut gérer les erreurs manuellement
 */
export function createTransporter(): nodemailer.Transporter {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailSecure = process.env.EMAIL_SECURE === 'true';

  if (!emailUser || !emailPass) {
    throw new Error('Les variables d\'environnement EMAIL_USER et EMAIL_PASS sont requises');
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

/**
 * Récupère l'email de l'expéditeur
 */
export function getEmailFrom(): string {
  const emailFrom = process.env.EMAIL_FROM;
  if (!emailFrom) {
    throw new Error('La variable d\'environnement EMAIL_FROM est requise');
  }
  return emailFrom;
}

/**
 * Récupère l'email du destinataire (Nelly)
 */
export function getRecipientEmail(): string {
  return process.env.CONTACT_RECIPIENT_EMAIL || process.env.EMAIL_USER || '';
}

// ============================================================================
// Générateurs d'URL
// ============================================================================

/**
 * Génère l'URL de base de l'application
 */
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.DOMAIN || 'https://votre-domaine.com')
  );
}

/**
 * Génère l'URL d'un formulaire personnalisé
 */
export function getCustomFormUrl(token: string): string {
  return `${getBaseUrl()}/custom-form/${token}`;
}

/**
 * Génère l'URL du planning
 */
export function getScheduleUrl(token: string): string {
  return `${getBaseUrl()}/schedule/${token}`;
}

// ============================================================================
// Helpers pour les emails
// ============================================================================

/**
 * Mapper les valeurs du formulaire vers des libellés lisibles
 */
export function getPackageLabel(value: string): string {
  const labels: Record<string, string> = {
    'escapade-en-douceur': 'Escapade en douceur',
    'voyage-sur-mesure': 'Voyage sur-mesure',
    'voyage-de-noces': 'Voyage de noces',
  };
  return labels[value] || value;
}

/**
 * Formate le nombre de nuits avec le bon pluriel
 */
export function formatNights(nights: number): string {
  return `${nights} nuit${nights > 1 ? 's' : ''}`;
}

/**
 * Formate une date en français
 */
export function formatDateFr(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Formate une date pour l'affichage avec heure
 */
export function formatDateForDisplay(date: Date | string, includeTime: boolean = false): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('fr-FR', options);
}
