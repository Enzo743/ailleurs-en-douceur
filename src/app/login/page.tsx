import { Suspense } from 'react';
import LoginForm from './login-form';
import styles from './login.module.scss';

export const metadata = {
    title: 'Connexion — Administration',
};

export default function LoginPage() {
    return (
        <main className={styles.main}>
            <div className={styles.card}>
                <h1 className={styles.title}>Administration</h1>
                <p className={styles.subtitle}>Accès réservé</p>
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}