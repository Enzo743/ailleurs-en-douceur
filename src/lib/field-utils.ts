import { slugify } from './slugify';

/**
 * Génère une clé unique pour un champ de formulaire
 * Basée sur le label, avec un suffixe numérique si nécessaire pour éviter les doublons
 */
export function generateFieldKey(label: string, existingKeys: string[] = []): string {
  // Générer la base de la clé à partir du label
  let key = slugify(label);
  
  // Si la clé est vide, utiliser un nom par défaut
  if (!key) {
    key = 'champ';
  }
  
  // Vérifier si la clé existe déjà et ajouter un suffixe si nécessaire
  let finalKey = key;
  let counter = 1;
  
  while (existingKeys.includes(finalKey)) {
    finalKey = `${key}-${counter}`;
    counter++;
  }
  
  return finalKey;
}
