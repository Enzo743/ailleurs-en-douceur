import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

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
    matcher: ['/dashboard/:path*', '/login'],
};