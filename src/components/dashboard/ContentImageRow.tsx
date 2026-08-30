'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { updateText } from '@/app/actions/content';
import type { SiteContent } from '@prisma/client';
import styles from './content-row.module.scss';
import FileManager from './FileManager';

type Props = { item: SiteContent };

export default function ContentImageRow({ item }: Props) {
    const [currentUrl, setCurrentUrl] = useState(item.value);
    const [status, setStatus]         = useState<'idle' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg]     = useState('');
    const [isPending, startTransition] = useTransition();
    const [showFileManager, setShowFileManager] = useState(false);

    // Gérer la sélection d'une image depuis le gestionnaire de fichiers
    function handleSelectFromFileManager(filePath: string) {
        // Mettre à jour l'URL avec le chemin du fichier sélectionné
        setCurrentUrl(filePath);
        setStatus('saved');
        
        // Sauvegarder immédiatement le changement
        startTransition(async () => {
            const result = await updateText(item.key, filePath);
            if (!result.success) {
                setErrorMsg(result.error ?? 'Erreur lors de la sauvegarde.');
                setStatus('error');
                setTimeout(() => setStatus('idle'), 3000);
            }
        });
        
        setTimeout(() => setStatus('idle'), 3000);
    }

    return (
        <div className={styles.row}>
            <div className={styles.meta}>
                <span className={styles.key}>{item.key}</span>
                <span className={styles.badge} data-type="IMAGE">Image</span>
            </div>

            <div className={styles.imagePreview}>
                {currentUrl ? (
                    <Image
                        src={currentUrl}
                        alt={item.key}
                        fill
                        className={styles.previewImg}
                        unoptimized
                    />
                ) : (
                    <span className={styles.noImage}>Aucune image</span>
                )}
            </div>

            <p className={styles.currentPath}>{currentUrl}</p>

            <div className={styles.uploadRow}>
                <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => setShowFileManager(true)}
                    disabled={isPending}
                >
                    Sélectionner une image
                </button>
            </div>
            
            {/* Gestionnaire de fichiers (permet de sélectionner OU uploader) */}
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