import { makeImageLayer } from '../engine/layerFactory.js';

// Galerías de stickers ya hechos (no editables): la app solo los muestra y
// permite descargar el archivo ORIGINAL. Para añadir uno nuevo basta con
// dejar el PNG en assets/stickers/<galería>/ y añadir aquí una línea con su
// tamaño real en píxeles.
export const GALLERIES = {
  // recolor: true = sticker de un solo color que se puede descargar en los
  // colores de AJT (ver lib/recolor.js)
  huelga11n: {
    title: 'Stickers Huelga General 11N',
    zipName: 'stickers_huelga_general_11n.zip',
    items: [
      { key: 'huelga-general', label: 'Huelga General!', src: './assets/stickers/huelga11n/huelga-general.png', width: 792, height: 788, recolor: true },
      { key: 'unete', label: 'Únete! Comités juveniles', src: './assets/stickers/huelga11n/unete.png', width: 965, height: 766, recolor: true, duotone: true },
      { key: '11n-rentismo', label: '11N · Contra el rentismo', src: './assets/stickers/huelga11n/11n-contra-el-rentismo.png', width: 5610, height: 1019, recolor: true },
      { key: 'contra-rentismo', label: 'Contra el rentismo, gobierno y capital', src: './assets/stickers/huelga11n/contra-el-rentismo-gobierno-capital.png', width: 2452, height: 1574, recolor: true },
      { key: 'fondo-vertical', label: 'FONDO VERTICAL 9:16', src: './assets/stickers/huelga11n/fondo-vertical.png', width: 1080, height: 1980, recolor: false, noPad: true },
    ],
  },
};

// Todo lo que se descarga con transparencia es un sticker y sale con un margen
// transparente alrededor (ver lib/pad.js). Solo el fondo vertical, que es opaco,
// lleva noPad y se descarga tal cual.

export function galleryItem(galleryKey, itemKey) {
  const g = GALLERIES[galleryKey];
  if (!g) return null;
  return g.items.find((i) => i.key === itemKey) || g.items[0];
}

export function buildGalleryDoc(galleryKey, itemKey) {
  const item = galleryItem(galleryKey, itemKey);
  if (!item) return null;
  const g = GALLERIES[galleryKey];
  const title = g ? g.title : item.label;
  return {
    canvas: { width: item.width, height: item.height },
    templateName: g && g.items.length > 1 && itemKey ? `${title} · ${item.label}` : `Sticker · ${title}`,
    quickGenerator: 'gallery',
    gallery: galleryKey,
    layers: [
      {
        ...makeImageLayer({
          name: 'Sticker', src: item.src, fit: 'contain', locked: true, cornerRadius: 0,
          x: 0, y: 0, width: item.width, height: item.height,
        }),
        galleryKey,
        itemKey: item.key,
        galleryColor: null, // null = color original; si no, hex de la marca
      },
    ],
  };
}

// nombre de archivo de descarga a partir de la ruta original
export function galleryFileName(item) {
  return item.src.split('/').pop();
}

// nombre de archivo al descargar en un color de marca: huelga-general-ff002c.png
export function galleryColorFileName(item, hex) {
  const base = galleryFileName(item);
  return hex ? base.replace(/\.png$/i, `-${hex.replace('#', '')}.png`) : base;
}
