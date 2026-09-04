import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Dossier pour les uploads - production: /var/www/uploads, développement: public/uploads
const UPLOADS_PATH = process.env.NODE_ENV === 'production'
  ? '/var/www/uploads'
  : path.resolve(process.cwd(), 'public/uploads');

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    // Attendre la résolution de params
    const resolvedParams = await params;
    // Reconstruire le chemin du fichier
    const filePath = path.join(...resolvedParams.path);
    
    // Vérifier que le chemin ne contient pas de séquences dangereuses
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json(
        { success: false, error: 'Chemin non valide' },
        { status: 400 }
      );
    }

    // Chemin absolu du fichier
    const absolutePath = path.join(UPLOADS_PATH, filePath);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que c'est un fichier (pas un dossier)
    if (!fs.statSync(absolutePath).isFile()) {
      return NextResponse.json(
        { success: false, error: 'Le chemin spécifié n\'est pas un fichier' },
        { status: 400 }
      );
    }

    // Lire le fichier et le retourner
    const fileBuffer = fs.readFileSync(absolutePath);
    
    // Déterminer le Content-Type en fonction de l'extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du service du fichier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
