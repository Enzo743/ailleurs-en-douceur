import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  nights: string;
  message: string;
  privacyAccepted: boolean;
}

// Mapper les valeurs du formulaire vers des libellés lisibles
const getPackageLabel = (value: string): string => {
  const labels: Record<string, string> = {
    "escapade-en-douceur": "Escapade en douceur",
    "voyage-sur-mesure": "Voyage sur-mesure",
    "voyage-de-noces": "Voyage de noces",
  };
  return labels[value] || value;
};

// Configuration du transporteur Nodemailer
const createTransporter = () => {
  // Récupération des variables d'environnement
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = parseInt(process.env.EMAIL_PORT || "587");
  const emailSecure = process.env.EMAIL_SECURE === "true";

  if (!emailUser || !emailPass) {
    throw new Error("Les variables d'environnement EMAIL_USER et EMAIL_PASS sont requises");
  }

  // Configuration par défaut pour Gmail
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

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Récupération des variables d'environnement
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { error: "Configuration email manquante" },
        { status: 500 }
      );
    }

    // Validation basique
    if (!body.privacyAccepted) {
      return NextResponse.json(
        { error: "Vous devez accepter la politique de confidentialité" },
        { status: 400 }
      );
    }

    // Validation des champs requis
    const requiredFields = ["firstName", "lastName", "email", "packageType", "nights", "message"];
    for (const field of requiredFields) {
      if (!body[field as keyof ContactFormData]?.toString().trim()) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Veuillez fournir un email valide" },
        { status: 400 }
      );
    }

    // Validation du nombre de nuits
    const nights = parseInt(body.nights);
    if (isNaN(nights) || nights <= 0) {
      return NextResponse.json(
        { error: "Le nombre de nuits doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Récupération de l'email du destinataire (votre cliente)
    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || emailUser;
    
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Aucun email de destinataire configuré" },
        { status: 500 }
      );
    }

    // Création du transporteur
    const transporter = createTransporter();

    // Configuration de l'email
    const packageLabel = getPackageLabel(body.packageType);
    
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
              <div class="field"><strong>Nombre de nuits:</strong> ${nights} nuit${nights > 1 ? 's' : ''}</div>
              <div class="field">
                <strong>Message:</strong>
                <div class="message">${body.message.replace(/\n/g, '<br>')}</div>
              </div>
              <div class="field"><strong>Politique acceptée:</strong> ${body.privacyAccepted ? 'Oui' : 'Non'}</div>
            </div>
            <div class="footer">
              <p>Ce message a été envoyé via le formulaire de contact du site Ailleurs en Douceur.</p>
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
Nombre de nuits: ${nights} nuit${nights > 1 ? 's' : ''}

Message:
${body.message}

Politique de confidentialité acceptée: ${body.privacyAccepted ? 'Oui' : 'Non'}

Ce message a été envoyé via le formulaire de contact du site Ailleurs en Douceur.
Date: ${new Date().toLocaleString('fr-FR')}
    `;

    // Envoi de l'email
    await transporter.sendMail({
      from: `"Ailleurs en Douceur" <${emailUser}>`, // L'email de l'expéditeur
      to: recipientEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    // Réponse de succès
    return NextResponse.json(
      { 
        success: true, 
        message: "Email envoyé avec succès" 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer plus tard.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Pour les autres méthodes HTTP
export async function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée" },
    { status: 405 }
  );
}
