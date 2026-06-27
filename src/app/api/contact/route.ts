import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { generateContactRequestToken } from '@/lib/tokens';
import {
  getEmailConfig,
  getCustomFormUrl,
  getPackageLabel,
  formatNights,
} from '@/lib/email';
import { validateContactForm, type ContactFormData } from '@/lib/validation';

/**
 * POST /api/contact
 * Traite une nouvelle demande de contact via le formulaire
 * Creer la demande en base, envoie des emails de notification
 */
export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validation complete du formulaire
    const validation = validateContactForm(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.errors[0]?.error || 'Donnees invalides',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Configuration email
    const { transporter, emailFrom, recipientEmail } = getEmailConfig();

    // Verification recipientEmail
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Aucun email de destinataire configure' },
        { status: 500 }
      );
    }

    // Contenus personnalises
    const emailSubjectContent = await prisma.siteContent.findUnique({
      where: { key: 'contact-email/client-subject' },
    });

    const clientSubject = emailSubjectContent?.value || 'Confirmation de votre demande - Ailleurs en Douceur';

    // Conversion du nombre de nuits
    const nights = parseInt(body.nights);

    // Trouver le formulaire personnalise
    const customForm = await prisma.customForm.findFirst({
      where: {
        packageType: body.packageType,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Creer la demande de contact
    const token = generateContactRequestToken();
    const packageLabel = getPackageLabel(body.packageType);

    const contactRequest = await prisma.contactRequest.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        packageType: body.packageType,
        nights: nights,
        message: body.message,
        token: token,
        formId: customForm?.id,
        status: 'PENDING',
      },
    });

    // URL du formulaire personnalise
    const customFormUrl = getCustomFormUrl(token);
    const hasCustomForm = customForm !== null;

    // ==========================================================================
    // Email a la destinataire (Nelly)
    // ==========================================================================

    const emailSubject = `Nouvelle demande de contact - Ailleurs en Douceur`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4e4c1; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; color: #4a3f2f; }
            .content { background: #fff; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .field strong { display: inline-block; width: 150px; color: #4a3f2f; }
            .message { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 15px; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nouvelle demande de contact</h1>
            </div>
            <div class="content">
              <div class="field"><strong>Nom complet:</strong> ${body.firstName} ${body.lastName}</div>
              <div class="field"><strong>Email:</strong> ${body.email}</div>
              <div class="field"><strong>Type de formule:</strong> ${packageLabel}</div>
              <div class="field"><strong>Nombre de nuits:</strong> ${formatNights(nights)}</div>
              <div class="field">
                <strong>Message:</strong>
                <div class="message">${body.message.replace(/\n/g, '<br>')}</div>
              </div>
              <div class="field"><strong>Politique de confidentialite acceptee:</strong> ${body.privacyAccepted ? 'Oui' : 'Non'}</div>
              <p><strong>Token de la demande :</strong> ${token}</p>
            </div>
            <div class="footer">
              <p>Ce message a ete envoye via le formulaire de contact du site Ailleurs en Douceur.</p>
              <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Nouvelle demande de contact - Ailleurs en Douceur

Nom complet: ${body.firstName} ${body.lastName}
Email: ${body.email}
Type de formule: ${packageLabel}
Nombre de nuits: ${formatNights(nights)}

Message:
${body.message}

Politique de confidentialite acceptee: ${body.privacyAccepted ? 'Oui' : 'Non'}

Token de la demande : ${token}

Ce message a ete envoye via le formulaire de contact du site Ailleurs en Douceur.
Date: ${new Date().toLocaleString('fr-FR')}
    `;

    // Envoyer a la destinataire
    await transporter.sendMail({
      from: `"Ailleurs en Douceur" <${emailFrom}>`,
      to: recipientEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    // ==========================================================================
    // Email de confirmation au client
    // ==========================================================================

    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4e4c1; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; color: #4a3f2f; }
            .content { background: #fff; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .field strong { display: inline-block; width: 150px; color: #4a3f2f; }
            .message { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 15px; }
            .confirmation { background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2e7d32; }
            .cta-button { display: inline-block; background: #4a3f2f; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 4px; margin: 15px 0; font-weight: bold; text-align: center; }
            .info-box { background: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ff9800; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Merci pour votre demande</h1>
            </div>
            <div class="content">
              <p>Bonjour ${body.firstName},</p>
              
              <p>Nous avons bien recu votre demande de contact. Voici un recapitulatif :</p>
              
              <div class="field"><strong>Nom:</strong> ${body.firstName} ${body.lastName}</div>
              <div class="field"><strong>Email:</strong> ${body.email}</div>
              <div class="field"><strong>Formule demandee:</strong> ${packageLabel}</div>
              <div class="field"><strong>Nombre de nuits:</strong> ${formatNights(nights)}</div>
              <div class="field">
                <strong>Votre message:</strong>
                <div class="message">${body.message.replace(/\n/g, '<br>')}</div>
              </div>
              
              ${hasCustomForm
                ? `
                <div class="info-box">
                  <p style="margin: 0 0 10px 0;"><strong>Pour aller plus loin :</strong></p>
                  <p style="margin: 0 0 15px 0;">Nous vous invitons a completer notre formulaire personnalise pour nous aider a mieux preparer votre projet.</p>
                  <a href="${customFormUrl}" class="cta-button">Completer le formulaire</a>
                  <p style="margin: 10px 0 0 0; font-size: 12px;">Lien : ${customFormUrl}</p>
                </div>
                `
                : `
                <div class="info-box">
                  <p style="margin: 0;">Vous allez etre recontacte prochainement pour convenir d'un rendez-vous personnalise.</p>
                </div>
                `
              }
              
              <p>A tres bientot,<br>Nelly d'Ailleurs en Douceur</p>
            </div>
            <div class="footer">
              <p>Ce message a ete envoye automatiquement via le formulaire de contact du site Ailleurs en Douceur.</p>
              <p>Merci de ne pas repondre a ce mail, il a etait envoye par un robot.</p>
              <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const clientEmailText = `
${clientSubject}

Bonjour ${body.firstName},

Nous avons bien recu votre demande de contact. Voici un recapitulatif :

Nom: ${body.firstName} ${body.lastName}
Email: ${body.email}
Formule demandee: ${packageLabel}
Nombre de nuits: ${formatNights(nights)}

Votre message:
${body.message}

${hasCustomForm
  ? `
Pour aller plus loin, nous vous invitons a completer notre formulaire personnalise :
${customFormUrl}

Cette etape nous aidera a mieux preparer votre projet.
`
  : 'Vous allez etre recontacte prochainement pour convenir d\'un rendez-vous personnalise.'
}

A tres bientot,
Nelly d'Ailleurs en Douceur

Ce message a ete envoye automatiquement via le formulaire de contact du site Ailleurs en Douceur.
Merci de ne pas repondre a ce mail, il a etait envoye par un robot.
Date: ${new Date().toLocaleString('fr-FR')}
    `;

    // Envoyer au client
    await transporter.sendMail({
      from: `"Ailleurs en Douceur" <${emailFrom}>`,
      to: body.email,
      subject: clientSubject,
      text: clientEmailText,
      html: clientEmailHtml,
    });

    // Reponse de succes
    return NextResponse.json(
      { 
        success: true, 
        message: 'Email envoye avec succes',
        data: {
          contactRequestId: contactRequest.id,
          token,
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Une erreur est survenue lors de l\'envoi du message. Veuillez reessayer plus tard.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Pour les autres methodes HTTP
export async function GET() {
  return NextResponse.json(
    { error: ' Methode non autorisee' },
    { status: 405 }
  );
}
