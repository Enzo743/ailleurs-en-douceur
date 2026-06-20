'use server';

import { redirect } from 'next/navigation';
import { verifyPassword } from '@/lib/auth';
import { createSession, deleteSession } from '@/lib/session';

export type LoginState = {
    error?: string;
};

/**
 * Action de connexion — compatible useActionState
 */
export async function login(
    prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const password: File | string | null = formData.get('password');

    if (typeof password !== 'string' || password.length === 0) return { error: 'Le mot de passe est requis.' };

    let isValid: boolean;

    try {
        isValid = verifyPassword(password);
    } catch {
        return { error: 'Erreur de configuration du serveur.' };
    }

    if (!isValid) return { error: 'Mot de passe incorrect.' };

    await createSession();

    redirect('/dashboard');
}

/**
 * Action de déconnexion
 */
export async function logout(): Promise<void> {
    await deleteSession();

    redirect('/login');
}