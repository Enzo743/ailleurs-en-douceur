// Générateur PDF côté client pour Next.js
// Utilise html2canvas et jspdf pour capturer des éléments HTML et générer des PDF

'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Options pour la génération PDF
 */
export interface PdfOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  pageSize?: 'A4' | 'A5' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Résultat de la génération PDF
 */
export interface PdfResult {
  success: boolean;
  pdfBlob?: Blob;
  pdfUrl?: string;
  fileName?: string;
  error?: string;
  message?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  title: 'Document',
  author: 'Ailleurs en Douceur',
  subject: '',
  keywords: [],
  creator: 'Ailleurs en Douceur PDF Generator',
  pageSize: 'A4',
  orientation: 'portrait',
};

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 }, // en mm
  A5: { width: 148, height: 210 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
};

// ============================================================================
// Fonctions principales
// ============================================================================

/**
 * Générer un PDF à partir d'un élément HTML et le télécharger
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  fileName?: string,
  options?: Partial<PdfOptions>
): Promise<PdfResult> {
  try {
    const mergedOptions: Required<PdfOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    
    const pageSize = PAGE_SIZES[mergedOptions.pageSize] || PAGE_SIZES.A4;
    const orientation = mergedOptions.orientation || 'portrait';
    
    // Capturer l'élément HTML en canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    // Créer le PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: mergedOptions.pageSize as any,
    });
    
    // Calculer les dimensions
    const imgWidth = pageSize.width;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Ajouter l'image au PDF
    pdf.addImage(canvas, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Définir les métadonnées
    pdf.setProperties({
      title: mergedOptions.title,
      author: mergedOptions.author,
      subject: mergedOptions.subject,
      keywords: mergedOptions.keywords.join(', '),
      creator: mergedOptions.creator,
    });
    
    // Générer le nom de fichier
    const finalFileName = fileName || `document-${mergedOptions.title?.toLowerCase().replace(/\s+/g, '-') || 'export'}-${Date.now()}.pdf`;
    
    // Sauvegarder le PDF
    pdf.save(finalFileName);
    
    return {
      success: true,
      fileName: finalFileName,
      message: 'PDF généré avec succès',
    };
    
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la génération du PDF',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
}

/**
 * Générer un PDF à partir d'un élément HTML et retourner le blob
 */
export async function generatePdfBlob(
  element: HTMLElement,
  fileName?: string,
  options?: Partial<PdfOptions>
): Promise<PdfResult> {
  try {
    const mergedOptions: Required<PdfOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    
    const pageSize = PAGE_SIZES[mergedOptions.pageSize] || PAGE_SIZES.A4;
    const orientation = mergedOptions.orientation || 'portrait';
    
    // Capturer l'élément HTML en canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    // Créer le PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: mergedOptions.pageSize as any,
    });
    
    // Calculer les dimensions
    const imgWidth = pageSize.width;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Ajouter l'image au PDF
    pdf.addImage(canvas, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Définir les métadonnées
    pdf.setProperties({
      title: mergedOptions.title,
      author: mergedOptions.author,
      subject: mergedOptions.subject,
      keywords: mergedOptions.keywords.join(', '),
      creator: mergedOptions.creator,
    });
    
    // Générer le blob
    const pdfBlob = pdf.output('blob');
    const finalFileName = fileName || `document-${mergedOptions.title?.toLowerCase().replace(/\s+/g, '-') || 'export'}-${Date.now()}.pdf`;
    
    return {
      success: true,
      pdfBlob,
      fileName: finalFileName,
      message: 'PDF généré avec succès',
    };
    
  } catch (error: any) {
    console.error('Error generating PDF blob:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la génération du PDF',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
}

/**
 * Générer un PDF à partir d'un élément HTML et retourner une URL de téléchargement
 */
export async function createPdfDownloadUrl(
  element: HTMLElement,
  fileName?: string,
  options?: Partial<PdfOptions>
): Promise<PdfResult> {
  const result = await generatePdfBlob(element, fileName, options);
  
  if (!result.success || !result.pdfBlob) {
    return result;
  }
  
  // Créer un URL de blob
  const url = URL.createObjectURL(result.pdfBlob);
  
  return {
    ...result,
    pdfUrl: url,
  };
}

export default {
  downloadElementAsPdf,
  generatePdfBlob,
  createPdfDownloadUrl,
};
