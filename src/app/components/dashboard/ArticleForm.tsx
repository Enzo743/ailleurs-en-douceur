'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle, updateArticle, type ArticleWithTags } from '@/app/actions/articles';
import { slugify } from '@/lib/slugify';
import RichTextEditor from './RichTextEditor';
import TagInput from './TagInput';
import CoverImageUpload from './CoverImageUpload';
import styles from './article-form.module.scss';

type Props = {
    article?: ArticleWithTags;
};

export default function ArticleForm({ article }: Props) {
    const router = useRouter();
    const isEditing = Boolean(article);

    const [title, setTitle] = useState(article?.title ?? '');
    const [slug, setSlug] = useState(article?.slug ?? '');
    const [slugManual, setSlugManual] = useState(isEditing);
    const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
    const [content, setContent] = useState(article?.content ?? '');
    const [coverImage, setCoverImage] = useState<string | null>(article?.coverImage ?? null);
    const [tags, setTags] = useState<string[]>(article?.tags.map((t) => t.name) ?? []);
    const [status, setStatus] = useState<'idle' | 'saved' | 'published' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [isPending, startTransition] = useTransition();

    function handleTitleChange(value: string) {
        setTitle(value);
        if (!slugManual) setSlug(slugify(value));
    }

    function handleSlugChange(value: string) {
        setSlugManual(true);
        setSlug(slugify(value));
    }

    function handleSubmit(published: boolean) {
        startTransition(async () => {
            const data = {
                title,
                slug,
                excerpt,
                content,
                coverImage,
                tagNames: tags,
                published,
            };

            const result = isEditing && article
                ? await updateArticle(article.id, data)
                : await createArticle(data);

            if (result.success) {
                setStatus(published ? 'published' : 'saved');
                setTimeout(() => {
                    if (!isEditing && result.id) {
                        router.push(`/dashboard/articles/${result.id}/edit`);
                    } else {
                        setStatus('idle');
                    }
                }, 1500);
            } else {
                setErrorMsg(result.error ?? 'Erreur inconnue.');
                setStatus('error');
                setTimeout(() => setStatus('idle'), 4000);
            }
        });
    }

    return (
        <>
            <a href="/dashboard/articles" className={styles.backLink}>
                ← Retour aux articles
            </a>

            <form
                className={styles.form}
                onSubmit={(e) => e.preventDefault()}
            >
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="title">Titre</label>
                    <input
                        id="title"
                        type="text"
                        className={styles.input}
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        disabled={isPending}
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="slug">Slug (URL)</label>
                    <input
                        id="slug"
                        type="text"
                        className={styles.input}
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        disabled={isPending}
                        required
                    />
                    <p className={styles.slugHint}>
                        Généré automatiquement depuis le titre. Modifiable manuellement.
                    </p>
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="excerpt">Description</label>
                    <textarea
                        id="excerpt"
                        className={styles.textarea}
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        rows={3}
                        disabled={isPending}
                    />
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Image de couverture</span>
                    <CoverImageUpload
                        value={coverImage}
                        onChange={setCoverImage}
                        disabled={isPending}
                    />
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Tags</span>
                    <TagInput value={tags} onChange={setTags} disabled={isPending} />
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Contenu</span>
                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        disabled={isPending}
                    />
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.saveButton}
                        onClick={() => handleSubmit(false)}
                        disabled={isPending}
                    >
                        {isPending ? 'Enregistrement…' : 'Sauvegarder'}
                    </button>
                    <button
                        type="button"
                        className={styles.publishButton}
                        onClick={() => handleSubmit(true)}
                        disabled={isPending}
                    >
                        {isPending ? 'Enregistrement…' : 'Mise en ligne'}
                    </button>
                    {status === 'saved' && (
                        <span className={styles.statusOk}>✓ Brouillon enregistré</span>
                    )}
                    {status === 'published' && (
                        <span className={styles.statusOk}>✓ Article mis en ligne</span>
                    )}
                    {status === 'error' && (
                        <span className={styles.statusErr}>✗ {errorMsg}</span>
                    )}
                </div>
            </form>
        </>
    );
}
