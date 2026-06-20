import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const SESSION_COOKIE = 'session';

export type SessionPayload = {
    role: 'admin';
    isAuth: true;
};

function getSecretKey(): Uint8Array {
    if (process.env.JWT_SECRET === undefined) throw new Error('JWT_SECRET is not defined');

    const secret: string = process.env.JWT_SECRET;

    if (!secret) throw new Error('JWT_SECRET environment variable is not set');

    return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecretKey());
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256'],
        });
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function createSession(): Promise<void> {
    const token: string = await encrypt({ role: 'admin', isAuth: true });
    const cookieStore: ReadonlyRequestCookies = await cookies();

    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
    });
}

export async function deleteSession(): Promise<void> {
    const cookieStore: ReadonlyRequestCookies = await cookies();

    cookieStore.delete(SESSION_COOKIE);
}