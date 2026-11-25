import { FONT_SET, brandColors, getWidthVariant, snapWeight } from './fontSets.js';

// Texto enriquecido muy ligero, con marcas dentro del propio texto, para
// resaltar palabras sueltas sin tener que crear una capa de texto nueva:
//   **así**                  negrita
//   [rojo]así[/rojo]         color de la marca (blanco, negro, rojo, crema)
//   [thunder]así[/thunder]   letra (roman, bold, thunder, black, playground)
// Se pueden combinar y anidar: [rojo][thunder]así[/thunder][/rojo].
//
// Konva.Text no soporta estilos mixtos dentro de un mismo nodo, así que
// troceamos el texto en "runs" (segmentos con el mismo estilo) y calculamos
// nosotros el ajuste de línea palabra a palabra con canvas measureText,
// para luego pintar cada run como su propio Konva.Text posicionado a mano.

let measureCanvas = null;
function getCtx() {
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  return measureCanvas.getContext('2d');
}

// Marcas disponibles (las usan también los botones del panel)
export const COLOR_MARKS = brandColors().map((c) => ({ tag: c.label.toLowerCase(), label: c.label, hex: c.hex }));
export const FONT_MARKS = FONT_SET.styles.map((s) => ({ tag: s.tag, label: s.label, style: s }));
const COLOR_BY_TAG = Object.fromEntries(COLOR_MARKS.map((m) => [m.tag, m.hex]));
const STYLE_BY_TAG = Object.fromEntries(FONT_MARKS.map((m) => [m.tag, m.style]));

const TOKEN = /\*\*|\[(\/?)([a-z]+)\]/gi;

// "hola **mundo** [rojo]bonito[/rojo]" ->
//   [{text:'hola ', bold:false, color:null, font:null}, {text:'mundo', bold:true, ...}, {text:' '}, {text:'bonito', color:'#ff002c'}]
// Las ** van por parejas (una suelta se queda como texto); una marca de cierre
// sin su apertura, o una etiqueta que no existe, también se quedan como texto.
export function parseRich(text) {
  const src = text || '';
  const stars = [...src.matchAll(/\*\*/g)].map((m) => m.index);
  const paired = new Set(stars.slice(0, stars.length - (stars.length % 2)));
  const segments = [];
  const colors = [];
  const fonts = [];
  let bold = false;
  let pos = 0;
  const push = (upTo) => {
    if (upTo > pos) {
      segments.push({ text: src.slice(pos, upTo), bold, color: COLOR_BY_TAG[colors[colors.length - 1]] || null, font: fonts[fonts.length - 1] || null });
    }
  };
  for (const m of src.matchAll(TOKEN)) {
    if (m.index < pos) continue;
    let apply = null;
    if (m[0] === '**') {
      if (paired.has(m.index)) apply = () => { bold = !bold; };
    } else {
      const closing = m[1] === '/';
      const name = m[2].toLowerCase();
      const stack = name in COLOR_BY_TAG ? colors : name in STYLE_BY_TAG ? fonts : null;
      if (stack && !closing) apply = () => stack.push(name);
      else if (stack && stack.lastIndexOf(name) >= 0) apply = () => stack.splice(stack.lastIndexOf(name), 1);
    }
    if (!apply) continue;
    push(m.index);
    apply();
    pos = m.index + m[0].length;
  }
  push(src.length);
  return segments;
}

// El texto sin las marcas
export function stripMarkup(text) {
  return parseRich(text).map((s) => s.text).join('');
}

// ¿Lleva alguna marca (negrita, color o letra)?
export function hasMarkup(text) {
  const segs = parseRich(text);
  return segs.some((s) => s.bold || s.color || s.font) || segs.map((s) => s.text).join('') !== (text || '');
}

// Peso base (el que se elige con los botones de peso; 800 por defecto en los
// títulos) y peso de la negrita parcial (**así**), siempre más grueso que la base.
export function bodyWeights(d) {
  const normal = d.weight || (d.role === 'title' ? 800 : (d.bold ? 700 : 400));
  return { normal, bold: boldWeightFor(normal) };
}
function boldWeightFor(normal) {
  return Math.min(900, Math.max(700, normal + 300));
}

// Letra de un trozo: la de la capa (base = { family, normal, bold }) o la de
// su marca de letra ([thunder]…)
function segmentFace(seg, base) {
  const style = seg.font && STYLE_BY_TAG[seg.font];
  if (!style) return base;
  const normal = style.patch.weight;
  return { family: getWidthVariant(style.patch.widthVariant).family, normal, bold: boldWeightFor(normal) };
}

// Familias y pesos que hacen falta para dibujar un texto (para cargarlas antes)
export function richFaces(text, base) {
  return parseRich(text).map((seg) => {
    const face = segmentFace(seg, base);
    return { family: face.family, weight: seg.bold ? face.bold : face.normal };
  });
}

// Trocea los segmentos en "palabras", espacios y saltos de línea ("\n" va
// como token propio para respetar los puntos y aparte y las líneas vacías),
// preservando el estilo de cada trozo.
function segmentsToWords(segments) {
  const words = [];
  for (const seg of segments) {
    const parts = seg.text.replace(/\r\n?/g, '\n').split(/(\n|[^\S\n]+)/).filter((p) => p.length);
    for (const part of parts) words.push({ ...seg, text: part });
  }
  return words;
}

function fontString(weight, size, family, italic = false) {
  return `${italic ? 'italic ' : ''}${weight} ${size}px "${family}"`;
}

/**
 * Calcula las líneas (wrap) para un fontSize dado. Devuelve también el alto
 * total usado. Cada run trae su familia, peso, color (null = el de la capa),
 * si su negrita es simulada (familias sin un corte más grueso) y dy, el ajuste
 * vertical para que letras distintas compartan la línea base.
 */
export function layoutRichText({
  text, box, fontFamily, fontFamilyItalic, italic, normalWeight = 400, boldWeight = 700,
  fontSize, lineHeight = 1.08, align = 'left', letterSpacing = 0,
}) {
  const ctx = getCtx();
  const base = { family: italic ? fontFamilyItalic : fontFamily, normal: normalWeight, bold: boldWeight };
  const words = segmentsToWords(parseRich(text)).map((w) => {
    const face = segmentFace(w, base);
    return {
      ...w,
      family: face.family,
      weight: w.bold ? face.bold : face.normal,
      fauxBold: w.bold && snapWeight(face.family, face.bold) <= snapWeight(face.family, face.normal),
    };
  });

  // distancia de la línea media (donde Konva apoya el texto) a la línea base,
  // por letra: con ella se alinean por la base letras distintas en una línea
  const midToBase = new Map();
  const baselineOf = (family, weight) => {
    const key = `${family}|${weight}`;
    if (!midToBase.has(key)) {
      ctx.font = fontString(weight, fontSize, family, italic);
      ctx.textBaseline = 'alphabetic';
      const fromBase = ctx.measureText('H').fontBoundingBoxAscent;
      ctx.textBaseline = 'middle';
      const fromMiddle = ctx.measureText('H').fontBoundingBoxAscent;
      ctx.textBaseline = 'alphabetic';
      midToBase.set(key, fromBase != null && fromMiddle != null ? fromBase - fromMiddle : 0);
    }
    return midToBase.get(key);
  };
  const baseBaseline = baselineOf(base.family, base.normal);

  const lines = [];
  let current = [];

  const isSpaceText = (t) => /^\s+$/.test(t);
  const lineWidth = (ws) => ws.reduce((acc, w) => acc + w.width, 0);
  // endsParagraph: la línea termina en un Enter o es la última (no se justifica)
  const pushLine = (endsParagraph) => {
    while (current.length && isSpaceText(current[current.length - 1].text)) current.pop();
    lines.push({ words: current, width: lineWidth(current), endsParagraph });
    current = [];
  };
  // Konva añade el espaciado entre letras detrás de cada carácter
  const measure = (t, w) => {
    ctx.font = fontString(w.weight, fontSize, w.family, italic);
    return ctx.measureText(t).width + letterSpacing * [...t].length;
  };

  // Una palabra más ancha que la caja (p.ej. escribir sin espacios) se parte
  // por letras; antes se salía por la derecha del lienzo.
  const splitLongWord = (word) => {
    const pieces = [];
    let piece = '';
    for (const ch of word.text) {
      if (piece && measure(piece + ch, word) > box.width) {
        pieces.push(piece);
        piece = ch;
      } else {
        piece += ch;
      }
    }
    if (piece) pieces.push(piece);
    return pieces.map((t) => ({ ...word, text: t, width: measure(t, word) }));
  };

  for (const word of words) {
    if (word.text === '\n') {
      // salto de línea forzado: cierra la línea actual aunque esté vacía, así
      // un Enter doble deja una línea en blanco entre párrafos
      pushLine(true);
      continue;
    }
    const w = measure(word.text, word);
    if (isSpaceText(word.text)) {
      // no arrancamos línea con un espacio
      if (current.length === 0) continue;
      current.push({ ...word, width: w });
      continue;
    }
    const pieces = w > box.width ? splitLongWord(word) : [{ ...word, width: w }];
    for (const piece of pieces) {
      const used = lineWidth(current);
      if (used + piece.width > box.width && current.some((x) => !isSpaceText(x.text))) pushLine(false);
      current.push(piece);
    }
  }
  if (current.length) pushLine(true);
  if (lines.length) lines[lines.length - 1].endsParagraph = true;

  // posiciones x por alineación (justificado: el hueco sobrante se reparte
  // entre los espacios, salvo en la última línea de cada párrafo)
  let y = 0;
  const positioned = [];
  for (const line of lines) {
    let x = 0;
    let extraPerSpace = 0;
    if (align === 'center') x = (box.width - line.width) / 2;
    else if (align === 'right') x = box.width - line.width;
    else if (align === 'justify' && !line.endsParagraph) {
      const spaces = line.words.filter((w) => isSpaceText(w.text)).length;
      if (spaces) extraPerSpace = (box.width - line.width) / spaces;
    }
    for (const w of line.words) {
      const dy = w.family === base.family && w.weight === base.normal ? 0 : baseBaseline - baselineOf(w.family, w.weight);
      positioned.push({ ...w, x, y, dy });
      x += w.width + (isSpaceText(w.text) ? extraPerSpace : 0);
    }
    y += fontSize * lineHeight;
  }

  const maxLineWidth = lines.reduce((m, l) => Math.max(m, l.width), 0);
  return { runs: positioned, usedHeight: lines.length ? y : 0, lineCount: lines.length, maxLineWidth };
}

/**
 * Igual que fitTextToBox pero para texto con marcas: prueba tamaños de mayor
 * a menor hasta que el layout completo quepa en box.height.
 */
export function fitRichText({
  text, box, fontFamily, fontFamilyItalic, italic, normalWeight = 400, boldWeight = 700,
  minSize = 10, maxSize = 90, lineHeight = 1.08, align = 'left', letterSpacing = 0,
}) {
  let best = null;
  for (let size = maxSize; size >= minSize; size -= 1) {
    const layout = layoutRichText({
      text, box, fontFamily, fontFamilyItalic, italic, normalWeight, boldWeight, fontSize: size, lineHeight, align, letterSpacing,
    });
    if (layout.usedHeight <= box.height) { best = { ...layout, fontSize: size }; break; }
  }
  if (!best) {
    best = { ...layoutRichText({ text, box, fontFamily, fontFamilyItalic, italic, normalWeight, boldWeight, fontSize: minSize, lineHeight, align, letterSpacing }), fontSize: minSize };
  }
  return best;
}
