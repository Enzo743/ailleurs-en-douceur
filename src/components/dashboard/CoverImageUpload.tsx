'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';

import styles from './content-row.module.scss';
import FileManager from './FileManager';

type Props = {
    value: string | null;
    onChange: (url: string | null) => void;
    disabled?: boolean;
};

export default function CoverImageUpload({ value, onChange, disabled = false }: Props) {
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const [isPending] = useTransition();
    const [showFileManager, setShowFileManager] = useState(false);

    // Gérer la sélection d'une image depuis le gestionnaire de fichiers
    function handleSelectFromFileManager(filePath: string) {
        onChange(filePath);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);
    }

    return (
        <div className={styles.row}>
            <div className={styles.imagePreview}>
                {value ? (
                    <Image
                        src={value}
                        alt="Image de couverture"
                        fill
                        className={styles.previewImg}
                        unoptimized
                    />
                ) : (
                    <span className={styles.noImage}>Aucune image de couverture</span>
                )}
            </div>

            {value && (
                <p className={styles.currentPath}>{value}</p>
            )}

            <div className={styles.uploadRow}>
                <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => setShowFileManager(true)}
                    disabled={disabled || isPending}
                >
                    {value ? 'Remplacer l\'image' : 'Sélectionner une image'}
                </button>
                {value && (
                    <button
                        type="button"
                        className={styles.saveButton}
                        style={{ backgroundColor: '#6b7280' }}
                        onClick={() => onChange(null)}
                        disabled={disabled || isPending}
                    >
                        Supprimer
                    </button>
                )}
            </div>
            
            {/* Gestionnaire de fichiers */}
            {showFileManager && (
                <FileManager
                    onSelect={handleSelectFromFileManager}
                    onClose={() => setShowFileManager(false)}
                />
            )}

            <div className={styles.footer}>
                {status === 'saved' && <span className={styles.statusOk}>✓ Image mise à jour</span>}
            </div>
        </div>
    );
}
