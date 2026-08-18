import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailConfig, getCustomFormUrl, formatDays } from '@/lib/email';
import { getPackageLabel } from '@/lib/constants';

/**
 * POST /api/dashboard/contact-requests/[id]/assign-form
 * Associe un formulaire à une demande de contact et envoie un email au client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérification de la session
    await verifySession();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la demande de contact est requis' },
        { status: 400 }
      );
    }

    // Récupérer les données du formulaire
    const body = await request.formData();
    const formId = body.get('formId') as string;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'L\'ID du formulaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le formulaire existe et est actif
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulaire non trouvé' },
        { status: 404 }
      );
    }

    if (!form.isActive) {
      return NextResponse.json(
        { success: false, error: 'Le formulaire doit être actif pour être associé' },
        { status: 400 }
      );
    }

    // Vérifier que la demande de contact existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Associer le formulaire
    const updatedRequest = await prisma.contactRequest.update({
      where: { id },
      data: { formId: form.id },
    });

    // Envoyer un email au client avec le lien du formulaire
    try {
      const { emailFrom, transporter } = await getEmailConfig();
      const customFormUrl = getCustomFormUrl(updatedRequest.token);
      const packageLabel = getPackageLabel(updatedRequest.packageType);
      
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
              .info-box { background: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ff9800; }
              .cta-button { display: inline-block; background: #4a3f2f; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 4px; margin: 15px 0; font-weight: bold; text-align: center; }
              .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Merci pour votre demande</h1>
              </div>
              <div class="content">
                <p>Bonjour ${updatedRequest.firstName},</p>
                
                <p>Nous avons bien reçu votre demande de contact. Voici un récapitulatif :</p>
                
                <div class="field"><strong>Nom:</strong> ${updatedRequest.firstName} ${updatedRequest.lastName}</div>
                <div class="field"><strong>Email:</strong> ${updatedRequest.email}</div>
                <div class="field"><strong>Formule demandée:</strong> ${packageLabel}</div>
                <div class="field"><strong>Nombre de jours:</strong> ${formatDays(updatedRequest.days)}</div>
                <div class="field">
                  <strong>Votre message:</strong>
                  <div class="message">${updatedRequest.message?.replace(/\n/g, '<br>') || 'Aucun message'}</div>
                </div>
                
                <div class="info-box">
                  <p style="margin: 0 0 10px 0;"><strong>Pour aller plus loin :</strong></p>
                  <p style="margin: 0 0 15px 0;">Nous vous invitons à compléter notre formulaire personnalisé pour nous aider à mieux préparer votre projet.</p>
                  <a href="${customFormUrl}" class="cta-button">Compléter le formulaire</a>
                  <p style="margin: 10px 0 0 0; font-size: 12px;">Lien : ${customFormUrl}</p>
                </div>
                
                <div class="footer">
                  <p>Ce message a été envoyé via le formulaire de contact du site Ailleurs en Douceur.</p>
                  <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const clientEmailText = `
Merci pour votre demande

Bonjour ${updatedRequest.firstName},

Nous avons bien reçu votre demande de contact.

Nom: ${updatedRequest.firstName} ${updatedRequest.lastName}
Email: ${updatedRequest.email}
Formule demandée: ${packageLabel}
Nombre de jours: ${formatDays(updatedRequest.days)}

Votre message:
${updatedRequest.message || 'Aucun message'}

Pour aller plus loin, nous vous invitons à compléter notre formulaire personnalisé :
${customFormUrl}

Ce message a été envoyé via le formulaire de contact du site Ailleurs en Douceur.
Date: ${new Date().toLocaleString('fr-FR')}
      `;

      // Envoyer l'email au client
      await transporter.sendMail({
        from: `"Ailleurs en Douceur" <${emailFrom}>`,
        to: updatedRequest.email,
        subject: `Votre demande de contact - Ailleurs en Douceur`,
        text: clientEmailText,
        html: clientEmailHtml,
      });

    } catch (emailError) {
      console.error('Error sending email after form assignment:', emailError);
      // Ne pas échouer la requête à cause de l'email
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Formulaire associé avec succès ! Le client a reçu un email avec le lien pour compléter le formulaire.',
        data: {
          contactRequestId: id,
          formId: form.id,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error assigning form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de l\'association du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
