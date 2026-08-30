'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { uploadArticleImage } from '@/app/actions/articles';
import styles from './content-row.module.scss';
import FileManager from './FileManager';

type Props = {
    value: string | null;
    onChange: (url: string | null) => void;
    disabled?: boolean;
};

export default function CoverImageUpload({ value, onChange, disabled = false }: Props) {
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [isPending, startTransition] = useTransition();
    const [showFileManager, setShowFileManager] = useState(false);

    // Gérer la sélection d'une image depuis le gestionnaire de fichiers
    function handleSelectFromFileManager(filePath: string) {
        onChange(filePath);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);
    }

    function handleUpload() {
        // Cette fonction n'est plus utilisée directement, mais on la garde au cas où
        // (elle est appelée par le bouton d'upload si on veut le conserver)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            startTransition(async () => {
                const result = await uploadArticleImage(formData);
                if (result.success && result.url) {
                    onChange(result.url);
                    setStatus('saved');
                } else {
                    setErrorMsg(result.error ?? 'Erreur inconnue.');
                    setStatus('error');
                }
                setTimeout(() => setStatus('idle'), 3000);
            });
        };
        fileInput.click();
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
                {status === 'error'  && <span className={styles.statusErr}>✗ {errorMsg}</span>}
            </div>
        </div>
    );
}
