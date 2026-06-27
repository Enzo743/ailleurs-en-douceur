'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteArticle } from '@/app/actions/articles';
import styles from './article-form.module.scss';

type Props = {
    id: string;
    title: string;
};

export default function DeleteArticleButton({ id, title }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        if (!confirm(`Supprimer l'article « ${title} » ? Cette action est irréversible.`)) return;

        startTransition(async () => {
            const result = await deleteArticle(id);
            if (result.success) {
                router.push('/dashboard/articles');
                router.refresh();
            } else {
                alert(result.error ?? 'Erreur lors de la suppression.');
            }
        });
    }

    return (
        <button
            type="button"
            className={styles.saveButton}
            style={{ backgroundColor: '#dc2626' }}
            onClick={handleDelete}
            disabled={isPending}
        >
            {isPending ? 'Suppression…' : 'Supprimer'}
        </button>
    );
}
