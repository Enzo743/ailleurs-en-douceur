import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decrypt, SESSION_COOKIE, type SessionPayload } from './session';
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * Compare le mot de passe fourni avec ADMIN_PASSWORD
 * en temps constant pour éviter les timings attacks.
 */
export function verifyPassword(password: string): boolean {
    if (process.env.ADMIN_PASSWORD === undefined) throw new Error("ADMIN_PASSWORD is not defined");

    const adminPassword: string = process.env.ADMIN_PASSWORD;

    if (!adminPassword) throw new Error('ADMIN_PASSWORD environment variable is not set');

    const inputBuffer: Buffer<ArrayBuffer> = Buffer.alloc(256);
    const adminBuffer: Buffer<ArrayBuffer> = Buffer.alloc(256);

    inputBuffer.write(password);
    adminBuffer.write(adminPassword);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('crypto').timingSafeEqual(inputBuffer, adminBuffer);
}

/**
 * DAL — Vérifie la session cryptographiquement.
 * Enveloppé dans cache() pour éviter les appels répétés au sein d'un même render.
 * Redirige vers /login si la session est absente ou invalide.
 */
export const verifySession: () => Promise<SessionPayload> = cache(
    async (): Promise<SessionPayload> => {
        const cookieStore: ReadonlyRequestCookies = await cookies();
        const token: string | undefined = cookieStore.get(SESSION_COOKIE)?.value;

        if (!token) redirect('/login');

        const session: SessionPayload | null = await decrypt(token);

        if (!session || !session.isAuth) redirect('/login');

        return session;
    }
);