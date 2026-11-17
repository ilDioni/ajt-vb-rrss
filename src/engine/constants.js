// Lienzo de trabajo: story de Instagram estándar
export const CANVAS_W = 1080;
export const CANVAS_H = 1920;

// Colores de AJT (los mismos que la paleta de fontSets.js)
export const COLORS = {
  black: '#000000',
  red: '#ff002c',
  white: '#ffffff',
};

// Proporciones estándar de publicaciones de Instagram para el marco de "compartido"
export const ASPECT_PRESETS = [
  { key: '4:5', w: 4, h: 5, label: '4:5' },
  { key: '5:4', w: 5, h: 4, label: '5:4' },
  { key: '1:1', w: 1, h: 1, label: '1:1' },
  { key: '3:2', w: 3, h: 2, label: '3:2' },
  { key: '2:3', w: 2, h: 3, label: '2:3' },
  { key: '16:9', w: 16, h: 9, label: '16:9' },
];
