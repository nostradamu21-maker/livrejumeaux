// Génération des variantes de personnage sur-mesure (gpt-image-1).
// Reprend la formulation de style FIGÉE du projet (scenes.yaml) et le prompt
// de création de personnage depuis photo de livre.py. Clé : OPENAI_API_KEY
// (Vercel). Sans clé → generationActive=false, le site propose un repli.

const cle = process.env.OPENAI_API_KEY?.trim() ?? "";
export const generationActive = cle.startsWith("sk-");

// ⚠️ Formulation de style FIGÉE (identique à scenes.yaml) — ne pas modifier.
const STYLE =
  "illustration aquarelle douce pour album jeunesse, contours légers, palette pastel, éclairage tendre, rendu cohérent d'une page à l'autre";

// La RESSEMBLANCE passe en tête et de façon impérative : le style vient après
// (leçon du test papy — un prompt mené par le style rajeunit et uniformise les
// visages). On ne force pas de « grand sourire » : il refabrique le bas du visage.
const PROMPT_PERSONNAGE =
  "Portrait fidèle : dessine LE MÊME ENFANT que sur la photo de référence, en " +
  "illustration. La RESSEMBLANCE est la priorité absolue, avant toute " +
  "considération de style. Conserve précisément la forme du visage, la coiffure " +
  "exacte (implantation, longueur, mèches, couleur), la couleur des yeux et des " +
  "cheveux, les taches de rousseur ou signes particuliers éventuels, la " +
  "corpulence. Garde l'expression de la photo, sourire naturel. N'invente rien, " +
  "ne transforme pas les traits en visage de dessin animé générique. " +
  "Rendu : " + STYLE + ". Stylisation douce mais les traits distinctifs de " +
  "l'enfant restent parfaitement reconnaissables. " +
  "Character sheet : debout, corps entier bien cadré en entier, face au lecteur, " +
  "fond uni gris clair. Tenue simple et douce inspirée de la photo. " +
  "Pas de texte dans l'image.";

// Qualité de génération des variantes (les fiches finales restent validées
// humainement avant production). "medium" = bon compromis coût/latence.
const QUALITE = process.env.GEN_QUALITE?.trim() || "medium";
export const N_VARIANTES_SUR_MESURE = 3;

/**
 * Génère N variantes de personnage à partir de la photo (+ une fiche du
 * catalogue comme ancre de style). Renvoie les images PNG en Buffer.
 */
export async function genererVariantes(
  photo: ArrayBuffer,
  ancresStyle: ArrayBuffer[],
  complement?: string,
): Promise<Buffer[]> {
  if (!generationActive) throw new Error("OPENAI_API_KEY absente");
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append(
    "prompt",
    complement ? `${PROMPT_PERSONNAGE} ${complement}` : PROMPT_PERSONNAGE,
  );
  form.append("n", String(N_VARIANTES_SUR_MESURE));
  form.append("size", "1024x1536");
  form.append("quality", QUALITE);
  form.append("input_fidelity", "high");
  form.append("image[]", new Blob([photo], { type: "image/jpeg" }), "photo.jpg");
  for (const [i, a] of ancresStyle.entries()) {
    form.append("image[]", new Blob([a], { type: "image/png" }), `style${i}.png`);
  }
  const r = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}` },
    body: form,
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`OpenAI ${r.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await r.json()) as { data: { b64_json: string }[] };
  return data.data.map((d) => Buffer.from(d.b64_json, "base64"));
}
