'use client';

import { useState } from 'react';
import { createPdfDownloadUrl, PdfOptions } from '@/lib/pdf';
import styles from './DownloadPdfButton.module.scss';

interface DownloadPdfButtonProps {
  formName: string;
  targetId: string;
  className?: string;
}

export default function DownloadPdfButton({ 
  formName, 
  targetId, 
  className = '' 
}: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const targetElement = document.getElementById(targetId);
      
      if (!targetElement) {
        throw new Error(`Élément avec l'ID ${targetId} non trouvé`);
      }

      // Sauvegarder les styles originaux
      const originalStyles = {
        position: targetElement.style.position,
        left: targetElement.style.left,
        top: targetElement.style.top,
        width: targetElement.style.width,
        zIndex: targetElement.style.zIndex,
        opacity: targetElement.style.opacity,
        visibility: targetElement.style.visibility,
      };

      // Rendre l'élément visible et positionné correctement pour la capture
      targetElement.style.position = 'relative';
      targetElement.style.left = '0';
      targetElement.style.top = '0';
      targetElement.style.width = '100%';
      targetElement.style.zIndex = '99999';
      targetElement.style.opacity = '1';
      targetElement.style.visibility = 'visible';

      // Forcer le reflow
      document.body.offsetHeight;

      const result = await createPdfDownloadUrl(
        targetElement as HTMLElement,
        `${formName.replace(/\s+/g, '-').toLowerCase()}-formulaire.pdf`,
        {
          title: formName,
          author: 'Ailleurs en Douceur',
          subject: `Formulaire : ${formName}`,
        }
      );

      // Restaurer les styles originaux
      targetElement.style.position = originalStyles.position;
      targetElement.style.left = originalStyles.left;
      targetElement.style.top = originalStyles.top;
      targetElement.style.width = originalStyles.width;
      targetElement.style.zIndex = originalStyles.zIndex;
      targetElement.style.opacity = originalStyles.opacity;
      targetElement.style.visibility = originalStyles.visibility;

      if (result.success && result.pdfUrl) {
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = result.pdfUrl;
        link.download = result.fileName || `${formName.replace(/\s+/g, '-').toLowerCase()}-formulaire.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Libérer l'URL du blob après un court délai
        setTimeout(() => {
          URL.revokeObjectURL(result.pdfUrl!);
        }, 100);
      } else {
        throw new Error(result.error || 'Impossible de générer le PDF');
      }

    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      setError(error.message || 'Une erreur est survenue lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        className={`${styles['download-button']} ${className}`}
      >
        {isGenerating ? (
          <>
            <span className={styles['spinner']}></span>
            Génération...
          </>
        ) : (
          <>
            📄 Télécharger PDF
          </>
        )}
      </button>
      
      {error && (
        <div className={styles['error-message']}>
          {error}
        </div>
      )}
    </>
  );
}
