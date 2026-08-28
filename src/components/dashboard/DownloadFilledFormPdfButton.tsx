'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FormSection, FIELD_TYPE_LABELS } from '@/lib/form-constants';
import { getPackageLabel } from '@/lib/constants';
import pdfStyles from './DownloadPdfButton.module.scss';

interface DownloadFilledFormPdfButtonProps {
  form: any;
  formResponse: any;
  clientName: string;
  className?: string;
}

// Fonction pour formater les valeurs comme dans la page de détail
export const formatValue = (value: any, allValues: Record<string, any> = {}, fieldKey?: string): string => {
  if (value === null || value === undefined) return 'Non renseigné';
  if (Array.isArray(value)) {
    const formattedArray = value.map((v: any) => {
      if (v === '_OTHER_' && fieldKey && allValues[`${fieldKey}_other`]) {
        return allValues[`${fieldKey}_other`];
      }
      return String(v);
    });
    return formattedArray.join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return JSON.stringify(value);
  
  if (value === '_OTHER_' && fieldKey && allValues[`${fieldKey}_other`]) {
    return String(allValues[`${fieldKey}_other`]);
  }
  
  return String(value);
};

// Composant pour rendre un champ avec sa réponse - utilise des styles inline
const renderFilledFormField = (field: any, allValues: Record<string, any>) => {
  const value = allValues[field.key];
  const formattedValue = formatValue(value, allValues, field.key);

  // Styles communs
  const labelStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#4a3f2f',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-lora), Arial, Helvetica, sans-serif'
  };

  const inputStyle = {
    padding: '12px 16px',
    border: '1.5px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '15px',
    fontFamily: 'inherit',
    background: '#faf8f5',
    color: '#333',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const requiredStyle = {
    color: '#d32f2f',
    fontSize: '13px',
  };

  return (
    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>
        {field.label}{field.required && <span style={requiredStyle}> *</span>}
      </label>
      
      {field.type === 'CHECKBOX' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={formattedValue === 'Oui'}
            style={{
              width: '20px',
              height: '20px',
              accentColor: '#4a3f2f',
              border: '1.5px solid #e0e0e0',
              borderRadius: '4px',
              background: '#faf8f5',
            }}
            readOnly
          />
          <span style={{ fontSize: '15px', color: '#333' }}>Oui</span>
        </div>
      ) : field.type === 'SELECT' ? (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '18px', background: '#faf8f5' }}>
          {field.placeholder && (
            <small style={{ fontSize: '14px', color: '#888', fontStyle: 'italic', fontWeight: 'normal' }}>
              {field.placeholder}
            </small>
          )}
          {field.options && field.options.length > 0 ? (
            (field.options as any[]).map((option: any, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="radio"
                  id={`${field.id}-${index}`}
                  name={field.key}
                  value={option}
                  checked={option === formattedValue}
                  style={{
                    accentColor: '#4a3f2f',
                    width: '20px',
                    height: '20px',
                  }}
                  readOnly
                />
                <label htmlFor={`${field.id}-${index}`} style={{ fontSize: '15px', color: '#333', cursor: 'pointer', fontWeight: 'normal' }}>
                  {String(option)}
                </label>
              </div>
            ))
          ) : (
            <div style={inputStyle}>{formattedValue}</div>
          )}
          {field.allowOtherOption && formattedValue === 'Autre' && allValues[`${field.key}_other`] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input
                type="radio"
                id={`${field.id}-other`}
                name={field.key}
                value="_OTHER_"
                checked={true}
                style={{
                  accentColor: '#4a3f2f',
                  width: '20px',
                  height: '20px',
                }}
                readOnly
              />
              <label htmlFor={`${field.id}-other`} style={{ fontSize: '15px', color: '#333', cursor: 'pointer', fontWeight: 'normal' }}>
                Autre : {allValues[`${field.key}_other`]}
              </label>
            </div>
          )}
        </div>
      ) : field.type === 'MULTISELECT' ? (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '18px', background: '#faf8f5' }}>
          {field.placeholder && (
            <small style={{ fontSize: '14px', color: '#888', fontStyle: 'italic', fontWeight: 'normal' }}>
              {field.placeholder}
            </small>
          )}
          {field.options && field.options.length > 0 ? (
            (field.options as any[]).map((option: any, index: number) => {
              const isSelected = Array.isArray(value) ? (value as any[]).includes(option) : value === option;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    id={`${field.id}-${index}`}
                    checked={isSelected}
                    style={{
                      accentColor: '#4a3f2f',
                      width: '20px',
                      height: '20px',
                    }}
                    readOnly
                  />
                  <label htmlFor={`${field.id}-${index}`} style={{ fontSize: '15px', color: '#333', cursor: 'pointer', fontWeight: 'normal' }}>
                    {String(option)}
                  </label>
                </div>
              );
            })
          ) : (
            <div style={inputStyle}>{formattedValue}</div>
          )}
          {field.allowOtherOption && value?.includes('_OTHER_') && allValues[`${field.key}_other`] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                id={`${field.id}-other`}
                checked={true}
                style={{
                  accentColor: '#4a3f2f',
                  width: '20px',
                  height: '20px',
                }}
                readOnly
              />
              <label htmlFor={`${field.id}-other`} style={{ fontSize: '15px', color: '#333', cursor: 'pointer', fontWeight: 'normal' }}>
                Autre : {allValues[`${field.key}_other`]}
              </label>
            </div>
          )}
        </div>
      ) : field.type === 'RANGE_NUMBER' || field.type === 'RANGE_DATE' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <input
            type={field.type === 'RANGE_NUMBER' ? 'number' : 'date'}
            value={allValues[`${field.key}_min`] || ''}
            style={inputStyle}
            readOnly
          />
          <span style={{ color: '#666', fontWeight: 500, fontSize: '15px' }}>à</span>
          <input
            type={field.type === 'RANGE_NUMBER' ? 'number' : 'date'}
            value={allValues[`${field.key}_max`] || ''}
            style={inputStyle}
            readOnly
          />
        </div>
      ) : field.type === 'TEXTAREA' ? (
        <textarea
          value={formattedValue}
          style={{
            ...inputStyle,
            resize: 'vertical' as const,
            minHeight: '100px',
            fontFamily: 'inherit',
          }}
          readOnly
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={formattedValue}
          style={inputStyle}
          readOnly
        />
      )}
    </div>
  );
};

export default function DownloadFilledFormPdfButton({
  form,
  formResponse,
  clientName,
  className = '',
}: DownloadFilledFormPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfContentId] = useState(`pdf-filled-form-${formResponse.id}`);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const targetElement = document.getElementById(pdfContentId);
      
      if (!targetElement) {
        throw new Error(`Élément PDF non trouvé`);
      }

      // Sauvegarder les styles originaux
      const originalStyles = {
        position: targetElement.style.position,
        left: targetElement.style.left,
        top: targetElement.style.top,
        transform: targetElement.style.transform,
        width: targetElement.style.width,
        zIndex: targetElement.style.zIndex,
        opacity: targetElement.style.opacity,
        visibility: targetElement.style.visibility,
        pointerEvents: targetElement.style.pointerEvents,
      };

      // Rendre l'élément visible pour la capture
      targetElement.style.position = 'fixed';
      targetElement.style.left = '50%';
      targetElement.style.top = '50%';
      targetElement.style.transform = 'translate(-50%, -50%)';
      targetElement.style.width = '210mm';
      targetElement.style.zIndex = '99999';
      targetElement.style.opacity = '1';
      targetElement.style.visibility = 'visible';
      targetElement.style.pointerEvents = 'auto';

      // Forcer le reflow
      document.body.offsetHeight;
      await new Promise(resolve => setTimeout(resolve, 100)); // Attendre que le rendu soit prêt

      // Forcer le reflow pour s'assurer que les styles sont appliqués
      document.body.offsetHeight;
      await new Promise(resolve => setTimeout(resolve, 50));

      // Capturer avec html2canvas
      const canvas = await html2canvas(targetElement as HTMLElement, {
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fefaed', // Fond du conteneur
      });

      // Restaurer les styles originaux
      targetElement.style.position = originalStyles.position;
      targetElement.style.left = originalStyles.left;
      targetElement.style.top = originalStyles.top;
      targetElement.style.transform = originalStyles.transform;
      targetElement.style.width = originalStyles.width;
      targetElement.style.zIndex = originalStyles.zIndex;
      targetElement.style.opacity = originalStyles.opacity;
      targetElement.style.visibility = originalStyles.visibility;
      targetElement.style.pointerEvents = originalStyles.pointerEvents;

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'A4',
      });

      // Calculer les dimensions
      const pageSize = { width: 210, height: 297 }; // A4 en mm
      const imgWidth = pageSize.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Vérifier si le contenu dépasse une page
      const maxPages = Math.ceil(imgHeight / pageSize.height);
      
      // Si ça tient sur une page, ajouter directement
      if (maxPages <= 1) {
        pdf.addImage(canvas, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Sinon, il faut diviser en plusieurs pages
        // Calculer la hauteur par page en pixels
        const pageHeightPx = (pageSize.height * canvas.width) / pageSize.width;
        
        // Découper le canvas en plusieurs parties
        for (let page = 0; page < maxPages; page++) {
          const startY = page * pageHeightPx;
          const endY = Math.min((page + 1) * pageHeightPx, canvas.height);
          const pageHeight = endY - startY;
          
          // Créer un nouveau canvas pour cette page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeight;
          const pageCtx = pageCanvas.getContext('2d')!;
          
          // Dessiner la partie correspondante
          pageCtx.drawImage(
            canvas,
            0, startY, canvas.width, pageHeight,
            0, 0, canvas.width, pageHeight
          );
          
          // Ajouter cette page au PDF
          const pageImgHeight = (pageHeight * imgWidth) / canvas.width;
          pdf.addImage(pageCanvas, 'PNG', 0, 0, imgWidth, pageImgHeight);
          
          // Ajouter une nouvelle page si ce n'est pas la dernière
          if (page < maxPages - 1) {
            pdf.addPage();
          }
        }
      }

      // Définir les métadonnées
      pdf.setProperties({
        title: `Formulaire rempli - ${form.name}`,
        author: 'Ailleurs en Douceur',
        subject: `Réponses de ${clientName} - ${form.name}`,
        creator: 'Ailleurs en Douceur PDF Generator',
      });

      // Générer le nom de fichier
      const fileName = `formulaire-rempli-${form.name.replace(/\s+/g, '-').toLowerCase()}-${clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

      // Sauvegarder le PDF
      pdf.save(fileName);

    } catch (error: any) {
      console.error('Error generating filled form PDF:', error);
      setError(error.message || 'Une erreur est survenue lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Contenu PDF caché - utilise les styles du formulaire original mais optimisé pour le PDF
  const pdfContent = (
    <div 
      id={pdfContentId} 
      style={{
        width: '210mm', // Largeur A4 en mm
        backgroundColor: '#fefaed',
        padding: '20px',
        boxSizing: 'border-box',
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: -1,
        // Ne pas définir de hauteur fixe, laisser le contenu déterminer la taille
        display: 'block',
      }}
    >
      {/* En-tête du formulaire */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '22px', 
          fontWeight: '600',
          color: '#4a3f2f',
          margin: '0 0 10px 0',
          fontFamily: 'var(--font-lora), Arial, Helvetica, sans-serif'
        }}>
          {form.name}
        </h1>
        {form.description && (
          <p style={{
            fontSize: '15px',
            color: '#666',
            margin: '0',
            lineHeight: '1.6',
            fontFamily: 'var(--font-lora), Arial, Helvetica, sans-serif'
          }}>
            {form.description}
          </p>
        )}
      </div>

      {/* Contenu du formulaire */}
      <div style={{ width: '100%', display: 'block' }}>
        {form.sections && form.sections.length > 0 ? (
          <>
            {(form.sections as any[]).map((section: any, sectionIndex: number) => (
              <div key={section.id} style={{ marginBottom: '20px' }}>
                {section.description && (
                  <div style={{
                    marginBottom: '25px',
                    padding: '15px',
                    background: '#faf8f5',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4a3f2f',
                    fontFamily: 'var(--font-lora), Arial, Helvetica, sans-serif',
                    pageBreakInside: 'avoid',
                  }}>
                    <p style={{ margin: '0', color: '#555', lineHeight: '1.6', fontSize: '15px' }}>{section.description}</p>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {((form.fields as any[]).filter(f => f.sectionId === section.id) as any[])
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((field: any, index: number, array: any[]) => (
                      <div key={field.id} style={index < array.length - 1 ? { 
                        paddingBottom: '12px', 
                        marginBottom: '12px',
                        borderBottom: '1px dashed #eee' 
                      } : {}}>
                        {renderFilledFormField(field, formResponse.values as Record<string, any>)}
                      </div>
                    ))}
                </div>
                
                {/* Saut de page entre sections (sauf pour la dernière) */}
                {sectionIndex < (form.sections as any[]).length - 1 && (
                  <div style={{ pageBreakAfter: 'always' }} />
                )}
              </div>
            ))}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {(form.fields as any[])
              .sort((a: any, b: any) => a.order - b.order)
              .map((field: any, index: number, array: any[]) => (
                <div key={field.id} style={index < array.length - 1 ? { 
                  paddingBottom: '12px', 
                  marginBottom: '12px',
                  borderBottom: '1px dashed #eee' 
                } : {}}>
                  {renderFilledFormField(field, formResponse.values as Record<string, any>)}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Informations client */}
      <div style={{
        marginTop: '30px',
        padding: '18px',
        background: '#faf8f5',
        borderRadius: '8px',
        borderLeft: '4px solid #4a3f2f',
        fontFamily: 'var(--font-lora), Arial, Helvetica, sans-serif',
        pageBreakInside: 'avoid',
      }}>
        <p style={{ margin: '0', color: '#555', lineHeight: '1.6', fontSize: '15px' }}>
          <strong>Réponses de :</strong> {clientName}
        </p>
        <p style={{ margin: '10px 0 0 0', color: '#555', lineHeight: '1.6', fontSize: '15px' }}>
          <strong>Date :</strong> {new Date(formResponse.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {pdfContent}
      
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        className={`${pdfStyles['download-button']} ${className}`}
      >
        {isGenerating ? (
          <>
            <span className={pdfStyles['spinner']}></span>
            Génération...
          </>
        ) : (
          <>
            📄 Télécharger PDF rempli
          </>
        )}
      </button>
      
      {error && (
        <div className={pdfStyles['error-message']}>
          {error}
        </div>
      )}
    </>
  );
}
