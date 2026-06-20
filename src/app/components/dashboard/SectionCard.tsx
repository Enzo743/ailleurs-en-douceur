'use client';

import { useState } from 'react';
import Image from 'next/image';
import ContentTextRow from './ContentTextRow';
import ContentImageRow from './ContentImageRow';
import type { SiteContent } from '@prisma/client';
import styles from './section-card.module.scss';

type Props = {
    section: string;
    items: SiteContent[];
    previewImage?: string;
};

export default function SectionCard({ section, items, previewImage }: Props) {
    const [modalOpen, setModalOpen] = useState(false);

    const title = section.charAt(0).toUpperCase() + section.slice(1);

    return (
        <>
            <div className={styles.card}>
                {/* ── En-tête ──────────────────────────────── */}
                <div className={styles.cardHeader}>
                    <div className={styles.titleRow}>
                        <span className={styles.dot} />
                        <h2 className={styles.title}>{title}</h2>
                    </div>

                    {previewImage && (
                        <button
                            className={styles.previewButton}
                            onClick={() => setModalOpen(true)}
                            title={`Voir le repère visuel pour « ${title} »`}
                        >
                            <span className={styles.previewIcon}>🗺️</span>
                            Repère visuel
                        </button>
                    )}
                </div>

                {/* ── Champs ───────────────────────────────── */}
                <div className={styles.rows}>
                    {items.map((item) =>
                        item.type === 'IMAGE' ? (
                            <ContentImageRow key={item.id} item={item} />
                        ) : (
                            <ContentTextRow key={item.id} item={item} />
                        )
                    )}
                </div>
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