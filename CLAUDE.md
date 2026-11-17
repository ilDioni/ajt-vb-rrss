# Stories AJT — notas para Claude

Responde en castellano, con lenguaje sencillo: el usuario no es programador.

App web (PWA) para hacer stories y stickers de Instagram con la identidad de AJT (Asamblea de la Juventud
Trabajadora) sin Photoshop. Solo AJT: CJS y OES se quitaron a propósito (2026-11-17), no volver a añadirlos.
Repo ilDioni/ajt-vb-rrss, rama main; si GitHub Pages está activado se sirve en
https://ildioni.github.io/ajt-vb-rrss/. Actualizar = commit + `git push` **solo cuando el usuario lo pida**.

- Probar en local: `python devserver.py` (puerto 5500, también desde el móvil por la IP de la red).
- Archivos clave: `src/main.js`, `src/engine/stageRenderer.js`, `src/engine/fontSets.js` (tipografías y
  paleta de AJT), `src/templates/` (plantillas, ubicación, logo AJT), `src/ui/` (interfaz).
- Colores (manual de AJT): rojo #ff002c, crema #f3f3e8, negro #000000, blanco #ffffff.
- En los stickers de ubicación NO hay color libre: solo los colores de AJT.
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
- Negrita con `**así**` también en títulos (stickers de título/fecha, ubicación y títulos de plantillas):
  esos textos se dibujan por "runs" como el cuerpo. Si la familia no tiene un corte más grueso (Thunder,
  Black Condensed, PP Playground o ya en Bold) la negrita se simula con un trazo fino del mismo color.
- Logo de la pantalla de inicio: AJT Villalba compacto, original blanco.
- La sección «Comunidad» (Supabase) se quitó a propósito (2026-11-17): la app ya no usa ningún backend.
- Interfaz sencilla: paneles únicos, sin controles redundantes, sin emojis ni degradados («plana de taller»).
- Si dice que va lento: comprobar primero que se reinició el servidor y se recargó la página.
