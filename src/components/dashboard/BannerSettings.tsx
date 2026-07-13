"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './section-card.module.scss';

export default function BannerSettings({ initialState }: {
    initialState: {
        isEnabled: boolean;
        text: string;
        color: string;
        duration: 'permanent' | 'temporary';
        endDate?: string | null;
    }
}) {
    const [isEnabled, setIsEnabled] = useState(initialState.isEnabled);
    const [text, setText] = useState(initialState.text);
    const [color, setColor] = useState(initialState.color || '#d4a373');
    const [duration, setDuration] = useState<"permanent" | "temporary">(initialState.duration);
    const [endDate, setEndDate] = useState<string | null>(initialState.endDate || '');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    // Synchroniser l'état avec les props si elles changent (après un refresh)
    useEffect(() => {
        setIsEnabled(initialState.isEnabled);
        setText(initialState.text);
        setColor(initialState.color);
        setDuration(initialState.duration);
        setEndDate(initialState.endDate || '');
    }, [initialState]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            setSuccess(null);
            
            const response = await fetch('/api/banner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isEnabled,
                    text,
                    color,
                    duration,
                    endDate: duration === 'temporary' ? endDate : null
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || `Erreur ${response.status}`);
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                setSuccess('Bandeau mis à jour avec succès !');
                // Recharger la page pour mettre à jour tous les composants
                router.refresh();
            } else {
                setError(data.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du bandeau:', error);
            setError(error instanceof Error ? error.message : 'Erreur de connexion');
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>Bandeau défilant</h3>
                </div>
            </div>
            <div className={styles.cardContent}>
                <p className={styles.cardDescription}>
                    Configurez un bandeau défilant en haut du site pour afficher des messages importants à vos visiteurs.
                </p>
                
                <form onSubmit={handleSubmit} className={styles.bannerForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="bannerEnabled" className={styles.formLabel}>
                            <input
                                id="bannerEnabled"
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                                className={styles.checkbox}
                            />
                            Activer le bandeau
                        </label>
                    </div>
                    
                    {isEnabled && (
                        <>
                            <div className={styles.formGroup}>
                                <label htmlFor="bannerText" className={styles.formLabel}>
                                    Texte du bandeau
                                </label>
                                <textarea
                                    id="bannerText"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className={styles.textarea}
                                    rows={3}
                                    required
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Couleur du bandeau</label>
                                <div className={styles.colorOptions}>
                                    {[
                                        { name: 'Principal', value: '#4F46E5' },
                                        { name: 'Caramel', value: '#d4a373' },
                                        { name: 'Sauge', value: '#b2ac88' },
                                        { name: 'Brun', value: '#4a3f2f' },
                                        { name: 'Rouge', value: '#DC2626' },
                                        { name: 'Vert', value: '#10B981' },
                                        { name: 'Bleu', value: '#3B82F6' },
                                        { name: 'Orange', value: '#F59E0B' }
                                    ].map((colorOption) => (
                                        <button
                                            key={colorOption.value}
                                            type="button"
                                            className={`${styles.colorButton} ${color === colorOption.value ? styles.colorButtonActive : ''}`}
                                            style={{ backgroundColor: colorOption.value }}
                                            onClick={() => setColor(colorOption.value)}
                                            aria-label={`Couleur ${colorOption.name}`}
                                        >
                                            {color === colorOption.value && <span className={styles.colorCheck}>✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className={styles.colorInfo}>
                                    <span>Couleur sélectionnée: </span>
                                    <strong style={{ color: color }}>{color}</strong>
                                </div>
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Durée d'affichage</label>
                                <div className={styles.radioGroup}>
                                    <label>
                                        <input
                                            type="radio"
                                            name="duration"
                                            value="permanent"
                                            checked={duration === 'permanent'}
                                            onChange={() => setDuration('permanent')}
                                        />
                                        Permanent (jusqu'à désactivation manuelle)
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="duration"
                                            value="temporary"
                                            checked={duration === 'temporary'}
                                            onChange={() => setDuration('temporary')}
                                        />
                                        Temporaire (jusqu'à une date spécifique)
                                    </label>
                                </div>
                            </div>
                            
                            {duration === 'temporary' && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="endDate" className={styles.formLabel}>
                                        Date de fin
                                    </label>
                                    <input
                                        id="endDate"
                                        type="datetime-local"
                                        value={endDate || ''}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className={styles.input}
                                        required
                                    />
                                </div>
                            )}
                        </>
                    )}
                    
                    <button
                        type="submit"
                        disabled={isPending}
                        className={styles.actionButton}
                    >
                        {isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                    </button>
                    
                    {error && <p className={styles.errorText}>{error}</p>}
                    {success && <p className={styles.successText}>{success}</p>}
                </form>
            </div>
        </div>
    );
}

// Wrapper serveur pour récupérer l'état initial
interface BannerSettingsWrapperProps {
    initialState: {
        isEnabled: boolean;
        text: string;
        color: string;
        duration: 'permanent' | 'temporary';
        endDate?: string | null;
    };
}

// Composant serveur qui passe les données au composant client
export function BannerSettingsWrapper({ initialState }: BannerSettingsWrapperProps) {
    return <BannerSettings initialState={initialState} />;
}