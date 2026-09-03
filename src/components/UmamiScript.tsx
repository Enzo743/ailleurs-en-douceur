'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function UmamiScript() {
  const pathname = usePathname();
  
  // Ne pas charger Umami sur les pages du dashboard
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }
  
  // Charger Umami sur toutes les autres pages
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://analytics.ailleurs-en-douceur.com/script.js';
  
  useEffect(() => {
    if (!websiteId) {
      console.warn('Umami website ID not configured');
      return;
    }
    
    // Créer l'élément script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = scriptUrl;
    script.setAttribute('data-website-id', websiteId);
    
    // Ajouter le script au body
    document.body.appendChild(script);
    
    // Nettoyer au démontage
    return () => {
      document.body.removeChild(script);
    };
  }, [websiteId, scriptUrl]);
  
  return null;
}