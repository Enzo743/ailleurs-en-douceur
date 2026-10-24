"use client";

import { useEffect, useRef } from 'react';
import styles from './Banner.module.scss';

export default function Banner({
    text = '',
    color = '#d4a373'
}: {
    text?: string;
    color?: string;
    duration?: 'permanent' | 'temporary';
    endDate?: string | null;
}) {
    const scrollingTextRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Visibilité dérivée des props : le filtrage de l'expiration est
    // géré par le composant serveur parent (BannerWrapper)
    const isVisible = !!text;

    // Animation JavaScript pour le défilement
    useEffect(() => {
        if (!isVisible || !scrollingTextRef.current || text.length <= 50) {
            return;
        }

        const element = scrollingTextRef.current;
        let position = 0;

        const animate = () => {
            position -= 1; // Vitesse de défilement (1px par frame)

            // Si le texte a complètement disparu à gauche, le replacer à droite
            if (position < -element.scrollWidth) {
                position = element.parentElement!.clientWidth; // Réapparaît à droite
            }

            element.style.transform = `translateX(${position}px)`;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Commencer avec le texte à droite de l'écran
        position = element.parentElement!.clientWidth;
        element.style.transform = `translateX(${position}px)`;

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isVisible, text]);

    if (!isVisible || !text) {
        return null;
    }

    return (
        <div 
            className={styles.banner}
            style={
                {
                    backgroundColor: color,
                    '--banner-color': color
                } as React.CSSProperties
            }
        >
            <div className={styles.bannerContent}>
                {text.length > 50 ? (
                    <div 
                        ref={scrollingTextRef}
                        className={styles.scrollingText}
                        style={{ 
                            whiteSpace: 'nowrap', 
                            display: 'inline-block'
                        }}
                    >
                        {text}
                    </div>
                ) : (
                    <div className={styles.staticText}>{text}</div>
                )}
            </div>
        </div>
    );
}