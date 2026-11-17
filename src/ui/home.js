import { titleFamily } from '../engine/fontSets.js';
import { villalbaSrc } from '../templates/villalbaLogo.js';
import { ensureFonts } from '../engine/fonts.js';
import { isMuted, setMuted } from '../lib/sound.js';
import { icon } from './icons.js';

// Menú de inicio, de arriba abajo:
//   1. Plantillas · Textos · Stickers
//   2. Plantillas → Reposts · Artículos · Imágenes; Stickers → Ubicación · Fechas · Logo AJT · Temáticos
//   3. Temáticos → Huelga, etc.
// Cada nivel es una lista con «‹ Volver»; la última fila abre la plantilla.

// Cada nodo: { title, hint, icon, id } abre una plantilla; { title, hint, icon, children } abre otro nivel.
const MENU = [
  {
    title: 'Plantillas', hint: 'Stories y fotos ya montadas', icon: 'story',
    children: [
      {
        title: 'Reposts', hint: 'Para compartir una publicación', icon: 'storyShared',
        children: [
          { title: 'Post arriba - Texto abajo', hint: 'Publicación, título y cuerpo debajo', icon: 'story', id: 'builtin_repost_simple' },
          { title: 'Título arriba - Post en el medio - Texto abajo', hint: 'Título, publicación y cuerpo', icon: 'storyShared', id: 'builtin_repost_shared' },
        ],
      },
      {
        title: 'Artículos', hint: 'Para compartir un artículo', icon: 'article',
        children: [
          { title: 'Artículo general', hint: 'Titular, portada y resumen', icon: 'article', id: 'builtin_article' },
          { title: 'Diario Socialista', hint: 'Titular del diario sobre tu foto', icon: 'article', id: 'builtin_diario_socialista' },
        ],
      },
      {
        title: 'Imágenes', hint: 'Tu foto con stickers o ubicación', icon: 'photo',
        children: [
          { title: 'Imagen + stickers', hint: 'Tu imagen con stickers y textos que mueves a mano', icon: 'compose', id: 'compose_photo' },
          { title: 'Foto con ubicación', hint: 'Tu foto con la ubicación', icon: 'photo', id: 'photo_location' },
        ],
      },
    ],
  },
  {
    title: 'Textos', hint: 'Rótulos y cuerpos para stories', icon: 'title',
    children: [
      { title: 'Título', hint: 'Rótulo grande, con fondo si quieres', icon: 'title', id: 'sticker_title' },
      { title: 'Texto', hint: 'Cuerpo de texto, con fondo si quieres', icon: 'text', id: 'sticker_body' },
    ],
  },
  {
    title: 'Stickers', hint: 'PNG listos para descargar', icon: 'star',
    children: [
      { title: 'Ubicación', hint: 'Pin con el nombre del lugar', icon: 'pin', id: 'sticker_location' },
      { title: 'Fechas', hint: 'Rótulo de fecha, con fondo si quieres', icon: 'calendar', id: 'sticker_date' },
      { title: 'Logo AJT', hint: 'Editable: pones la ubicación', icon: 'logo', id: 'logo_ajt' },
      {
        title: 'Temáticos', hint: 'Campañas y movilizaciones', icon: 'flag',
        children: [
          { title: 'Huelga General 11N', hint: '5 stickers y fondo vertical', icon: 'flag', id: 'sticker_huelga_huelga-general' },
        ],
      },
    ],
  },
];

export function initHome({ root, onOpen }) {
  let path = []; // índices elegidos en cada nivel
  let openedFrom = []; // nivel del menú desde el que se abrió la plantilla en curso

  function currentLevel() {
    let items = MENU;
    const crumbs = [];
    for (const i of path) {
      const node = items[i];
      if (!node) break;
      crumbs.push(node);
      if (!node.children) break;
      items = node.children;
    }
    return { items, crumbs };
  }

  function row(node, index) {
    const b = document.createElement('button');
    b.type = 'button';
    const opensLevel = !!node.children;
    b.className = 'menu-row' + (opensLevel ? '' : ' leaf');
    b.innerHTML = `<span class="menu-ic">${icon(node.icon, 26)}</span><span class="menu-text"><strong></strong><small></small></span><span class="menu-go">${icon(opensLevel ? 'chevron' : 'plus', 20)}</span>`;
    b.querySelector('strong').textContent = node.title;
    b.querySelector('small').textContent = node.hint;
    b.addEventListener('click', () => {
      if (opensLevel) { path.push(index); render(); } else { openedFrom = path.slice(); onOpen(node.id); }
    });
    return b;
  }

  function render() {
    root.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'home-inner';

    // cabecera: logo de AJT Villalba + sonido
    const top = document.createElement('div');
    top.className = 'home-top';
    const logo = document.createElement('img');
    logo.className = 'home-logo';
    logo.src = villalbaSrc('original-blanco', 'compacto');
    logo.alt = 'AJT Villalba';
    top.appendChild(logo);
    const sound = document.createElement('button');
    sound.type = 'button';
    sound.className = 'home-sound';
    const paintSound = () => {
      sound.innerHTML = icon(isMuted() ? 'soundOff' : 'soundOn', 22);
      sound.setAttribute('aria-pressed', String(!isMuted()));
      sound.setAttribute('aria-label', isMuted() ? 'Activar sonidos' : 'Silenciar sonidos');
      sound.title = sound.getAttribute('aria-label');
    };
    paintSound();
    sound.addEventListener('click', () => { setMuted(!isMuted()); paintSound(); });
    top.appendChild(sound);
    inner.appendChild(top);

    const { items, crumbs } = currentLevel();
    const head = document.createElement('div');
    head.className = 'home-head';
    if (crumbs.length) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'home-back';
      back.innerHTML = `${icon('back', 20)}<span></span>`;
      back.querySelector('span').textContent = crumbs.length > 1 ? crumbs[crumbs.length - 2].title : 'Inicio';
      back.addEventListener('click', () => { path.pop(); render(); });
      head.appendChild(back);
    }
    const h = document.createElement('h2');
    h.textContent = crumbs.length ? crumbs[crumbs.length - 1].title : 'Crear';
    head.appendChild(h);
    inner.appendChild(head);

    const list = document.createElement('div');
    list.className = 'menu-list';
    items.forEach((node, i) => list.appendChild(row(node, i)));
    inner.appendChild(list);

    root.appendChild(inner);
  }

  // El rótulo grande usa la tipografía de AJT: se carga antes de pintar
  async function paint(newPath) {
    path = newPath;
    try { await ensureFonts([`800 40px "${titleFamily()}"`]); } catch { /* se pinta con la de reserva */ }
    render();
    root.classList.remove('hidden');
  }

  return {
    show() { return paint([]); },
    // vuelve al menú justo en el nivel desde el que se abrió lo que estás editando
    showPrevious() { return paint(openedFrom.slice()); },
    hide() { root.classList.add('hidden'); },
    isOpen() { return !root.classList.contains('hidden'); },
  };
}
