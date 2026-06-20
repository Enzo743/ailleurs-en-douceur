'use client';

import { useActionState } from 'react';
import {ReadonlyURLSearchParams, useSearchParams} from 'next/navigation';
import { login, type LoginState } from '@/app/actions/auth';
import styles from './login.module.scss';

const initialState: LoginState = {};

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(login, initialState);
    const searchParams: ReadonlyURLSearchParams = useSearchParams();
    const callbackUrl: string = searchParams.get('callbackUrl') || '/dashboard';

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>
                    Mot de passe
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                    className={styles.input}
                    placeholder="••••••••"
                />
            </div>

            {state?.error && (
                <p role="alert" className={styles.error}>
                    {state.error}
                </p>
            )}

            <button type="submit" disabled={isPending} className={styles.button}>
                {isPending ? 'Connexion…' : 'Se connecter'}
            </button>
        </form>
);
}