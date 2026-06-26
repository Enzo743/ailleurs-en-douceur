import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /dashboard/contact-requests/[id]
 * Met à jour ou supprime une demande de contact
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

    const body = await request.formData();
    const method = body.get('_method') as string;

    // Gestion de la suppression
    if (method === 'DELETE') {
      // Vérifier que la demande existe
      const existingRequest = await prisma.contactRequest.findUnique({
        where: { id },
        include: {
          formResponses: { select: { id: true } },
          appointment: { select: { id: true } },
        },
      });

      if (!existingRequest) {
        return NextResponse.json(
          { success: false, error: 'Demande de contact non trouvée' },
          { status: 404 }
        );
      }

      // Si la demande a des réponses ou un rendez-vous, ne pas supprimer
      if (existingRequest.formResponses.length > 0 || existingRequest.appointment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Impossible de supprimer cette demande car elle a des réponses ou un rendez-vous associé'
          },
          { status: 400 }
        );
      }

      // Supprimer
      await prisma.contactRequest.delete({
        where: { id },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Demande supprimée avec succès',
        },
        { status: 200 }
      );
    }

    // Gestion de la mise à jour (PATCH via POST)
    const updateData: any = {};
    const firstName = body.get('firstName') as string;
    const lastName = body.get('lastName') as string;
    const email = body.get('email') as string;
    const packageType = body.get('packageType') as string;
    const nights = body.get('nights') as string;
    const message = body.get('message') as string;
    const status = body.get('status') as string;
    const formId = body.get('formId') as string;

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (packageType !== undefined) updateData.packageType = packageType;
    if (nights !== undefined) updateData.nights = parseInt(nights) || 0;
    if (message !== undefined) updateData.message = message;
    if (status !== undefined) updateData.status = status;
    if (formId !== undefined) updateData.formId = formId;

    // Vérifier que la demande existe
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour
    await prisma.contactRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Demande mise à jour avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error processing contact request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /dashboard/contact-requests/[id]
 * Met à jour une demande de contact
 */
export async function PATCH(
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

    const body = await request.json();

    // Vérifier que la demande existe
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.packageType !== undefined) updateData.packageType = body.packageType;
    if (body.nights !== undefined) updateData.nights = parseInt(body.nights) || 0;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.formId !== undefined) updateData.formId = body.formId;

    // Mettre à jour
    await prisma.contactRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Demande mise à jour avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error updating contact request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la mise à jour',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /dashboard/contact-requests/[id]
 * Supprime une demande de contact
 */
export async function DELETE(
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
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id },
      include: {
        formResponses: { select: { id: true } },
        appointment: { select: { id: true } },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Demande de contact non trouvée' },
        { status: 404 }
      );
    }

    // Si la demande a des réponses ou un rendez-vous, ne pas supprimer
    if (existingRequest.formResponses.length > 0 || existingRequest.appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer cette demande car elle a des réponses ou un rendez-vous associé'
        },
        { status: 400 }
      );
    }

    // Supprimer
    await prisma.contactRequest.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Demande supprimée avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting contact request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la suppression',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
