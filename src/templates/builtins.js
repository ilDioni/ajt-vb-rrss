import { CANVAS_W, CANVAS_H, COLORS } from '../engine/constants.js';
import { makeTextLayer, makeImageLayer, makeLogoLayer, makeFrameLayer, makeGradientLayer, makeBackgroundLayer } from '../engine/layerFactory.js';
import { makeVillalbaLogoLayer, VILLALBA_LOGO_ASPECT } from './villalbaLogo.js';

const MARGIN = 80;

// 1) Repost simple: hueco de publicación compartida arriba, logo tipo sticker,
//    título en rojo y cuerpo debajo, fondo negro sólido. (como el ejemplo "Libertad Fergie Chambers")
function repostSimple() {
  const imgH = 980;
  return {
    canvas: { width: CANVAS_W, height: CANVAS_H },
    templateName: 'Post arriba - Texto abajo',
    templateVersion: 2,
    layers: [
      makeFrameLayer({
        name: 'Marco compartido (guía)',
        x: MARGIN, y: 140, width: CANVAS_W - MARGIN * 2, height: imgH,
        ratioKey: 'libre', cornerRadius: 28,
      }),
      makeLogoLayer({
        name: 'Logo (sticker)',
        asset: 'icon-on-red',
        x: CANVAS_W - MARGIN - 190, y: 140 + imgH - 150,
        width: 150, height: 150,
      }),
      makeTextLayer({
        name: 'Título', role: 'title',
        text: 'Título de la publicación',
        x: MARGIN, y: 140 + imgH + 60, width: CANVAS_W - MARGIN * 2, height: 180,
        color: COLORS.red, autoFit: false, fontSize: 84,
      }),
      makeTextLayer({
        name: 'Cuerpo', role: 'body',
        text: 'Texto de cuerpo explicando la publicación compartida y **el contexto de la story** (lo que va entre dobles asteriscos sale en negrita).',
        x: MARGIN, y: 140 + imgH + 250, width: CANVAS_W - MARGIN * 2, height: 420,
        color: COLORS.white, autoFit: false, fontSize: 44,
      }),
    ],
  };
}

// 2) Repost con publicación compartida: Título / marco de "compartido" (Instagram)
//    / cuerpo, con el logo apilado de Villalba abajo a la izquierda
function repostShared() {
  const frameW = CANVAS_W - MARGIN * 2;
  const frameH = (frameW * 5) / 4; // 4:5 por defecto
  const frameY = 420;
  const bodyY = frameY + frameH + 30;
  // logo alineado con el margen izquierdo del texto; el cuerpo acaba antes
  const logoW = 360;
  const logoY = CANVAS_H - 90 - logoW * VILLALBA_LOGO_ASPECT.compacto;
  return {
    canvas: { width: CANVAS_W, height: CANVAS_H },
    templateName: 'Título arriba - Post en el medio - Texto abajo',
    templateVersion: 3,
    layers: [
      makeTextLayer({
        name: 'Título', role: 'title',
        text: 'Título de la publicación',
        x: MARGIN, y: 120, width: CANVAS_W - MARGIN * 2, height: 220,
        color: COLORS.red, autoFit: false, fontSize: 88,
      }),
      makeFrameLayer({
        name: 'Marco compartido (guía)',
        x: MARGIN, y: frameY, width: frameW, height: frameH,
        ratioKey: '4:5', cornerRadius: 28,
      }),
      makeTextLayer({
        name: 'Cuerpo', role: 'body',
        text: 'Texto de cuerpo con el contexto y **la reflexión** sobre la publicación compartida.',
        x: MARGIN, y: bodyY, width: CANVAS_W - MARGIN * 2, height: logoY - 25 - bodyY,
        color: COLORS.white, autoFit: false, fontSize: 44,
      }),
      makeVillalbaLogoLayer({ x: MARGIN, y: logoY, width: logoW, layout: 'compacto', free: true }),
    ],
  };
}

// 3) Artículo (plantilla fija): título principal + subtítulo (desactivable) +
//    portada + cuerpo autoajustable + hueco enlace + logo de Villalba (fijo)
// arranca por debajo de la zona que tapa la barra superior de Instagram
// (barras de progreso + avatar/nombre, ~200px de 1920)
export const ARTICLE_TITLE_Y = 230;
export const ARTICLE_SUBTITLE_GAP = 12;
function articleFixed() {
  const titleH = 160;
  const subtitleY = ARTICLE_TITLE_Y + titleH + ARTICLE_SUBTITLE_GAP;
  const subtitleH = 100;
  const coverY = subtitleY + subtitleH + 28;
  const coverH = 640;
  return {
    canvas: { width: CANVAS_W, height: CANVAS_H },
    templateName: 'Artículo general',
    // al cambiar la estructura de esta plantilla se sube la versión para que
    // los espacios de trabajo guardados con la estructura vieja se descarten
    templateVersion: 6,
    layers: [
      makeBackgroundLayer({
        name: 'Fondo', x: 0, y: 0, width: CANVAS_W, height: CANVAS_H, color: '#ffffff',
        exportable: true,
      }),
      makeTextLayer({
        name: 'Título principal', role: 'title', slot: 'mainTitle',
        text: 'Titular del artículo',
        x: MARGIN, y: ARTICLE_TITLE_Y, width: CANVAS_W - MARGIN * 2, height: titleH,
        color: COLORS.black, autoFit: true,
      }),
      makeTextLayer({
        name: 'Subtítulo', role: 'body', slot: 'subtitle',
        text: 'Subtítulo que amplía o matiza el titular',
        x: MARGIN, y: subtitleY, width: CANVAS_W - MARGIN * 2, height: subtitleH,
        color: COLORS.black, autoFit: true, bold: true,
      }),
      makeImageLayer({
        name: 'Portada', x: MARGIN, y: coverY, width: CANVAS_W - MARGIN * 2, height: coverH,
        cornerRadius: 20,
      }),
      makeTextLayer({
        name: 'Cuerpo', role: 'body',
        text: 'Resumen o entradilla del artículo con **una idea clave en negrita**, que se autoajusta para que la foto de portada nunca pierda espacio.',
        x: MARGIN, y: coverY + coverH + 36, width: CANVAS_W - MARGIN * 2, height: 260,
        color: COLORS.black, autoFit: true,
      }),
      makeTextLayer({
        name: 'Espacio enlace (Instagram)', role: 'body',
        text: '↗ Enlace de Instagram',
        x: MARGIN, y: CANVAS_H - 330, width: CANVAS_W - MARGIN * 2, height: 90,
        color: '#888888', autoFit: false, fontSize: 28, align: 'center',
      }),
      // abajo, centrado a lo ancho, a la altura de la antigua fila de logos
      makeVillalbaLogoLayer({ x: MARGIN, y: CANVAS_H - 135 - ((CANVAS_W - MARGIN * 2) * VILLALBA_LOGO_ASPECT.alargado) / 2, width: CANVAS_W - MARGIN * 2 }),
    ],
  };
}

// 4) Diario Socialista: foto de fondo + cabecera «DIARIO SOCIALISTA» (blanca
//    o negra) + imagen del titular (captura de la web) + hueco del enlace.
//    Medidas sacadas de una story real del diario.
const dsLogoSrc = (color) => `./assets/logos/diario-socialista/diario-socialista-${color}.png`;
// separación entre la imagen del titular y la guía del enlace (main.js la
// recoloca con esta distancia al subir la imagen)
export const DS_LINK_GAP = 100;
function diarioSocialista() {
  const cardX = 110;
  const cardW = CANVAS_W - cardX * 2;
  const cardY = 555;
  const cardH = 680;
  // el PNG de la cabecera mide 1085x134 y la tinta empieza a 29 px del borde
  // izquierdo: se adelanta para que el texto quede alineado con el titular
  const logoW = 524;
  return {
    canvas: { width: CANVAS_W, height: CANVAS_H },
    templateName: 'Diario Socialista',
    templateVersion: 4,
    layers: [
      {
        ...makeImageLayer({ name: 'Foto de fondo', x: 0, y: 0, width: CANVAS_W, height: CANVAS_H, fit: 'cover', locked: true }),
        placeholderText: '+ foto de fondo', placeholderAlign: 'bottom',
        darken: 0, // con brillo ajustable (para oscurecer la foto)
      },
      {
        ...makeImageLayer({
          name: 'Cabecera Diario Socialista', src: dsLogoSrc('blanco'), fit: 'contain',
          x: cardX - Math.round((29 * logoW) / 1085), y: 460, width: logoW, height: (logoW * 134) / 1085,
        }),
        choices: [{ label: 'Blanco', src: dsLogoSrc('blanco') }, { label: 'Negro', src: dsLogoSrc('negro') }],
      },
      {
        // 'contain': al subir la imagen, el recuadro toma su proporción (main.js)
        ...makeImageLayer({ name: 'Titular (imagen)', fit: 'contain', x: cardX, y: cardY, width: cardW, height: cardH }),
        slot: 'dsHeadline', placeholderText: '+ imagen del titular',
      },
      {
        // marca dónde poner el sticker de enlace de Instagram
        ...makeTextLayer({
          name: 'Espacio enlace (Instagram)', role: 'body',
          text: '↗ Enlace de Instagram',
          x: cardX, y: cardY + cardH + DS_LINK_GAP, width: cardW, height: 90,
          color: '#888888', autoFit: false, fontSize: 28, align: 'center',
        }),
        slot: 'dsLink',
      },
    ],
  };
}

export const BUILTIN_TEMPLATES = [
  { id: 'builtin_repost_simple', name: 'Post arriba - Texto abajo', builtin: true, category: 'Reposts', doc: repostSimple },
  { id: 'builtin_repost_shared', name: 'Título arriba - Post en el medio - Texto abajo', builtin: true, category: 'Reposts', doc: repostShared },
  { id: 'builtin_article', name: 'Artículo general', builtin: true, category: 'Artículos', doc: articleFixed },
  { id: 'builtin_diario_socialista', name: 'Diario Socialista', builtin: true, category: 'Artículos', doc: diarioSocialista },
];
