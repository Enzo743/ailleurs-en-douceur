'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { getAllTags } from '@/app/actions/articles';
import type { Tag } from '@prisma/client';
import styles from './tag-input.module.scss';

type Props = {
    value: string[];
    onChange: (tags: string[]) => void;
    disabled?: boolean;
};

export default function TagInput({ value, onChange, disabled = false }: Props) {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);

    useEffect(() => {
        if (disabled) return;

        getAllTags().then(setSuggestions).catch(console.error);
    }, [disabled]);

    function addTag(name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
        onChange([...value, trimmed]);
        setInput('');
    }

    function removeTag(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1);
        }
    }

    const filteredSuggestions = suggestions.filter(
        (s) =>
            !value.some((t) => t.toLowerCase() === s.name.toLowerCase()) &&
            (!input || s.name.toLowerCase().includes(input.toLowerCase()))
    );

    return (
        <div className={styles.wrapper}>
            <div className={styles.inputRow}>
                {value.map((tag, i) => (
                    <span key={`${tag}-${i}`} className={styles.chip}>
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                className={styles.chipRemove}
                                onClick={() => removeTag(i)}
                                aria-label={`Retirer ${tag}`}
                            >
                                ×
                            </button>
                        )}
                    </span>
                ))}
                <input
                    type="text"
                    className={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => addTag(input)}
                    placeholder={value.length === 0 ? 'Ajouter un tag…' : ''}
                    disabled={disabled}
                />
            </div>

            {filteredSuggestions.length > 0 && !disabled && (
                <div className={styles.suggestions}>
                    {filteredSuggestions.slice(0, 8).map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            className={styles.suggestion}
                            onClick={() => addTag(tag.name)}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}

            <p className={styles.hint}>
                Appuyez sur Entrée pour ajouter. Les tags serviront à la section « À lire aussi ».
            </p>
        </div>
    );
}
