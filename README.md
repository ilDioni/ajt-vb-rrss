# Stories AJT

Generador interno de stories y stickers de Instagram con la identidad de marca de AJT (Asamblea de la Juventud Trabajadora): plantillas de repost, artículo (general y Diario Socialista) e imágenes, textos (título y cuerpo), stickers de ubicación y de fechas, logo editable y stickers temáticos. Los textos, las fechas y las ubicaciones pueden llevar una pastilla de fondo (sin fondo, blanco, negro, rojo o crema) con las esquinas más o menos redondeadas, y en todos los textos lo que va entre dobles asteriscos (`**así**`) sale en negrita. Funciona en el navegador, también en el móvil, y se puede instalar como app ("Añadir a pantalla de inicio").

## Probar en local

```bash
python devserver.py
```

Muestra la dirección para el ordenador y la del móvil (misma wifi).

## Publicación (GitHub Pages)

La app es estática: GitHub Pages la sirve tal cual desde la rama `main`, carpeta raíz (`Settings → Pages → Branch: main / (root)`).

Para actualizar la versión publicada basta con subir los cambios:

```bash
git push
```

En 1–2 minutos la web publicada se actualiza. El service worker pide siempre primero la versión nueva, así que en el móvil basta con recargar.

## Tipografías

- **Helvetica Neue** Roman (texto) y Bold (negrita del cuerpo, también el `**así**`).
- **Thunder** Extra Bold (títulos y rótulo de ubicación).
- **Helvetica Neue Black Condensed** (rótulo alternativo).
- **PP Playground** Medium (títulos caligráficos; respeta las minúsculas).

Todas con cursiva: las de Helvetica Neue y Thunder son reales; la de PP Playground es una oblicua de 12° generada a partir del corte recto. Las fuentes están en `assets/fonts/ajt` y se declaran en `src/fonts.css`; el juego se define en `src/engine/fontSets.js`. Ojo con las licencias: Helvetica Neue, Thunder y PP Playground son comerciales: revisa que puedas publicarlas.

## Colores de marca

Los del manual de la línea gráfica: blanco `#ffffff`, rojo `#ff002c`, negro `#000000` y crema `#f3f3e8`. Son los que salen en los botones de color (ubicación, textos, fondos y pastillas). Están en `src/engine/fontSets.js`.

## Logos

- `assets/logo/`: logo de AJT (icono y con texto) sobre blanco, negro y rojo, para las plantillas.
- `assets/logos/ajt/`: triángulos del logo editable con ubicación (`src/templates/ajtLogo.js`).
- `assets/logos/villalba/`: logo de AJT Villalba. La plantilla de **Artículo** lo lleva siempre abajo, centrado y fijo (no se mueve, ni se borra ni se oculta), en la versión alargada que toca según el color del fondo: blanco o crema → original negro; rojo → negro o blanco (a elegir); negro → original blanco o blanco (a elegir). Las reglas están en `src/templates/villalbaLogo.js`.
- `assets/logos/diario-socialista/`: cabecera «DIARIO SOCIALISTA» en blanco y en negro (la negra se generó a partir de la blanca).
- `assets/icons/icon-*.png`: iconos de la app, hechos a partir de `assets/logo/icon-on-black.png`.

## Plantilla Diario Socialista

Story para compartir artículos del diario (Plantillas → Diario Socialista): foto de fondo y la imagen del titular (captura de la web), ambas subidas por el usuario, la cabecera «DIARIO SOCIALISTA» en blanco o negro y el texto «Enlace de Instagram», que marca dónde poner el sticker de enlace (sale en el PNG, como en el Artículo general). Al subir la imagen del titular, su recuadro conserva el ancho y toma la proporción de la imagen, y la guía del enlace se coloca justo debajo. Está en `src/templates/builtins.js`.

## Stickers Huelga General 11N

Sección propia del menú con stickers de un solo color y el **fondo vertical 9:16** (`assets/stickers/huelga11n/`). Los stickers se pueden ver y descargar en el color original o en cualquiera de los colores de AJT (el PNG se recolorea a tamaño completo conservando la transparencia); el fondo se descarga tal cual. También hay descarga de todos en ZIP. Para añadir más: dejar el PNG en esa carpeta y añadir su línea en `src/templates/gallery.js` (`recolor: true` si es de un solo color).
