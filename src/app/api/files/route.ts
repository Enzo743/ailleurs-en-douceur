import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// Chemin racine autorisé
const ROOT_PATH = path.resolve(process.cwd(), 'public');
// Dossier pour les uploads
const UPLOADS_PATH = path.resolve(process.cwd(), 'public/uploads');

export async function GET(request: Request) {
  try {
    // Vérification de la session
    await verifySession();

    const { searchParams } = new URL(request.url);
    let dirPath = searchParams.get('path') || '/public';

    // Normaliser le chemin et s'assurer qu'il est relatif à /public
    let normalizedPath = path.normalize(dirPath);
    
    // Si le chemin commence par /public, on le conserve tel quel
    // Sinon, on le place sous /public
    if (!normalizedPath.startsWith('/public')) {
      normalizedPath = path.join('/public', normalizedPath);
    }

    // Convertir en chemin absolu pour fs
    const absolutePath = path.join(process.cwd(), normalizedPath);

    // Vérification de sécurité : s'assurer que le chemin est bien dans /public
    if (!absolutePath.startsWith(ROOT_PATH)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé : chemin en dehors de /public' },
        { status: 403 }
      );
    }

    // Vérifier que le chemin existe et est un dossier
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      );
    }

    if (!fs.statSync(absolutePath).isDirectory()) {
      return NextResponse.json(
        { success: false, error: 'Le chemin spécifié n\'est pas un dossier' },
        { status: 400 }
      );
    }

    // Lister les fichiers/dossiers
    const items = fs.readdirSync(absolutePath, { withFileTypes: true });
    
    const files = items
      .map((item) => {
        const itemPath = path.join(absolutePath, item.name);
        // Retourner un chemin relatif depuis /public (ex: /uploads/image.jpg)
        const relativePath = normalizedPath === '/public'
          ? `/${item.name}`
          : `${normalizedPath.substring('/public'.length)}/${item.name}`;
        return {
          name: item.name,
          path: relativePath,
          isDirectory: item.isDirectory(),
        };
      })
      .filter((item) => {
        // Masquer les fichiers/dossiers cachés (ex: .DS_Store, .git, etc.)
        return !item.name.startsWith('.');
      })
      .sort((a, b) => {
        // Les dossiers d'abord, puis les fichiers (par ordre alphabétique)
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({ success: true, files });

  } catch (error: any) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la lecture des fichiers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Upload un fichier dans /public/uploads/
 */
export async function POST(request: Request) {
  try {
    // Vérification de la session
    await verifySession();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier que c'est une image (optionnel, mais recommandé)
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non autorisé. Seules les images sont acceptées.' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 5Mo)
    const MAX_SIZE = 5 * 1024 * 1024; // 5Mo
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Fichier trop volumineux (max 5Mo)' },
        { status: 400 }
      );
    }

    // Créer le dossier /public/uploads s'il n'existe pas
    if (!fs.existsSync(UPLOADS_PATH)) {
      fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    }

    // Générer un nom de fichier unique (timestamp + nom original)
    const timestamp = Date.now();
    const ext = path.extname(file.name).toLowerCase();
    const filename = `${timestamp}-${file.name.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-')}${ext}`;
    const filePath = path.join(UPLOADS_PATH, filename);

    // Convertir le File en Buffer et sauvegarder
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Retourner le chemin relatif pour l'utiliser dans le frontend (avec / au début)
    const relativePath = `/uploads/${filename}`;

    return NextResponse.json(
      {
        success: true,
        message: 'Fichier uploadé avec succès',
        filePath: relativePath,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'upload du fichier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files
 * Supprime un fichier dans /public/uploads/ (uniquement si non utilisé dans le site)
 */
export async function DELETE(request: Request) {
  try {
    // Vérification de la session
    await verifySession();

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Chemin du fichier requis' },
        { status: 400 }
      );
    }

    // Vérifier que le fichier est dans /public/uploads/
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith('/uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers dans /uploads/ peuvent être supprimés' },
        { status: 403 }
      );
    }

    // Chemin absolu du fichier
    const absolutePath = path.join(process.cwd(), 'public', normalizedPath);

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

    // Vérifier que le fichier n'est pas utilisé dans le site
    const { isUsed, usages } = await checkIfFileIsUsed(normalizedPath);
    if (isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ce fichier est utilisé dans le site et ne peut pas être supprimé',
          usages: usages,
        },
        { status: 400 }
      );
    }

    // Supprimer le fichier
    fs.unlinkSync(absolutePath);

    return NextResponse.json(
      {
        success: true,
        message: 'Fichier supprimé avec succès',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression du fichier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Vérifie si un fichier est utilisé dans le site (dans la base de données)
 * Retourne { isUsed: boolean, usages: string[] }
 */
async function checkIfFileIsUsed(filePath: string): Promise<{ isUsed: boolean; usages: string[] }> {
  const { prisma } = await import('@/lib/prisma');
  const usages: string[] = [];

  try {
    // Vérifier dans SiteContent (pour les champs IMAGE et RICHTEXT)
    const siteContents = await prisma.siteContent.findMany({
      where: {
        OR: [
          { value: { contains: filePath } },
          { value: { contains: filePath.substring(1) } }, // Sans le / au début
        ],
      },
    });

    siteContents.forEach((content) => {
      usages.push(`Contenu du site (clé: ${content.key})`);
    });

    // Vérifier dans CustomForm (pour les successMessage ou autres champs)
    const customForms = await prisma.customForm.findMany({
      where: {
        OR: [
          { successMessage: { contains: filePath } },
          { successMessage: { contains: filePath.substring(1) } },
          { description: { contains: filePath } },
          { description: { contains: filePath.substring(1) } },
        ],
      },
    });

    customForms.forEach((form) => {
      usages.push(`Formulaire "${form.name}" (message de confirmation ou description)`);
    });

    // Vérifier dans FormField (pour les champs de formulaire)
    const formFields = await prisma.formField.findMany({
      where: {
        OR: [
          { defaultValue: { contains: filePath } },
          { defaultValue: { contains: filePath.substring(1) } },
          { placeholder: { contains: filePath } },
          { placeholder: { contains: filePath.substring(1) } },
        ],
      },
      include: {
        form: {
          select: { name: true },
        },
      },
    });

    formFields.forEach((field) => {
      usages.push(`Champ "${field.label}" du formulaire "${field.form?.name || 'inconnu'}"`);
    });

    // Vérifier dans Article (si la table existe)
    try {
      const articles = await prisma.article.findMany({
        where: {
          OR: [
            { content: { contains: filePath } },
            { content: { contains: filePath.substring(1) } },
            { coverImage: { contains: filePath } },
            { coverImage: { contains: filePath.substring(1) } },
          ],
        },
      });

      articles.forEach((article) => {
        usages.push(`Article "${article.title}" (contenu ou image de couverture)`);
      });
    } catch (e) {
      // La table Article n'existe peut-être pas
    }

    return {
      isUsed: usages.length > 0,
      usages: usages,
    };

  } catch (error) {
    console.error('Error checking if file is used:', error);
    // En cas d'erreur, on considère que le fichier est utilisé (pour éviter les suppressions accidentelles)
    return {
      isUsed: true,
      usages: ['Erreur lors de la vérification des usages'],
    };
  }
}
