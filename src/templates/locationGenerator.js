import { COLORS } from '../engine/constants.js';
import { makeTextLayer, makePinLayer, makeImageLayer, makePillLayer } from '../engine/layerFactory.js';
import { getWidthVariant, titleFamily, FONT_SET, titleUppercase } from '../engine/fontSets.js';
import { parseRich, stripMarkup, bodyWeights, layoutRichText } from '../engine/richText.js';

// Proporciones medidas directamente sobre tus stickers reales
// (D:\ICONOS DE UBICACIÓN\MURCIA.png, lienzo 4538x1813, contenido 969px de
// alto), expresadas como fracción del alto del pin/texto.
const RATIO = {
  leftMargin: 0.2786,
  rightMargin: 0.2786,
  gap: 0.3302,
  topMargin: 0.4829,
  bottomMargin: 0.3849,
  pinWidth: 0.6667, // relativo al alto H
};

// Interletrado (tracking) del rótulo en Thunder (negativo = más juntas; ver fontSets.js)
const titleTrackingRatio = () => FONT_SET.titleTracking;
// Peso con el que se pide el rótulo (la familia solo tiene un corte pesado y
// CSS elige el más cercano)
const TITLE_WEIGHT = 800;

// Pastilla de fondo de los stickers de título, fecha y ubicación: margen en
// proporción a la altura de mayúscula (o del pin) y redondeo de las esquinas
// por defecto (0 = rectas, 1 = extremos totalmente redondos)
const PILL_PAD = 0.35;
export const PILL_ROUNDNESS = 0.35;

let measureCtx = null;
function getMeasureCtx() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  return measureCtx;
}

// El hueco real entre la "y" de un Konva.Text (verticalAlign:'top') y el
// borde superior de la tinta NO coincide con lo que predicen las métricas de
// Canvas 2D (fontBoundingBoxAscent/actualBoundingBoxAscent): Konva calcula el
// alto de línea a su manera internamente, así que calibrar con esas métricas
// dejaba el texto desplazado varias decenas de píxeles respecto al pin. En
// vez de adivinar, renderizamos el mismo Konva.Text que usará el lienzo final
// (mismo fontStyle/align/verticalAlign/lineHeight) en un lienzo oculto y
// medimos directamente, píxel a píxel, dónde cae de verdad la tinta.
//
// Rendimiento: esto se llama en cada tecla, así que (1) se mide UNA sola vez
// por texto/fuente a un tamaño de referencia fijo y se escala linealmente
// (la tinta de un texto escala exactamente con fontSize y el interletrado es
// proporcional al tamaño), (2) se cachea el resultado y (3) se reutiliza un
// único Stage oculto con pixelRatio 1 (antes se creaba y destruía uno por
// medición, hasta 5 veces por tecla, y en móvil a 3x de resolución).
const REF_FONT_SIZE = 320;
const inkCache = new Map();
let measureStage = null;
let measureLayer = null;
let measureNode = null;

if (document.fonts && document.fonts.addEventListener) {
  // si una fuente termina de cargar después de medir, lo cacheado no vale
  document.fonts.addEventListener('loadingdone', () => inkCache.clear());
}

function getMeasureStage() {
  if (measureStage) return measureStage;
  const Konva = window.Konva;
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;';
  document.body.appendChild(container);
  measureStage = new Konva.Stage({ container, width: 10, height: 10, listening: false });
  measureLayer = new Konva.Layer({ listening: false });
  measureStage.add(measureLayer);
  measureLayer.getCanvas().setPixelRatio(1);
  measureNode = new Konva.Text({ fill: '#fff', align: 'left', verticalAlign: 'top', lineHeight: 1.08, wrap: 'none' });
  measureLayer.add(measureNode);
  return measureStage;
}

// Devuelve { inkOffsetY, capHeight } como fracción de fontSize.
function measureInkRatios({ text, family, weight, italic, letterSpacingRatio }) {
  const key = `${family}|${weight}|${italic ? 1 : 0}|${letterSpacingRatio}|${text}`;
  const cached = inkCache.get(key);
  if (cached) return cached;

  const fontSize = REF_FONT_SIZE;
  const fontStyle = `${italic ? 'italic ' : ''}${weight}`;
  const ctx = getMeasureCtx();
  ctx.font = `${fontStyle} ${fontSize}px "${family}"`;
  const pad = Math.ceil(fontSize * 0.5);
  const width = Math.ceil(ctx.measureText(text).width + Math.abs(letterSpacingRatio * fontSize) * text.length) + pad * 2;
  const height = Math.ceil(fontSize * 1.6) + pad * 2;

  getMeasureStage();
  measureStage.size({ width, height });
  measureLayer.getCanvas().setPixelRatio(1);
  measureNode.setAttrs({
    x: pad, y: pad, width: width - pad * 2, height: height - pad,
    text, fontSize, fontFamily: family, fontStyle,
    letterSpacing: fontSize * letterSpacingRatio,
  });
  measureLayer.draw();

  const canvas = measureLayer.getCanvas();
  const ratio = canvas.getPixelRatio ? canvas.getPixelRatio() : 1;
  const raw = canvas._canvas;
  const W = raw.width, H = raw.height;
  const data = raw.getContext('2d').getImageData(0, 0, W, H).data;
  // el texto es blanco opaco: cuenta como tinta lo que está al menos medio opaco
  const rowHasInk = (y) => {
    for (let i = y * W * 4 + 3, end = i + W * 4; i < end; i += 4) if (data[i] > 128) return true;
    return false;
  };
  let inkTop = null;
  for (let y = 0; y < H; y++) if (rowHasInk(y)) { inkTop = y; break; }
  let result = null;
  if (inkTop !== null) {
    let inkBottom = inkTop;
    for (let y = H - 1; y > inkTop; y--) if (rowHasInk(y)) { inkBottom = y; break; }
    // Hay medio cuerpo de margen alrededor: la tinta nunca llega a los bordes.
    // Si llega, el navegador ha alterado la lectura de píxeles (algunas
    // protecciones contra el rastreo y extensiones lo hacen) y la medida no
    // vale: salía la letra 2,6 veces más pequeña y desplazada hacia abajo.
    if (inkTop > 0 && inkBottom < H - 1) {
      result = {
        inkOffsetY: (inkTop / ratio - pad) / fontSize,
        capHeight: ((inkBottom - inkTop + 1) / ratio) / fontSize,
      };
    }
  }
  if (!result) {
    // Plan B sin leer píxeles: métricas del propio texto, con la misma línea
    // base ('middle', a media altura de línea) con la que Konva lo dibuja
    ctx.textBaseline = 'middle';
    const m = ctx.measureText(text);
    ctx.textBaseline = 'alphabetic';
    result = {
      inkOffsetY: ((1.08 * fontSize) / 2 - m.actualBoundingBoxAscent) / fontSize,
      capHeight: (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / fontSize,
    };
  }
  if (inkCache.size > 300) inkCache.clear();
  inkCache.set(key, result);
  return result;
}

// Ajusta el tamaño de fuente para que la altura real de la tinta sea targetH.
// Una sola medición (cacheada) en vez de 5 renders por llamada.
function fitFontSizeToCapHeight(text, targetH, family, weight, letterSpacingRatio = 0, italic = false) {
  // la altura la marca la letra de la capa (sin las marcas de negrita, color o letra)
  const plain = stripMarkup(text);
  const ink = measureInkRatios({ text: plain, family, weight, italic, letterSpacingRatio });
  const fontSize = ink.capHeight > 0 ? targetH / ink.capHeight : targetH;
  const letterSpacing = fontSize * letterSpacingRatio;
  // el ancho, como lo dibuja el motor: cada trozo con su letra y su peso
  const { bold } = bodyWeights({ role: 'title', weight });
  const { maxLineWidth: width } = layoutRichText({
    text, box: { width: Infinity, height: Infinity }, fontFamily: family, fontFamilyItalic: family, italic,
    normalWeight: weight, boldWeight: bold, fontSize, letterSpacing,
  });
  return { fontSize, width, capHeight: targetH, letterSpacing, inkOffsetY: ink.inkOffsetY * fontSize };
}

function widthVariantFamily(widthKey, italic) {
  const variant = getWidthVariant(widthKey || 'extracondensed');
  return italic ? variant.familyItalic : variant.family;
}

/**
 * Sticker de título: una sola línea, lienzo ajustado al contenido, sin caja
 * ni controles de posición — pero con libertad de estilo (corte y cursiva),
 * a diferencia del sticker de ubicación que sí usa siempre la misma
 * tipografía de marca.
 */
export function computeTextTitleGeometry(textRaw, { H = 500, widthVariant = 'extracondensed', weight = 800, italic = true, keepCase = false } = {}) {
  const raw = (textRaw || 'TEXTO').trim() || 'TEXTO';
  const text = !keepCase && titleUppercase(widthVariant) ? raw.toUpperCase() : raw;
  // con trozos en otra letra (más alta, o con rasgos largos como PP
  // Playground) se deja más hueco arriba y abajo para que no se corten
  const pad = H * (parseRich(text).some((s) => s.font) ? 0.7 : 0.35);
  const family = widthVariantFamily(widthVariant, italic);
  const lsRatio = widthVariant === 'extracondensed' ? titleTrackingRatio() : 0;
  const { fontSize, width: textWidth, letterSpacing, inkOffsetY } = fitFontSizeToCapHeight(text, H, family, weight, lsRatio, italic);
  return {
    text,
    canvasW: Math.round(textWidth + pad * 2),
    canvasH: Math.round(H + pad * 2),
    textX: pad, textY: pad - inkOffsetY, textW: textWidth + fontSize * 0.15, textH: H * 1.3, fontSize, letterSpacing,
    pillPad: H * PILL_PAD,
  };
}

// Pastilla de fondo de un sticker, oculta al empezar («Sin fondo»)
function hiddenPill(targets, g = {}) {
  return {
    ...makePillLayer({ targetId: targets[0], ...(g.pillPad ? { padding: g.pillPad } : {}) }),
    ...(targets.length > 1 ? { targetIds: targets } : {}),
    roundness: PILL_ROUNDNESS,
    visible: false,
  };
}

// keepCase: respeta mayúsculas y minúsculas (sticker de fecha)
export function buildTextTitleDoc(textRaw, { H = 500, color = COLORS.red, widthVariant = 'extracondensed', weight = 800, italic = true, keepCase = false, name = 'Sticker de título' } = {}) {
  const g = computeTextTitleGeometry(textRaw, { H, widthVariant, weight, italic, keepCase });
  const text = {
    ...makeTextLayer({
      name: 'Texto', role: 'title', italic, locked: true,
      text: g.text, widthVariant, weight,
      x: g.textX, y: g.textY, width: g.textW, height: g.textH,
      color, align: 'left', autoFit: false, fontSize: g.fontSize, letterSpacing: g.letterSpacing,
    }),
    keepCase,
  };
  return {
    canvas: { width: g.canvasW, height: g.canvasH },
    templateName: `${name} · ${g.text}`,
    quickGenerator: 'title',
    templateVersion: 2,
    layers: [hiddenPill([text.id], g), text],
  };
}

// Sticker de fecha: como el de título, pero respeta lo que se escribe
export function buildDateDoc(textRaw = 'Este sábado:') {
  return buildTextTitleDoc(textRaw, { keepCase: true, name: 'Sticker de fecha' });
}

// Caja por defecto del sticker de cuerpo (libre, con ajuste de línea, varios
// cortes de letra y control de posición).
export function defaultBodyStickerBox() {
  return { canvasW: 1200, canvasH: 500, x: 60, y: 60, width: 1080, height: 380 };
}

export function buildTextBodyDoc(textRaw = 'Escribe aquí tu texto largo. Puedes usar varias líneas y **negrita parcial**.', { color = COLORS.white } = {}) {
  const box = defaultBodyStickerBox();
  const text = makeTextLayer({
    name: 'Texto', role: 'body', locked: false, autoFit: true,
    text: textRaw,
    x: box.x, y: box.y, width: box.width, height: box.height,
    color, align: 'left', widthVariant: 'normal',
  });
  return {
    canvas: { width: box.canvasW, height: box.canvasH },
    templateName: 'Sticker de cuerpo',
    quickGenerator: 'body',
    templateVersion: 2,
    layers: [hiddenPill([text.id]), text],
  };
}

/**
 * Sticker de ubicación: pin + nombre de ciudad, con el lienzo ajustado
 * automáticamente a la longitud del texto y las mismas proporciones/tipo de
 * letra que tus stickers de referencia. Sin controles manuales.
 */
export function computeLocationGeometry(cityNameRaw, { H = 600 } = {}) {
  const cityName = (cityNameRaw || 'CIUDAD').toUpperCase().trim() || 'CIUDAD';
  const { fontSize, width: textWidth, letterSpacing, inkOffsetY } = fitFontSizeToCapHeight(cityName, H, titleFamily(), TITLE_WEIGHT, titleTrackingRatio(), true);
  const leftMargin = RATIO.leftMargin * H;
  const rightMargin = RATIO.rightMargin * H;
  const gap = RATIO.gap * H;
  // con trozos en otra letra (más alta, o con rasgos largos como PP
  // Playground) se deja más hueco arriba y abajo para que no se corten
  const extra = parseRich(cityName).some((s) => s.font) ? H * 0.35 : 0;
  const topMargin = RATIO.topMargin * H + extra;
  const bottomMargin = RATIO.bottomMargin * H + extra;
  const pinWidth = RATIO.pinWidth * H;
  return {
    cityName,
    canvasW: Math.round(leftMargin + pinWidth + gap + textWidth + rightMargin),
    canvasH: Math.round(topMargin + H + bottomMargin),
    pinX: leftMargin, pinY: topMargin, pinW: pinWidth, pinH: H,
    textX: leftMargin + pinWidth + gap, textY: topMargin - inkOffsetY, textW: textWidth + fontSize * 0.15, textH: H * 1.3, fontSize, letterSpacing,
    pillPad: H * PILL_PAD,
  };
}

export function pinAssetForColor(color) {
  if (color === COLORS.white) return 'pin-on-black'; // asset blanco
  if (color === COLORS.black) return 'pin-on-white'; // asset negro
  return 'pin-red'; // rojo corporativo
}

export function buildLocationStickerDoc(cityNameRaw, { H = 600, color = COLORS.white } = {}) {
  const g = computeLocationGeometry(cityNameRaw, { H });
  const pin = makePinLayer({
    name: 'Pin', asset: pinAssetForColor(color), locked: true,
    x: g.pinX, y: g.pinY, width: g.pinW, height: g.pinH,
  });
  const text = makeTextLayer({
    name: 'Ciudad', role: 'title', italic: true, locked: true,
    text: g.cityName,
    x: g.textX, y: g.textY, width: g.textW, height: g.textH,
    color, align: 'left', autoFit: false, fontSize: g.fontSize, letterSpacing: g.letterSpacing,
  });
  return {
    canvas: { width: g.canvasW, height: g.canvasH },
    templateName: `Sticker de ubicación · ${g.cityName}`,
    quickGenerator: 'location',
    templateVersion: 2,
    layers: [hiddenPill([pin.id, text.id], g), pin, text],
  };
}

/**
 * Foto con ubicación: una foto (se sube aparte) + el mismo sticker de
 * ubicación anclado a una de las 4 esquinas, con tamaño ajustable.
 */
export function computePhotoBadgeGeometry(cityNameRaw, { corner = 'bottom-left', canvasW = 1080, canvasH = 1350, scale = 1, pill = false } = {}) {
  const cityName = (cityNameRaw || 'CIUDAD').toUpperCase().trim() || 'CIUDAD';
  // La foto puede tener cualquier proporción (vertical, horizontal,
  // cuadrada): el tamaño y el margen del sticker se basan en su lado CORTO
  // para que se vea igual de grande en todas, y si el nombre es tan largo que
  // no cabe a lo ancho, se reduce lo justo para que quepa.
  const base = Math.min(canvasW, canvasH);
  const margin = base * 0.05;
  let H = base * 0.07 * scale;
  let fit = fitFontSizeToCapHeight(cityName, H, titleFamily(), TITLE_WEIGHT, titleTrackingRatio(), true);
  // con pastilla, el sticker se aparta además del borde lo que ocupa su margen
  const pillPadFor = (h) => (pill ? h * PILL_PAD : 0);
  const widthFor = (h, textW) => RATIO.pinWidth * h + RATIO.gap * h + textW + pillPadFor(h) * 2;
  const maxBadgeW = canvasW - margin * 2;
  if (widthFor(H, fit.width) > maxBadgeW) {
    // el ancho del sticker escala linealmente con H
    H *= maxBadgeW / widthFor(H, fit.width);
    fit = fitFontSizeToCapHeight(cityName, H, titleFamily(), TITLE_WEIGHT, titleTrackingRatio(), true);
  }
  const { fontSize, width: textWidth, letterSpacing, inkOffsetY } = fit;
  const gap = RATIO.gap * H;
  const pinWidth = RATIO.pinWidth * H;
  const badgeW = pinWidth + gap + textWidth;
  const isRight = corner.endsWith('right');
  const isBottom = corner.startsWith('bottom');
  const edge = margin + pillPadFor(H);
  const badgeX = isRight ? canvasW - edge - badgeW : edge;
  const badgeY = isBottom ? canvasH - edge - H : edge;
  return {
    cityName, pinX: badgeX, pinY: badgeY, pinW: pinWidth, pinH: H,
    textX: badgeX + pinWidth + gap, textY: badgeY - inkOffsetY, textW: textWidth + fontSize * 0.15, textH: H * 1.3, fontSize, letterSpacing,
    pillPad: H * PILL_PAD,
  };
}

export function buildPhotoLocationDoc(cityNameRaw, {
  corner = 'bottom-left', photoSrc = null, color = COLORS.white,
  canvasW = 1080, canvasH = 1350, scale = 1,
} = {}) {
  const g = computePhotoBadgeGeometry(cityNameRaw, { corner, canvasW, canvasH, scale });
  const pin = makePinLayer({
    name: 'Pin', asset: pinAssetForColor(color), locked: true,
    x: g.pinX, y: g.pinY, width: g.pinW, height: g.pinH,
  });
  const text = makeTextLayer({
    name: 'Ciudad', role: 'title', italic: true, locked: true,
    text: g.cityName,
    x: g.textX, y: g.textY, width: g.textW, height: g.textH,
    color, align: 'left', autoFit: false, fontSize: g.fontSize, letterSpacing: g.letterSpacing,
  });
  return {
    canvas: { width: canvasW, height: canvasH },
    templateName: `Foto con ubicación · ${g.cityName}`,
    quickGenerator: 'photoLocation',
    templateVersion: 2,
    layers: [
      makeImageLayer({
        name: 'Foto', src: photoSrc, fit: 'cover', locked: true, cornerRadius: 0,
        x: 0, y: 0, width: canvasW, height: canvasH,
      }),
      hiddenPill([pin.id, text.id], g),
      pin,
      text,
    ],
  };
}
