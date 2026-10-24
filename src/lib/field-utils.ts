import { slugify } from './slugify';

/**
 * Valeur possible d'un champ de formulaire dans une réponse
 */
export type FormFieldValue = string | number | boolean | string[] | null;

/**
 * Ensemble des valeurs d'une réponse de formulaire
 */
export type FormValues = Record<string, FormFieldValue>;

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

/**
 * Formate la valeur d'un champ de formulaire pour l'affichage
 * (utilisé par la page de détail d'une demande et le PDF rempli)
 */
export function formatFieldValue(
  value: FormFieldValue | undefined,
  allValues: FormValues = {},
  fieldKey?: string
): string {
  if (value === null || value === undefined) return 'Non renseigné';
  if (Array.isArray(value)) {
    // Pour les tableaux, vérifier si '_OTHER_' est présent et remplacer par la valeur personnalisée
    const formattedArray = value.map((v) => {
      if (v === '_OTHER_' && fieldKey && allValues[`${fieldKey}_other`]) {
        return allValues[`${fieldKey}_other`];
      }
      return String(v);
    });
    return formattedArray.join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';

  // Cas spécial : si la valeur est '_OTHER_', afficher la valeur personnalisée
  if (value === '_OTHER_' && fieldKey && allValues[`${fieldKey}_other`]) {
    return String(allValues[`${fieldKey}_other`]);
  }

  return String(value);
}
