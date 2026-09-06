import { NextResponse, type NextRequest } from 'next/server';
import { NextURL } from 'next/dist/server/web/next-url';

/**
 * Middleware pour gérer les requêtes d'images uploadées
 * 
 * En production:
 * - Les images uploadées sont stockées dans /var/www/uploads/
 * - Elles sont accessibles via /api/files/uploads/filename
 * - Mais certaines pages peuvent encore référencer /uploads/filename
 * 
 * Ce middleware redirige les requêtes /uploads/* vers /api/files/uploads/*
 * pour que les images uploadées soient toujours accessibles.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rediriger /uploads/* vers /api/files/uploads/* en production uniquement
  // En développement, les images /uploads/ sont accessibles directement depuis public/uploads/
  if (process.env.NODE_ENV === 'production' && pathname.startsWith('/uploads/')) {
    const newPathname = pathname.replace(/^\/uploads\//, '/api/files/uploads/');
    
    // Construire la nouvelle URL
    const newUrl = new NextURL(request.url);
    newUrl.pathname = newPathname;
    
    return NextResponse.redirect(newUrl);
  }
  
  return NextResponse.next();
}

// Configurer le middleware pour s'exécuter sur les requêtes /uploads/*
export const config = {
  matcher: ['/uploads/:path*'],
};