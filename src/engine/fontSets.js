// Tipografía y colores de AJT. Las plantillas no nombran fuentes: cada capa
// dice "título" o "cuerpo" (y ancho/peso/cursiva si hace falta) y es este
// juego el que decide qué familia real se dibuja:
//  - Helvetica Neue Roman (texto) y Bold (negrita del cuerpo, también el **así**)
//  - Thunder Extra Bold (títulos)
//  - Helvetica Neue Black Condensed (rótulo alternativo)
//  - PP Playground Medium (títulos caligráficos)
// Cursivas reales, salvo PP Playground (oblicua de 12° generada). Hay pocos
// cortes, así que "ancho" y "peso" se resuelven por la propia regla de CSS
// (peso más cercano disponible de la familia).

const isNormalWidth = (widthKey) => widthKey === 'normal' || widthKey === 'wide';

const palette = (...entries) => entries.map(([key, label, hex]) => ({ key, label, hex }));

export const FONT_SET = {
  detail: 'Helvetica Neue · Thunder',
  titleTracking: -0.01,
  // colores del manual de la línea gráfica
  colors: palette(['white', 'Blanco', '#ffffff'], ['accent', 'Rojo', '#ff002c'], ['dark', 'Negro', '#000000'], ['cream', 'Crema', '#f3f3e8']),
  // la caligráfica no se lee en mayúsculas: el sticker de título respeta lo escrito
  keepCaseWidths: ['playground'],
  // el ancho elige la familia: extracondensed (título por defecto) = Thunder
  families: {
    extracondensed: 'AJT Thunder',
    condensed: 'AJT Helvetica Neue Condensed',
    semicondensed: 'AJT Helvetica Neue Condensed',
    normal: 'AJT Helvetica Neue',
    wide: 'AJT Helvetica Neue',
    playground: 'AJT PP Playground',
  },
  // cortes que se ofrecen en el panel de texto; tag: su marca para un trozo
  // de texto ([thunder]así[/thunder], ver richText.js)
  styles: [
    { key: 'roman', tag: 'roman', label: 'Roman', patch: { widthVariant: 'normal', weight: 400, bold: false }, isActive: (d, w, widthKey) => isNormalWidth(widthKey) && w < 600 },
    { key: 'bold', tag: 'bold', label: 'Bold', patch: { widthVariant: 'normal', weight: 700, bold: true }, isActive: (d, w, widthKey) => isNormalWidth(widthKey) && w >= 600 },
    { key: 'thunder', tag: 'thunder', label: 'Thunder', patch: { widthVariant: 'extracondensed', weight: 800, bold: true }, isActive: (d, w, widthKey) => widthKey === 'extracondensed' },
    { key: 'blackcn', tag: 'black', label: 'Black Cond.', patch: { widthVariant: 'condensed', weight: 800, bold: true }, isActive: (d, w, widthKey) => widthKey === 'condensed' || widthKey === 'semicondensed' },
    { key: 'playground', tag: 'playground', label: 'PP Playground', patch: { widthVariant: 'playground', weight: 500, bold: false }, isActive: (d, w, widthKey) => widthKey === 'playground' },
  ],
};

// Archivos de cada familia (mismo esquema que fonts.css)
export const FONT_FILES = {
  'AJT Helvetica Neue': { dir: 'ajt', base: 'helvetica-neue', weights: [400, 700] },
  'AJT Helvetica Neue Condensed': { dir: 'ajt', base: 'helvetica-neue-condensed', weights: [900] },
  'AJT Thunder': { dir: 'ajt', base: 'thunder-extrabold', weights: [800] },
  'AJT PP Playground': { dir: 'ajt', base: 'pp-playground', weights: [500] },
  'AJT Open Sauce Sans': { dir: 'ajt', base: 'open-sauce-sans', weights: [400, 500, 700] },
};

// { key, label, family, familyItalic } del ancho pedido
export function getWidthVariant(widthKey) {
  const family = FONT_SET.families[widthKey] || FONT_SET.families.normal;
  return { key: widthKey, label: widthKey, family, familyItalic: family };
}

// ---- colores de marca ----
export function brandColors() { return FONT_SET.colors; }
export function brandColor(colorKey) {
  const c = brandColors().find((x) => x.key === colorKey);
  return c ? c.hex : undefined;
}
export function brandHexes() { return brandColors().map((c) => c.hex); }

// ¿El sticker de título pasa el texto a mayúsculas con esta letra?
export function titleUppercase(widthKey) {
  return !FONT_SET.keepCaseWidths.includes(widthKey);
}

// Familia del rótulo grande (la que usan ubicación y sticker de título)
export function titleFamily() {
  return getWidthVariant('extracondensed').family;
}

// Peso realmente declarado en la familia que mejor casa con el pedido, con la
// misma regla de CSS que aplica el navegador; así la carga bajo demanda pide
// exactamente el archivo que luego se dibujará.
export function snapWeight(family, wanted) {
  const info = FONT_FILES[family];
  if (!info) return wanted;
  const avail = info.weights;
  if (avail.includes(wanted)) return wanted;
  const below = avail.filter((w) => w < wanted).sort((a, b) => b - a);
  const above = avail.filter((w) => w > wanted).sort((a, b) => a - b);
  if (wanted < 400) return below[0] ?? above[0];
  if (wanted > 500) return above[0] ?? below[0];
  const upTo500 = above.filter((w) => w <= 500);
  return upTo500[0] ?? below[0] ?? above[0];
}
