import { makeLogoLayer } from '../engine/layerFactory.js';
import { brandColor } from '../engine/fontSets.js';

// Logo de AJT Villalba (assets/logos/villalba), en versión alargada (Artículo)
// o compacta, apilada (repost). Los PNG se usan tal cual, con sus márgenes.
// light: versión para fondos claros (en el panel se muestra sobre blanco)
export const VILLALBA_LOGO_VARIANTS = {
  'original-negro': { label: 'Original negro', file: 'Original negro', light: true },
  'original-blanco': { label: 'Original blanco', file: 'Original blanco' },
  negro: { label: 'Negro', file: 'Negro', light: true },
  blanco: { label: 'Blanco', file: 'Blanco' },
};

export function villalbaSrc(key, layout = 'alargado') {
  return `./assets/logos/villalba/${encodeURIComponent(`${VILLALBA_LOGO_VARIANTS[key].file} ${layout}`)}.png`;
}

// alto/ancho de los PNG (alargados 6627x579, compactos 3827x946)
export const VILLALBA_LOGO_ASPECT = { alargado: 579 / 6627, compacto: 946 / 3827 };

function isDark(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

// Color del fondo visible (el de más arriba si hay varios), o null
export function backgroundColor(layers) {
  const bg = [...layers].reverse().find((l) => l.type === 'background' && l.visible !== false);
  return bg ? bg.color : null;
}

// Versiones permitidas; la primera es la que sale por defecto. Libres en el
// repost (el fondo es la publicación compartida); en el Artículo, según el
// color del fondo de la story.
const FREE_OPTIONS = ['original-blanco', 'original-negro', 'blanco', 'negro'];
export function villalbaOptions(layer, layers) {
  if (layer.villalbaFree) return FREE_OPTIONS;
  const c = (backgroundColor(layers) || '').toLowerCase();
  if (c === brandColor('accent')) return ['negro', 'blanco'];
  if (c === brandColor('dark')) return ['original-blanco', 'blanco'];
  if (c === brandColor('white') || c === brandColor('cream')) return ['original-negro'];
  // color libre: según lo claro u oscuro que sea
  return isDark(c) ? ['original-blanco', 'blanco'] : ['original-negro'];
}

// Versión que se dibuja: la elegida si se admite; si no, la de por defecto
export function villalbaVariant(layer, layers) {
  const options = villalbaOptions(layer, layers);
  return options.includes(layer.villalbaVariant) ? layer.villalbaVariant : options[0];
}

// free: versión a elegir y capa normal (se mueve, se borra…). Si no, sigue al
// fondo y es fija: no se mueve (locked) ni se puede borrar, ocultar o quitar
// de la exportación (required)
export function makeVillalbaLogoLayer({ x, y, width, layout = 'alargado', free = false }) {
  return {
    ...makeLogoLayer({ name: 'Logo Villalba', asset: null, x, y, width, height: width * VILLALBA_LOGO_ASPECT[layout] }),
    villalba: true,
    villalbaLayout: layout,
    villalbaFree: free,
    villalbaVariant: null, // null = la de por defecto
    ...(free ? {} : { locked: true, required: true }),
  };
}
