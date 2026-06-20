'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { uploadImage } from '@/app/actions/content';
import type { SiteContent } from '@prisma/client';
import styles from './content-row.module.scss';

type Props = { item: SiteContent };

export default function ContentImageRow({ item }: Props) {
    const [currentUrl, setCurrentUrl] = useState(item.value);
    const [status, setStatus]         = useState<'idle' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg]     = useState('');
    const [isPending, startTransition] = useTransition();
    const fileRef = useRef<HTMLInputElement>(null);

    function handleUpload() {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            const result = await uploadImage(item.key, formData);
            if (result.success && result.url) {
                setCurrentUrl(result.url);
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
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    disabled={isPending}
                />
                <button
                    className={styles.saveButton}
                    onClick={handleUpload}
                    disabled={isPending}
                >
                    {isPending ? 'Upload…' : 'Remplacer'}
                </button>
            </div>

            <div className={styles.footer}>
                {status === 'saved' && <span className={styles.statusOk}>✓ Image mise à jour</span>}
                {status === 'error'  && <span className={styles.statusErr}>✗ {errorMsg}</span>}
            </div>
        </div>
    );
}