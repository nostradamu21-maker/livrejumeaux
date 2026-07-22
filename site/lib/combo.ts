// Identité canonique d'une combinaison d'archétypes : paire triée, pour servir
// de clé de cache stable (identique à combo.py côté pipeline Python).
// Pour une paire IDENTIQUE, l'accessoire distinctif choisi par le parent fait
// partie de la clé (chaque accessoire = un livre-combo différent en cache).
export function comboId(a1: string, a2: string, accessoire?: string | null): string {
  const [a, b] = [a1, a2].sort();
  const base = `combo-${a}__${b}`;
  if (a === b && accessoire) return `${base}__acc-${accessoire}`;
  return base;
}

/** Extrait l'accessoire d'un `distinctif` ("le second porte X" → "X"). */
export function accessoire(distinctif: string): string {
  return distinctif
    .replace(/^le second porte\s+/i, "")
    .replace(/^le second\s+/i, "")
    .trim();
}
