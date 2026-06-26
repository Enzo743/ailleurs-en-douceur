import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Configuration du transporteur Nodemailer
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = parseInt(process.env.EMAIL_PORT || "587");
  const emailSecure = process.env.EMAIL_SECURE === "true";

  if (!emailUser || !emailPass) {
    throw new Error("Les variables d'environnement EMAIL_USER et EMAIL_PASS sont requises");
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

  return transporter;
};

// Mapper les types de formule
const packageLabels: Record<string, string> = {
  'escapade-en-douceur': 'Escapade en douceur',
  'voyage-sur-mesure': 'Voyage sur-mesure',
  'voyage-de-noces': 'Voyage de noces',
};

const getPackageLabel = (value: string): string => {
  return packageLabels[value] || value;
};

/**
 * POST /api/dashboard/contact-requests/[id]/resend-form
 * Renvoyer le lien du formulaire au client
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

    // Vérifier que la demande existe
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
      include: {
        form: true,
      },
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    if (!contactRequest.form) {
      return NextResponse.json(
        { success: false, error: 'Aucun formulaire associé à cette demande' },
        { status: 400 }
      );
    }

    if (!contactRequest.email) {
      return NextResponse.json(
        { success: false, error: 'Aucun email associé à cette demande' },
        { status: 400 }
      );
    }

    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://votre-domaine.com');
    const formUrl = `${baseUrl}/custom-form/${contactRequest.token}`;
    const packageLabel = getPackageLabel(contactRequest.packageType);
    
    // Récupération des contenus personnalisés depuis la base de données
    const emailSubjectContent = await prisma.siteContent.findUnique({
      where: { key: 'contact-email/client-subject' },
    });
    const emailMessageContent = await prisma.siteContent.findUnique({
      where: { key: 'contact-email/client-message' },
    });

    // Valeurs par défaut si non trouvées dans la base
    const clientSubject = emailSubjectContent?.value || 'Confirmation de votre demande - Ailleurs en Douceur';
    const customMessage = emailMessageContent?.value || 'Vous allez être recontacté prochainement pour obtenir plus d\'informations et convenir d\'un entretien en visioconférence.';

    // Création du transporteur
    const transporter = createTransporter();

    // Envoi de l'email au client
    await transporter.sendMail({
      from: `"Ailleurs en Douceur" <${emailFrom}>`,
      to: contactRequest.email,
      subject: clientSubject,
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="background: #f4e4c1; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: #8b7355; margin: 0;">Ailleurs en Douceur</h2>
              </div>
              <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                <p>Bonjour ${contactRequest.firstName},</p>
                <p>Nous vous remercions pour votre intérêt pour notre offre <strong>${packageLabel}</strong>.</p>
                
                <div style="background: #f8f4e8; padding: 15px; border-left: 4px solid #8b7355; margin: 15px 0;">
                  <p><strong>Veuillez remplir notre formulaire personnalisé pour nous aider à préparer votre projet :</strong></p>
                  <p style="text-align: center;">
                    <a href="${formUrl}" style="background: #8b7355; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">Remplir le formulaire maintenant</a>
                  </p>
                  <p style="text-align: center; font-size: 14px; color: #666;">
                    ou copiez ce lien dans votre navigateur: <code>${formUrl}</code>
                  </p>
                </div>
                
                <p>${customMessage}</p>
                <p>Nous sommes impatients de vous accompagner dans l'organisation de votre voyage.</p>
                
                <p>À très bientôt,<br>L'équipe Ailleurs en Douceur</p>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                <p>Ce message a été envoyé automatiquement. Veuillez ne pas y répondre directement.</p>
                <p>Ailleurs en Douceur - Organisation de voyages sur mesure</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lien du formulaire renvoyé avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error resending form:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors du renvoi du formulaire',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
