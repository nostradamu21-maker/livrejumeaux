// Identité canonique d'une combinaison d'archétypes : paire triée, pour servir
// de clé de cache stable (identique à combo.py côté pipeline Python).
export function comboId(a1: string, a2: string): string {
  const [a, b] = [a1, a2].sort();
  return `combo-${a}__${b}`;
}

/** Extrait l'accessoire d'un `distinctif` ("le second porte X" → "X"). */
export function accessoire(distinctif: string): string {
  return distinctif
    .replace(/^le second porte\s+/i, "")
    .replace(/^le second\s+/i, "")
    .trim();
}
