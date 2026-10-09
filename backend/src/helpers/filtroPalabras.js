// Filtro de malas palabras para lo que los usuarios escriben en los chats.
// Para agregar o sacar palabras, editá estas listas (en minúscula y sin
// tildes). "boludo" y parecidas quedan afuera a propósito: entre amigos se
// usan todo el tiempo y bloquearlas molestaría más de lo que ayuda.

// Se comparan contra cada palabra del mensaje (también en plural).
const PALABRAS_PROHIBIDAS = [
  "puta", "puto", "putita", "putito", "hdp", "conchudo", "conchuda",
  "forro", "forra", "mierda", "pajero", "pajera", "trolo", "trola", "maricon",
  "mogolico", "mogolica", "retrasado", "retrasada", "sorete", "chupapija",
  "pija", "verga", "pelotudo", "pelotuda", "imbecil", "idiota", "garca",
  "negro de mierda", "matate", "suicidate",
];

// Se buscan como texto seguido en cualquier parte del mensaje.
const FRASES_PROHIBIDAS = ["hijo de puta", "hijodeputa", "te voy a matar", "la concha de tu"];

const REEMPLAZOS_LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s" };

// "PÚÚÚTO", "p.u.t.o" o "put0" terminan todos como "puto".
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$]/g, (c) => REEMPLAZOS_LEET[c])
    .replace(/(?<=\b\w)[.\-_*](?=\w\b)/g, "")
    .replace(/(\w)\1+/g, "$1");
}

const PROHIBIDAS_NORMALIZADAS = new Set(
  PALABRAS_PROHIBIDAS.filter((p) => !p.includes(" ")).map(normalizar)
);
const FRASES_NORMALIZADAS = [
  ...FRASES_PROHIBIDAS,
  ...PALABRAS_PROHIBIDAS.filter((p) => p.includes(" ")),
].map(normalizar);

export function contieneMalasPalabras(texto) {
  if (!texto) return false;
  const limpio = normalizar(texto);

  if (FRASES_NORMALIZADAS.some((frase) => limpio.includes(frase))) return true;

  const palabras = limpio.split(/[^a-zñ]+/).filter(Boolean);
  return palabras.some(
    (palabra) =>
      PROHIBIDAS_NORMALIZADAS.has(palabra) ||
      (palabra.endsWith("s") && PROHIBIDAS_NORMALIZADAS.has(palabra.slice(0, -1))) ||
      (palabra.endsWith("es") && PROHIBIDAS_NORMALIZADAS.has(palabra.slice(0, -2)))
  );
}

export const MENSAJE_MALAS_PALABRAS =
  "Tu mensaje tiene palabras que no están permitidas en FanMeet. Cambialo y probá de nuevo.";
