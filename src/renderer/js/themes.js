// Thèmes prédéfinis + application des réglages visuels sous forme de variables CSS.
import { hexToRgba, readableOn } from './util.js';

export const THEME_PRESETS = {
  hiphiphip: {
    label: 'Hourra classique', emoji: '🎈',
    colors: { primary: '#4aa8f0', accent: '#ffd25a', bg: '#ffffff', surface: '#ffffff', text: '#2c2c2e', muted: '#9aa0a6', header: '#ffffff', banner: '#4aa8f0', bannerText: '#ffffff', drawer: '#fafafa', border: '#e4e6ea', success: '#3cc47c', danger: '#f0563c', today: '#4aa8f0' },
  },
  nuit: {
    label: 'Nuit étoilée', emoji: '🌙',
    colors: { primary: '#7aa2ff', accent: '#ffcc66', bg: '#14161f', surface: '#1d2030', text: '#e8eaf2', muted: '#8c92a8', header: '#191c28', banner: '#3a4bb8', bannerText: '#ffffff', drawer: '#171a25', border: '#2c3044', success: '#4ade80', danger: '#ff6b6b', today: '#7aa2ff' },
  },
  bonbon: {
    label: 'Bonbon rose', emoji: '🍬',
    colors: { primary: '#ff6fae', accent: '#8be0ff', bg: '#fff5fa', surface: '#ffffff', text: '#4a2338', muted: '#b88aa2', header: '#ffffff', banner: '#ff6fae', bannerText: '#ffffff', drawer: '#fff0f7', border: '#ffd6ea', success: '#34c98e', danger: '#ff4f6d', today: '#ff6fae' },
  },
  foret: {
    label: 'Forêt zen', emoji: '🌿',
    colors: { primary: '#3f9b6b', accent: '#e9c46a', bg: '#f4f8f3', surface: '#ffffff', text: '#22322a', muted: '#86998d', header: '#ffffff', banner: '#3f9b6b', bannerText: '#ffffff', drawer: '#eef4ee', border: '#d6e4d9', success: '#2fa86a', danger: '#d9534f', today: '#3f9b6b' },
  },
  ocean: {
    label: 'Océan', emoji: '🌊',
    colors: { primary: '#0096c7', accent: '#ffb703', bg: '#eaf8ff', surface: '#ffffff', text: '#023047', muted: '#6a8fa3', header: '#ffffff', banner: '#0077b6', bannerText: '#ffffff', drawer: '#e3f4fb', border: '#c5e6f5', success: '#06d6a0', danger: '#ef476f', today: '#0096c7' },
  },
  neon: {
    label: 'Néon vibes', emoji: '🕹️',
    colors: { primary: '#00f5d4', accent: '#f15bb5', bg: '#0b0b1a', surface: '#141432', text: '#f1f1ff', muted: '#8a8ab8', header: '#0f0f26', banner: '#9b5de5', bannerText: '#ffffff', drawer: '#10102a', border: '#2a2a5a', success: '#00f5d4', danger: '#ff3c7e', today: '#f15bb5' },
  },
  sunset: {
    label: 'Coucher de soleil', emoji: '🌅',
    colors: { primary: '#ff7b54', accent: '#ffd56b', bg: '#fff6ef', surface: '#ffffff', text: '#3d2420', muted: '#b08f86', header: '#ffffff', banner: '#ff6b6b', bannerText: '#ffffff', drawer: '#fff0e6', border: '#ffdccb', success: '#43c59e', danger: '#e63946', today: '#ff7b54' },
  },
  licorne: {
    label: 'Licorne ché-per', emoji: '🦄',
    colors: { primary: '#b16cea', accent: '#ff8ec7', bg: '#fbf6ff', surface: '#ffffff', text: '#3a2850', muted: '#a593b8', header: '#ffffff', banner: '#c471ed', bannerText: '#ffffff', drawer: '#f6eeff', border: '#eadcfb', success: '#5ad8a6', danger: '#ff5e7e', today: '#b16cea' },
  },
  cafe: {
    label: 'Café cosy', emoji: '☕',
    colors: { primary: '#a0673f', accent: '#e8b86d', bg: '#f7f1ea', surface: '#fffaf4', text: '#3b2a20', muted: '#a08c7d', header: '#fffaf4', banner: '#8b5a3c', bannerText: '#fff8ef', drawer: '#f2e9de', border: '#e4d6c5', success: '#6a9f58', danger: '#c8553d', today: '#a0673f' },
  },
  matrix: {
    label: 'Matrix', emoji: '💻',
    colors: { primary: '#22e55c', accent: '#b6ff00', bg: '#050805', surface: '#0c140d', text: '#c8ffd2', muted: '#5f8f68', header: '#081008', banner: '#0f7a2e', bannerText: '#d8ffe0', drawer: '#070d08', border: '#163d1f', success: '#22e55c', danger: '#ff4545', today: '#22e55c' },
  },
  mono: {
    label: 'Minimal noir & blanc', emoji: '🖤',
    colors: { primary: '#222222', accent: '#888888', bg: '#ffffff', surface: '#ffffff', text: '#111111', muted: '#8a8a8a', header: '#ffffff', banner: '#111111', bannerText: '#ffffff', drawer: '#f6f6f6', border: '#e2e2e2', success: '#2e7d32', danger: '#c62828', today: '#111111' },
  },
  pastel: {
    label: 'Pastel doux', emoji: '🧁',
    colors: { primary: '#8ab6f9', accent: '#ffc8dd', bg: '#fdfcff', surface: '#ffffff', text: '#3f3d56', muted: '#a3a1b8', header: '#ffffff', banner: '#bde0fe', bannerText: '#2b2d42', drawer: '#f7f7ff', border: '#e8e6f7', success: '#95d5b2', danger: '#f4978e', today: '#8ab6f9' },
  },
};

export const COLOR_LABELS = {
  primary: 'Couleur principale',
  accent: 'Couleur d\'accent',
  bg: 'Fond de l\'app',
  surface: 'Cartes & fenêtres',
  text: 'Texte',
  muted: 'Texte secondaire',
  header: 'Barre du haut',
  banner: 'Bandeau motivation',
  bannerText: 'Texte du bandeau',
  drawer: 'Menu « Mes cours »',
  border: 'Bordures',
  success: 'Mission validée',
  danger: 'Suppression / alerte',
  today: 'Pastille du jour',
};

export const FONTS = {
  Inter: '"Inter Variable", "Segoe UI", sans-serif',
  Nunito: '"Nunito Variable", "Segoe UI", sans-serif',
  Fredoka: '"Fredoka Variable", "Segoe UI", sans-serif',
  'Comic Neue': '"Comic Neue", "Comic Sans MS", cursive',
  'Segoe UI': '"Segoe UI", sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  Consolas: 'Consolas, "Courier New", monospace',
  Pacifico: 'Pacifico, cursive',
  'Pixel (Press Start)': '"Press Start 2P", monospace',
};

export function applyTheme(settings) {
  const r = document.documentElement.style;
  const t = settings.theme;
  for (const [k, v] of Object.entries(t)) r.setProperty('--' + k, v);
  r.setProperty('--primary-soft', hexToRgba(t.primary, 0.12));
  r.setProperty('--primary-text', readableOn(t.primary));
  r.setProperty('--accent-soft', hexToRgba(t.accent, 0.5));
  r.setProperty('--today-text', readableOn(t.today));
  r.setProperty('--success-soft', hexToRgba(t.success, 0.15));

  const hasBg = settings.background.type !== 'none';
  const op = hasBg ? settings.surfaceOpacity : 1;
  r.setProperty('--surface-a', hexToRgba(t.surface, op));
  r.setProperty('--header-a', hexToRgba(t.header, hasBg ? Math.min(1, op + 0.05) : 1));
  r.setProperty('--drawer-a', hexToRgba(t.drawer, op));
  r.setProperty('--bg-a', hexToRgba(t.bg, hasBg ? 0 : 1));
  r.setProperty('--glass-blur', hasBg ? settings.glassBlur + 'px' : '0px');

  r.setProperty('--font', FONTS[settings.font] || FONTS.Inter);
  r.setProperty('--font-size', settings.fontSize + 'px');
  r.setProperty('--radius', settings.radius + 'px');
  document.body.dataset.cardStyle = settings.cardStyle;
  document.body.dataset.pixel = settings.font.startsWith('Pixel') ? '1' : '0';
}
