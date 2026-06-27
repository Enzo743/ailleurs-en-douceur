import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEmailConfig, getCustomFormUrl, getPackageLabel, formatNights } from '@/lib/email';

/**
 * POST /api/dashboard/contact-requests/[id]/resend-form
 * Renvoyer le lien du formulaire au client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verification de la session
    await verifySession();

    const { id } = await params;

    // Verifier que la demande de contact existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            name: true,
            successMessage: true,
            isActive: true,
          },
        },
      },
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvee' },
        { status: 404 }
      );
    }

    if (!contactRequest.formId || !contactRequest.form) {
      return NextResponse.json(
        { success: false, error: 'Cette demande n\'a pas de formulaire associe' },
        { status: 400 }
      );
    }

    // Note: isActive est dans le select maintenant, donc on peut vérifier
    const form = contactRequest.form;
    if (!form.isActive) {
      return NextResponse.json(
        { success: false, error: 'Le formulaire associe n\'est pas actif' },
        { status: 400 }
      );
    }

    // Configuration email
    const { transporter, emailFrom } = getEmailConfig();
    const emailFromConfig = emailFrom;

    // Generer l'URL du formulaire
    const customFormUrl = getCustomFormUrl(contactRequest.token);
    const packageLabel = getPackageLabel(contactRequest.packageType);

    // Preparation de l'email
    const emailSubject = `Rappel: Complétez votre formulaire pour votre projet - Ailleurs en Douceur`;

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
            .cta-button { display: inline-block; background: #4a3f2f; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 4px; margin: 15px 0; font-weight: bold; text-align: center; }
            .info-box { background: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ff9800; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rappel: Complétez votre formulaire</h1>
            </div>
            <div class="content">
              <p>Bonjour ${contactRequest.firstName},</p>
              
              <p>Nous vous rappelons que vous pouvez compléter notre formulaire personnalisé pour nous aider à mieux préparer votre projet.</p>
              
              <div class="field"><strong>Formule demandée:</strong> ${packageLabel}</div>
              <div class="field"><strong>Nombre de nuits:</strong> ${formatNights(contactRequest.nights)}</div>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0;"><strong>Pour aller plus loin :</strong></p>
                <p style="margin: 0 0 15px 0;">Complétez notre formulaire personnalisé pour nous aider à mieux préparer votre projet de ${packageLabel}.</p>
                <a href="${customFormUrl}" class="cta-button">Compléter le formulaire</a>
                <p style="margin: 10px 0 0 0; font-size: 12px;">Lien : ${customFormUrl}</p>
              </div>
              
              <p>Formulaire: <strong>${contactRequest.form.name}</strong></p>
              
              <p>À très bientôt,<br>Nelly d'Ailleurs en Douceur</p>
            </div>
            <div class="footer">
              <p>Ce message a été envoyé automatiquement via le site Ailleurs en Douceur.</p>
              <p>Merci de ne pas répondre à ce mail.</p>
              <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
${emailSubject}

Bonjour ${contactRequest.firstName},

Nous vous rappelons que vous pouvez completer notre formulaire personnalise pour nous aider a mieux preparer votre projet.

Formule demandee: ${packageLabel}
Nombre de nuits: ${formatNights(contactRequest.nights)}

Pour aller plus loin, completer notre formulaire :
${customFormUrl}

Formulaire: ${contactRequest.form.name}

A tres bientot,
Nelly d'Ailleurs en Douceur

Ce message a ete envoye automatiquement via le site Ailleurs en Douceur.
Merci de ne pas repondre a ce mail.
Date: ${new Date().toLocaleString('fr-FR')}
    `;

    // Envoyer l'email
    await transporter.sendMail({
      from: `"Ailleurs en Douceur" <${emailFromConfig}>`,
      to: contactRequest.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lien du formulaire renvoye avec succes',
        data: {
          contactRequestId: contactRequest.id,
          formId: contactRequest.formId,
          formName: contactRequest.form.name,
          emailSentTo: contactRequest.email,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error resending form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Une erreur est survenue lors du renvoi du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Pour les autres methodes HTTP
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Methode non autorisee' },
    { status: 405 }
  );
}
