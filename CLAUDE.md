# Stories AJT — notas para Claude

Responde en castellano, con lenguaje sencillo: el usuario no es programador.

App web (PWA) para hacer stories y stickers de Instagram con la identidad de AJT (Asamblea de la Juventud
Trabajadora) sin Photoshop. Solo AJT: CJS y OES se quitaron a propósito (2026-11-17), no volver a añadirlos.
Repo ilDioni/ajt-vb-rrss, rama main; si GitHub Pages está activado se sirve en
https://ildioni.github.io/ajt-vb-rrss/. Actualizar = commit + `git push` **solo cuando el usuario lo pida**.

- Repo original (multimarca): CJSocialista00/stories-rrss, remoto `upstream`. Sus novedades se traen a mano,
  adaptándolas (NO merge: allí siguen CJS, OES y Comunidad). Último commit revisado: `7a4dda0` (2026-11-24;
  traídos sombra, degradados/«Fondos» y margen de stickers; lo de Comunidad no). Para ver lo nuevo:
  `git fetch upstream && git log --oneline 7a4dda0..upstream/main`.
- Probar en local: `python devserver.py` (puerto 5500, también desde el móvil por la IP de la red).
- Archivos clave: `src/main.js`, `src/engine/stageRenderer.js`, `src/engine/fontSets.js` (tipografías y
  paleta de AJT), `src/templates/` (plantillas, ubicación, logo AJT), `src/ui/` (interfaz).
- Colores (manual de AJT): rojo #ff002c, crema #f3f3e8, negro #000000, blanco #ffffff.
- En los stickers de ubicación NO hay color libre: solo los colores de AJT. La chincheta puede ir del color del
  texto (por defecto) o de uno propio (`pinColor` en la capa del pin; `cmpPinColor` en «Imagen + stickers»).
- Ubicación por defecto en stickers, foto y logo editable: Villalba.
- Plantilla Artículo: logo de Villalba (`assets/logos/villalba`, `src/templates/villalbaLogo.js`) siempre
  abajo y centrado, fijo (sin mover, borrar, ocultar ni quitar del PNG). Versión alargada según el fondo:
  blanco/crema → original negro; rojo → negro o blanco; negro → original blanco o blanco. Los PNG se usan
  tal cual, con su margen transparente a la izquierda: NO recortarlo (lo pidió el usuario).
- Plantilla Diario Socialista (`builtins.js`): foto de fondo fija + cabecera blanca/negra (`choices` en la
  capa) + imagen del titular (slot `dsHeadline`: al subirla toma su proporción y la guía `dsLink` del enlace
  se recoloca debajo, en `main.js`).
- Hueco del enlace en Artículo y Diario Socialista: texto «↗ Enlace de Instagram» que SÍ sale en el PNG
  (en el Diario Socialista, 100 px por debajo del titular: `DS_LINK_GAP`).
- Repost «Título arriba - Post en el medio - Texto abajo»: logo de Villalba compacto (apilado) abajo a la
  izquierda, versión a elegir entre las 4 (`villalbaFree`), capa normal (se mueve y se borra).
- Menú (`src/ui/home.js`): Plantillas → Reposts / Artículos / Imágenes; Textos → Título / Texto;
  Stickers → Ubicación / Fechas / Logo AJT / Temáticos.
- Pastilla de fondo (capa `pill`, oculta = «Sin fondo»; blanco, negro, rojo o crema) en los stickers de
  título, texto, fechas, ubicación y foto con ubicación. Esquinas a elegir en todas (`roundness` 0–1,
  slider «Esquinas» en %). En título/fecha/ubicación el margen va en proporción a la letra (`PILL_PAD` en
  `locationGenerator.js`) y el lienzo crece con ella (`regenerateQuick` en `main.js`). El sticker de Fechas
  es el de título con `keepCase` (respeta minúsculas).
- Logo editable de AJT: «Sin fondo» por defecto (PNG transparente) o «Pastilla» del color de fondo de la
  combinación elegida (`ajtPill`, `ajtRound` en `ajtLogo.js`).
- Marcas dentro del texto (`src/engine/richText.js`, `parseRich`): `**negrita**`, color `[rojo]…[/rojo]`
  (blanco, negro, rojo, crema) y letra `[thunder]…[/thunder]` (roman, bold, thunder, black, playground; el
  `tag` de cada corte en `fontSets.js`). Se combinan y anidan; sin distinguir mayúsculas (el título las pasa
  a mayúsculas). Valen en textos, títulos, fechas, ubicación y títulos de plantillas: con marcas se dibujan
  por "runs" (cada trozo con su familia, peso y color, alineados por la línea base). En el panel (textos y
  también ubicación/foto con ubicación, `appendSelectionTools` en `propsPanel.js`): botones «Color de la
  selección», «Letra de la selección» y «Quitar formato (selección)». Si la familia no tiene
  un corte más grueso (Thunder, Black Condensed, PP Playground o ya en Bold) la negrita se simula con un
  trazo fino del mismo color.
- Logo de la pantalla de inicio: AJT Villalba compacto, original blanco.
- Foto de fondo del Diario Socialista: «Brillo» (campo `darken` de la capa = capa negra encima con
  opacidad); el control sale en las capas de imagen que traen `darken`.
- La medida de la tinta de los rótulos (`measureInkRatios`) y de la pastilla (`inkBounds`) lee píxeles del
  lienzo. Algunos navegadores/extensiones contra el rastreo alteran esa lectura (ruido o todo opaco): por
  eso hay umbral alto y plan B con métricas de texto. Síntoma si falla: ubicación/título con la letra 2,6
  veces más pequeña y desplazada hacia abajo.
- La sección «Comunidad» (Supabase) se quitó a propósito (2026-11-17): la app ya no usa ningún backend.
- Sombra difusa opcional (textos, logos y stickers): `src/engine/shadow.js` y `src/ui/shadowControls.js`. En los
  stickers rápidos el lienzo crece para que no se corte (`applyShadowMargin` en `main.js`). La pastilla existe
  siempre (oculta = sin fondo): la sombra se guarda en pastilla, texto y pin a la vez y se dibuja en la pastilla
  si se ve, o en el texto/pin si no (`coveredByPill` en `stageRenderer.js`).
- Pantalla «Fondos» → «Degradado de legibilidad» (negro → transparente, PNG 1080×1920): `src/engine/gradient.js`,
  `src/templates/gradient.js`, `src/ui/gradientPanel.js`.
- Todos los stickers se descargan con un 6 % de margen transparente y centrados en un cuadrado (`src/lib/pad.js`;
  Instagram pintaba de blanco la transparencia en algunos móviles). El fondo vertical opaco lleva `noPad`.
- Interfaz sencilla: paneles únicos, sin controles redundantes, sin emojis ni degradados («plana de taller»).
- Si dice que va lento: comprobar primero que se reinició el servidor y se recargó la página.
