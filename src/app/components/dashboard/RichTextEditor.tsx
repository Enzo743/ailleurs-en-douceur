'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { uploadArticleImage } from '@/app/actions/articles';
import styles from './rich-text-editor.module.scss';

type Props = {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
};

export default function RichTextEditor({ value, onChange, disabled = false }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Placeholder.configure({ placeholder: 'Rédigez le contenu de l\'article…' }),
        ],
        content: value,
        immediatelyRender: false,
        editable: !disabled,
        onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [editor, value]);

    useEffect(() => {
        if (editor) editor.setEditable(!disabled);
    }, [editor, disabled]);

    async function handleImageSelect(file: File | undefined) {
        if (!file || !editor) return;

        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadArticleImage(formData);
        if (result.success && result.url) {
            editor.chain().focus().setImage({ src: result.url }).run();
        }
    }

    if (!editor) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.toolbarButton}
                    data-active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled}
                >
                    Gras
                </button>
                <button
                    type="button"
                    className={styles.toolbarButton}
                    data-active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled}
                >
                    Italique
                </button>
                <button
                    type="button"
                    className={styles.toolbarButton}
                    data-active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    disabled={disabled}
                >
                    Souligner
                </button>
                <button
                    type="button"
                    className={styles.toolbarButton}
                    data-active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={disabled}
                >
                    Liste à puces
                </button>
                <button
                    type="button"
                    className={styles.toolbarButton}
                    data-active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={disabled}
                >
                    Liste numérotée
                </button>
                <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled}
                >
                    Image
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(e) => {
                        handleImageSelect(e.target.files?.[0]);
                        e.target.value = '';
                    }}
                />
            </div>
            <div className={`${styles.editor} ${disabled ? styles.editorDisabled : ''}`}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
