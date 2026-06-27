'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import ContentTextRow from './ContentTextRow';
import ContentImageRow from './ContentImageRow';
import RichTextEditor from './RichTextEditor';
import type { SiteContent } from '@prisma/client';
import styles from './section-card.module.scss';
import contentRowStyles from './content-row.module.scss';
import { updateText } from '@/app/actions/content';

type Props = {
    section: string;
    items: SiteContent[];
    previewImage?: string;
};

export default function SectionCard({ section, items, previewImage }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [richTextValues, setRichTextValues] = useState<Record<string, string>>(() => Object.fromEntries(items.filter(i => i.type === 'RICHTEXT').map(i => [i.id, i.value])));
    const [richTextStatuses, setRichTextStatuses] = useState<Record<string, 'idle' | 'saved' | 'error'>>({});
    const [isPending, startTransition] = useTransition();

    function handleRichTextSave(item: SiteContent) {
        startTransition(async () => {
            const result = await updateText(item.key, richTextValues[item.id]);
            setRichTextStatuses((prev) => ({ ...prev, [item.id]: result.success ? 'saved' : 'error' }));
            setTimeout(() => setRichTextStatuses((prev) => ({ ...prev, [item.id]: 'idle' })), 2500);
        });
    }

    const title = section.charAt(0).toUpperCase() + section.slice(1);

    return (
        <>
            <div className={styles.card}>
                {/* ── En-tête cliquable ────────────────────── */}
                <div className={styles.cardHeader} onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
                    <div className={styles.titleRow}>
                        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▼</span>
                        <h2 className={styles.title}>{title}</h2>
                    </div>
                    <div className={styles.titleRow}>
                        {previewImage && (
                            <button
                                className={styles.previewButton}
                                onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
                                title={`Voir le repère visuel pour « ${title} »`}
                            >
                                <span className={styles.previewIcon}>🗺️</span>
                                Repère visuel
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Champs (masqués par défaut) ──────────── */}
                {open && (
                    <div className={styles.rows}>
                        {items.map((item) =>
                            item.type === 'IMAGE' ? (
                                <ContentImageRow key={item.id} item={item} />
                            ) : item.type === 'RICHTEXT' ? (
                                <div key={item.id} className={contentRowStyles.row}>
                                    <div className={contentRowStyles.meta}>
                                        <span className={contentRowStyles.key}>{item.key}</span>
                                        <span className={contentRowStyles.badge} data-type="RICHTEXT">Texte formaté</span>
                                    </div>
                                    <RichTextEditor
                                        value={richTextValues[item.id] ?? item.value}
                                        onChange={(html) =>
                                            setRichTextValues((prev) => ({ ...prev, [item.id]: html }))
                                        }
                                        disabled={isPending}
                                    />
                                    <div className={contentRowStyles.footer}>
                                        <button
                                            className={contentRowStyles.saveButton}
                                            onClick={() => handleRichTextSave(item)}
                                            disabled={isPending || richTextValues[item.id] === item.value}
                                        >
                                            {isPending ? 'Enregistrement…' : 'Sauvegarder'}
                                        </button>
                                        {richTextStatuses[item.id] === 'saved' && <span className={contentRowStyles.statusOk}>✓ Sauvegardé</span>}
                                        {richTextStatuses[item.id] === 'error' && <span className={contentRowStyles.statusErr}>✗ Erreur</span>}
                                    </div>
                                </div>
                            ) : <ContentTextRow key={item.id} item={item} />
                        )}
                    </div>
                )}
            </div>

            {/* ── Modale aperçu ────────────────────────────── */}
            {previewImage && modalOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Repère visuel — ${title}`}
                >
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <p className={styles.modalTitle}>
                                Repère visuel — <strong>{title}</strong>
                            </p>
                            <button
                                className={styles.closeButton}
                                onClick={() => setModalOpen(false)}
                                aria-label="Fermer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.modalImageWrapper}>
                            <Image
                                src={previewImage}
                                alt={`Repère visuel pour la section ${title}`}
                                fill
                                className={styles.modalImage}
                                unoptimized
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}