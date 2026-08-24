import 'server-only';
import * as nodemailer from 'nodemailer';

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
 * Crée un transporter pour Brevo (ex-Sendinblue)
 * Supporte deux méthodes d'authentification :
 * 1. Avec identifiants SMTP spécifiques (utilisateur@smtp-brevo.com + mot de passe)
 * 2. Avec API key (apikey + API key)
 */
function createBrevoTransporter(): nodemailer.Transporter {
  // Méthode 1: Vérifier si on a des identifiants SMTP spécifiques (préférée)
  const smtpUser = process.env.BREVO_SMTP_USER;
  const smtpPass = process.env.BREVO_SMTP_PASS;
  
  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  
  // Méthode 2: Utiliser l'API key (ancienne méthode)
  const apiKey = process.env.BREVO_API_KEY;
  
  if (apiKey) {
    return nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: 'apikey',
        pass: apiKey,
      },
    });
  }
  
  throw new Error('Aucune configuration Brevo trouvée. Configurez soit BREVO_SMTP_USER/BREVO_SMTP_PASS, soit BREVO_API_KEY');
}

/**
 * Crée un transporter SMTP standard
 */
function createSmtpTransporter(): nodemailer.Transporter {
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
 * Récupère la configuration email complète à partir des variables d'environnement
 * Supporte à la fois SMTP standard et Brevo (ex-Sendinblue)
 * Lève une erreur si la configuration est incomplète
 */
export function getEmailConfig(): EmailConfig {
  const emailFrom = process.env.EMAIL_FROM || '';
  const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || process.env.EMAIL_USER || '';

  // Priorité à Brevo si l'API key est définie
  const useBrevo = !!process.env.BREVO_API_KEY;
  
  let transporter: nodemailer.Transporter;
  let emailUser: string;

  if (useBrevo) {
    transporter = createBrevoTransporter();
    emailUser = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || '';
  } else {
    transporter = createSmtpTransporter();
    emailUser = process.env.EMAIL_USER || '';
  }

  if (!emailFrom) {
    throw new Error('La variable d\'environnement EMAIL_FROM est requise');
  }

  if (!emailUser) {
    throw new Error('La variable d\'environnement EMAIL_USER ou BREVO_SENDER_EMAIL est requise');
  }

  return {
    transporter,
    emailFrom,
    emailUser,
    recipientEmail,
  };
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
 * Formate le nombre de jours avec le bon pluriel
 */
export function formatDays(days: number): string {
  return `${days} jour${days > 1 ? 's' : ''}`;
}

// Alias pour la compatibilité ascendante
export function formatNights(nights: number): string {
  return formatDays(nights);
}
