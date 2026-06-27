'use client';

import { useState, useTransition } from 'react';
import { updateText } from '@/app/actions/content';
import type { SiteContent } from '@prisma/client';
import styles from './content-row.module.scss';

type Props = { item: SiteContent };

export default function ContentTextRow({ item }: Props) {
    const [value, setValue]   = useState(item.value);
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [isPending, startTransition] = useTransition();

    function handleSave() {
        startTransition(async () => {
            const result = await updateText(item.key, value);
            setStatus(result.success ? 'saved' : 'error');
            setTimeout(() => setStatus('idle'), 2500);
        });
    }

    const isRich = item.type === 'RICHTEXT';

    return (
        <div className={styles.row}>
            <div className={styles.meta}>
                <span className={styles.key}>{item.key}</span>
                <span className={styles.badge} data-type={item.type}>
                    {isRich ? 'Texte formaté' : 'Texte'}
                </span>
            </div>

            {isRich ? (
                <textarea
                    className={styles.textarea}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={4}
                    disabled={isPending}
                />
            ) : (
                <input
                    type="text"
                    className={styles.input}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isPending}
                />
            )}

            <div className={styles.footer}>
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isPending || value === item.value}
                >
                    {isPending ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
                {status === 'saved' && <span className={styles.statusOk}>✓ Sauvegardé</span>}
                {status === 'error'  && <span className={styles.statusErr}>✗ Erreur</span>}
            </div>
        </div>
    );
}