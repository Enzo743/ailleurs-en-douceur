import { NextRequest, NextResponse } from 'next/server';
import { NextURL } from 'next/dist/server/web/next-url';

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Redirection pour les images uploadées en production
    // En production, les images /uploads/* doivent être redirigées vers /api/files/uploads/*
    // car les fichiers sont stockés dans /var/www/uploads/ et non accessibles directement
    if (process.env.NODE_ENV === 'production' && pathname.startsWith('/uploads/')) {
        const newPathname = pathname.replace(/^\/uploads\//, '/api/files/uploads/');
        const newUrl = new NextURL(request.url);
        newUrl.pathname = newPathname;
        return NextResponse.redirect(newUrl);
    }

    // Redirection optimiste si absence de cookie sur /dashboard/*
    if (pathname.startsWith('/dashboard')) {
        const session: string | undefined = request.cookies.get('session')?.value;

        if (!session) {
            const loginUrl = new URL('/login', request.url);

            loginUrl.searchParams.set('callbackUrl', pathname);

            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirige vers /dashboard si déjà connecté et tentative d'accès à /login
    if (pathname === '/login' && request.cookies.get('session'))
        return NextResponse.redirect(new URL('/dashboard', request.url));

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/uploads/:path*'],
};