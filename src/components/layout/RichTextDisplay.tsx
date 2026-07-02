"use client";

import { useMemo } from "react";
import styles from "./richtextdisplay.module.scss";

interface RichTextDisplayProps {
  html: string;
  className?: string;
}

/**
 * Affiche du contenu HTML généré par TipTap (ou autre éditeur RichText)
 * Utilise dangerouslySetInnerHTML pour rendre le HTML correctement
 */
export default function RichTextDisplay({ html, className = "" }: RichTextDisplayProps) {
  // Sanitize basic HTML to prevent XSS (simple check for script tags)
  const sanitizedHtml = useMemo(() => {
    if (!html) return "";
    
    // Basic sanitization - remove script and other dangerous tags
    // Note: For production, consider using a proper sanitizer like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+="[^"]*"/g, "");
  }, [html]);

  if (!sanitizedHtml || sanitizedHtml === "<p></p>") {
    return <p className={className}>&nbsp;</p>;
  }

  return (
    <div
      className={`${styles.richText} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
