import { buildGalleryDoc, GALLERIES } from './gallery.js';
import { buildAjtLogoDoc } from './ajtLogo.js';
import { buildComposeDoc } from './compose.js';
import { buildTextTitleDoc, buildTextBodyDoc, buildDateDoc, buildLocationStickerDoc, buildPhotoLocationDoc } from './locationGenerator.js';

// Plantillas de arranque para los generadores rápidos. El contenido real se
// recalcula en vivo (main.js) según lo que el usuario escribe/sube; estas
// funciones solo dan el estado inicial al entrar en cada apartado.

export const STICKER_TEMPLATES = [
  { id: 'sticker_title', name: 'Sticker · Título', builtin: true, category: 'Stickers', doc: () => buildTextTitleDoc('QUE VIVA LA LUCHA') },
  { id: 'sticker_body', name: 'Sticker · Cuerpo', builtin: true, category: 'Stickers', doc: () => buildTextBodyDoc() },
  { id: 'sticker_date', name: 'Sticker · Fecha', builtin: true, category: 'Stickers', doc: () => buildDateDoc() },
  { id: 'sticker_location', name: 'Sticker · Ubicación', builtin: true, category: 'Stickers', doc: () => buildLocationStickerDoc('VILLALBA') },
];

export const PHOTO_TEMPLATES = [
  { id: 'compose_photo', name: 'Imagen + stickers', builtin: true, category: 'Imágenes', doc: () => buildComposeDoc() },
  { id: 'photo_location', name: 'Foto con ubicación', builtin: true, category: 'Imágenes', doc: () => buildPhotoLocationDoc('VILLALBA') },
];

// Sección propia del menú: un acceso por sticker, todos con la misma galería
// (miniaturas, color de marca y descarga) en el panel.
export const HUELGA_TEMPLATES = GALLERIES.huelga11n.items.map((item) => ({
  id: `sticker_huelga_${item.key}`,
  name: item.label,
  builtin: true,
  category: 'Stickers Huelga General 11N',
  doc: () => buildGalleryDoc('huelga11n', item.key),
}));

// Sección «Logos»: logo de AJT editable (nombre de la ubicación).
export const LOGO_TEMPLATES = [
  { id: 'logo_ajt', name: 'AJT · logo con ubicación', builtin: true, category: 'Logos', doc: () => buildAjtLogoDoc() },
];
