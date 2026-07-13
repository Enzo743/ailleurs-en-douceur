"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './section-card.module.scss';

export default function ContactSettings({ initialState }: { initialState: boolean }) {
    const [isEnabled, setIsEnabled] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Synchroniser l'état avec les props si elles changent (après un refresh)
    useEffect(() => {
        setIsEnabled(initialState);
    }, [initialState]);

    const toggleContactForm = async () => {
        try {
            setError(null);
            
            const response = await fetch('/api/contact-toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || `Erreur ${response.status}`);
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                setIsEnabled(data.newState);
                // Recharger la page pour mettre à jour tous les composants
                router.refresh();
            } else {
                setError(data.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur lors du basculement:', error);
            setError(error instanceof Error ? error.message : 'Erreur de connexion');
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>Formulaire de contact</h3>
                </div>
            </div>
            <div className={styles.cardContent}>
                <p className={styles.cardDescription}>
                    Activez ou désactivez le formulaire de contact pour contrôler si les visiteurs peuvent envoyer des messages.
                </p>
                <button 
                    onClick={toggleContactForm}
                    disabled={isPending}
                    className={styles.actionButton}
                >
                    {isPending ? 'Chargement...' : (isEnabled ? 'Désactiver le formulaire' : 'Activer le formulaire')}
                </button>
                <p className={styles.statusText}>
                    État actuel: <strong>{isEnabled ? 'Activé ✅' : 'Désactivé ❌'}</strong>
                </p>
                {error && <p className={styles.errorText}>{error}</p>}
            </div>
        </div>
    );
}

// Wrapper serveur pour récupérer l'état initial
// Note: Ce composant doit être utilisé dans un composant serveur
interface ContactSettingsWrapperProps {
    initialState: boolean;
}

// Composant serveur qui passe les données au composant client
export function ContactSettingsWrapper({ initialState }: ContactSettingsWrapperProps) {
    return <ContactSettings initialState={initialState} />;
}