'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { uploadArticleImage } from '@/app/actions/articles';
import styles from './content-row.module.scss';

type Props = {
    value: string | null;
    onChange: (url: string | null) => void;
    disabled?: boolean;
};

export default function CoverImageUpload({ value, onChange, disabled = false }: Props) {
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [isPending, startTransition] = useTransition();
    const fileRef = useRef<HTMLInputElement>(null);

    function handleUpload() {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            const result = await uploadArticleImage(formData);
            if (result.success && result.url) {
                onChange(result.url);
                setStatus('saved');
                if (fileRef.current) fileRef.current.value = '';
            } else {
                setErrorMsg(result.error ?? 'Erreur inconnue.');
                setStatus('error');
            }
            setTimeout(() => setStatus('idle'), 3000);
        });
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
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    disabled={disabled || isPending}
                />
                <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleUpload}
                    disabled={disabled || isPending}
                >
                    {isPending ? 'Upload…' : value ? 'Remplacer' : 'Ajouter'}
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

            <div className={styles.footer}>
                {status === 'saved' && <span className={styles.statusOk}>✓ Image mise à jour</span>}
                {status === 'error'  && <span className={styles.statusErr}>✗ {errorMsg}</span>}
            </div>
        </div>
    );
}
