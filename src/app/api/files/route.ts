import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// Chemin racine autorisé
const ROOT_PATH = path.resolve(process.cwd(), 'public');
// Dossier pour les uploads - production: /var/www/uploads, développement: public/uploads
const UPLOADS_PATH = process.env.NODE_ENV === 'production'
  ? '/var/www/uploads'
  : path.resolve(process.cwd(), 'public/uploads');

// Chemin racine pour la vérification de sécurité (en production, on autorise aussi /var/www)
const ALLOWED_ROOT_PATHS = process.env.NODE_ENV === 'production'
  ? [ROOT_PATH, '/var/www']
  : [ROOT_PATH];

export async function GET(request: Request) {
  try {
    // Vérification de la session
    await verifySession();

    const { searchParams } = new URL(request.url);
    let dirPath = searchParams.get('path') || '/public';

    // Normaliser le chemin et s'assurer qu'il est relatif à /public
    let normalizedPath = path.normalize(dirPath);
    
    // Gérer /uploads comme alias de /public/uploads
    if (normalizedPath === '/uploads') {
      normalizedPath = '/public/uploads';
    }
    
    // Si le chemin commence par /public, on le conserve tel quel
    // Sinon, on le place sous /public
    if (!normalizedPath.startsWith('/public')) {
      normalizedPath = path.join('/public', normalizedPath);
    }

    // Convertir en chemin absolu pour fs
    const absolutePath = path.join(ROOT_PATH, normalizedPath.substring('/public'.length));

    // Vérification de sécurité : s'assurer que le chemin est bien dans un chemin autorisé
    const isPathAllowed = ALLOWED_ROOT_PATHS.some(root => absolutePath.startsWith(root));
    if (!isPathAllowed) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé : chemin en dehors des répertoires autorisés' },
        { status: 403 }
      );
    }

    // En production, si on demande /public/uploads, on redirige vers /var/www/uploads
    if (normalizedPath === '/public/uploads') {
      const actualUploadsPath = process.env.NODE_ENV === 'production'
        ? '/var/www/uploads'
        : path.join(ROOT_PATH, 'uploads');
      
      // Vérifier que le chemin existe et est un dossier
      if (!fs.existsSync(actualUploadsPath)) {
        return NextResponse.json(
          { success: false, error: 'Dossier non trouvé' },
          { status: 404 }
        );
      }

      if (!fs.statSync(actualUploadsPath).isDirectory()) {
        return NextResponse.json(
          { success: false, error: 'Le chemin spécifié n\'est pas un dossier' },
          { status: 400 }
        );
      }

      // Lister les fichiers depuis le vrai dossier uploads
      const items = fs.readdirSync(actualUploadsPath, { withFileTypes: true });
      
      // En production, utiliser /api/files/uploads/, en développement /uploads/
      const basePath = process.env.NODE_ENV === 'production' ? '/api/files/uploads' : '/uploads';
      
      const files = items
        .filter((item) => !item.name.startsWith('.'))
        .map((item) => ({
          name: item.name,
          path: `${basePath}/${item.name}`,
          isDirectory: item.isDirectory(),
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      
      return NextResponse.json({ success: true, files });
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
        let relativePath = normalizedPath === '/public'
          ? `/${item.name}`
          : `${normalizedPath.substring('/public'.length)}/${item.name}`;
        
        // Si le chemin contient /uploads/ et qu'on est en production, utiliser /api/files/uploads/
        if (process.env.NODE_ENV === 'production' && relativePath.includes('/uploads/')) {
          relativePath = relativePath.replace('/uploads/', '/api/files/uploads/');
        }
        
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

    // Créer le dossier d'uploads s'il n'existe pas
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

    // Retourner le chemin relatif pour l'utiliser dans le frontend
    // En développement: /uploads/filename (servi directement par Next.js)
    // En production: /api/files/uploads/filename (servi via notre route API)
    const relativePath = process.env.NODE_ENV === 'production'
      ? `/api/files/uploads/${filename}`
      : `/uploads/${filename}`;

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

    // Vérifier que le fichier est dans /uploads/ ou /api/files/uploads/
    let normalizedPath = path.normalize(filePath);
    
    // Gérer les chemins API en production
    if (normalizedPath.startsWith('/api/files/uploads/')) {
      normalizedPath = normalizedPath.replace('/api/files/uploads/', '/uploads/');
    }
    
    if (!normalizedPath.startsWith('/uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers dans /uploads/ peuvent être supprimés' },
        { status: 403 }
      );
    }

    // Chemin absolu du fichier - en production on cherche dans /var/www/uploads, en dev dans public/uploads
    const filename = path.basename(normalizedPath);
    let absolutePath = process.env.NODE_ENV === 'production'
      ? path.join('/var/www/uploads', filename)
      : path.join(ROOT_PATH, normalizedPath.replace('/uploads/', 'uploads/'));

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
  
  // Normaliser le chemin pour la recherche dans la base de données
  // En production, les chemins peuvent être /api/files/uploads/filename ou /uploads/filename
  let searchPath = filePath;
  if (searchPath.startsWith('/api/files/uploads/')) {
    searchPath = searchPath.replace('/api/files/uploads/', '/uploads/');
  }

  try {
    // Vérifier dans SiteContent (pour les champs IMAGE et RICHTEXT)
    const siteContents = await prisma.siteContent.findMany({
      where: {
        OR: [
          { value: { contains: searchPath } },
          { value: { contains: searchPath.substring(1) } }, // Sans le / au début
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
          { successMessage: { contains: searchPath } },
          { successMessage: { contains: searchPath.substring(1) } },
          { description: { contains: searchPath } },
          { description: { contains: searchPath.substring(1) } },
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
          { defaultValue: { contains: searchPath } },
          { defaultValue: { contains: searchPath.substring(1) } },
          { placeholder: { contains: searchPath } },
          { placeholder: { contains: searchPath.substring(1) } },
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
            { content: { contains: searchPath } },
            { content: { contains: searchPath.substring(1) } },
            { coverImage: { contains: searchPath } },
            { coverImage: { contains: searchPath.substring(1) } },
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
