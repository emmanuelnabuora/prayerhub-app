// Design system for PrayerHubApp — extends the palette and mood established in
// the landing page / logo work: a dusk-to-dawn rhythm (deep indigo at rest,
// warm parchment for content), Fraunces serif for display type, and a warm
// flame accent that reads as both candlelight and gentle urgency (live rooms,
// primary actions). This file is the single source of truth other screens pull
// from — no screen should hardcode a hex value or font size directly.

export const colors = {
  // Core brand
  indigo: '#2B2A55',
  indigoDeep: '#1C1B3A',   // room backgrounds, dusk headers — darker than base indigo
  indigoSoft: '#4A4977',   // secondary text on dark surfaces
  parchment: '#F4EEE0',
  parchmentDeep: '#EAE1CC', // card-on-parchment contrast, pressed states
  flame: '#E8A15D',
  flameDeep: '#D6853A',    // pressed/active flame state
  flameGlow: 'rgba(232,161,93,0.35)', // for shadows/glows behind live indicators

  // Text
  text: '#1F1E33',
  textOnDark: '#F4EEE0',
  mutedText: '#8B8A9E',
  mutedTextOnDark: '#B3B1D6',

  // Semantic
  success: '#2E9B5F',
  danger: '#C0392B',
  live: '#D64545',

  // Surfaces
  card: '#FFFFFF',
  cardBorder: '#E7E1D2',
  divider: '#E2E0D5',
};

// A restrained type scale — Fraunces carries personality at display sizes only
// (titles, verse text, room names); everything functional (labels, buttons,
// metadata) stays on the system face so the app reads fast, not precious.
export const type = {
  fontFamily: {
    display: 'Fraunces_600SemiBold',
    displayItalic: 'Fraunces_500Medium_Italic',
    body: undefined as string | undefined, // system default
  },
  size: {
    xs: 12, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30,
  },
  lineHeight: {
    tight: 1.2, normal: 1.4, relaxed: 1.6,
  },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#1F1E33', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  flameGlow: {
    shadowColor: colors.flame, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
};

// No longer used by any screen as of the full design pass (docs/16-DESIGN-PASS.md) —
// kept only as a safety net so an old branch or a hastily-added screen that
// imports `theme.colors` doesn't hard-crash. Prefer colors/type/space/radius/shadow
// directly in all new code.
export const theme = {
  colors: {
    indigo: colors.indigo, parchment: colors.parchment, flame: colors.flame,
    mutedText: colors.mutedText, text: colors.text,
  },
  font: { display: type.fontFamily.display, body: 'System' },
};
