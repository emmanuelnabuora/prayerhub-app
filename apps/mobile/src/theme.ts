// Design system for PrayerHubApp — Midnight Navy / Warm Gold / Ivory, per the
// premium audio-first Christian social direction (see product spec). Key names
// are kept from the prior indigo/parchment/flame system so every existing screen
// keeps working unchanged — only the underlying values moved to the new palette.
export const colors = {
  // Core brand
  indigo: '#071827',        // Midnight Navy — primary dark surface / accent
  indigoDeep: '#040F18',    // room backgrounds, deepest dusk headers
  indigoSoft: '#3A4A5C',    // secondary text on dark surfaces
  parchment: '#FBFAF6',     // Warm Ivory — light background
  parchmentDeep: '#F4EEE4', // Cream — card-on-ivory contrast, pressed states
  flame: '#C6923B',         // Warm Gold — primary accent
  flameDeep: '#A97A2E',     // pressed/active gold state
  flameGlow: 'rgba(198,146,59,0.35)', // gold glow behind live indicators
  // Text
  text: '#0F1E2B',          // near-black/navy
  textOnDark: '#FBFAF6',
  mutedText: '#6B7480',
  mutedTextOnDark: '#A9B4BE',
  // Semantic
  success: '#2E9B5F',
  danger: '#C0392B',
  live: '#D64545',
  // Surfaces
  card: '#FFFFFF',
  cardBorder: '#E8E2D3',
  divider: '#E2DED2',
};
// Fraunces carries the "elegant editorial serif" role at display sizes only
// (titles, verse text, room names); everything functional stays on the system
// sans-serif face so the app reads fast, not precious.
export const type = {
  fontFamily: {
    display: 'Fraunces_600SemiBold',
    displayItalic: 'Fraunces_500Medium_Italic',
    body: undefined as string | undefined, // system default (sans-serif)
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
    shadowColor: '#0F1E2B', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  flameGlow: {
    shadowColor: colors.flame, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
};
// No longer used by any screen as of the full design pass — kept only as a
// safety net so an old branch or a hastily-added screen that imports
// `theme.colors` doesn't hard-crash. Prefer colors/type/space/radius/shadow
// directly in all new code.
export const theme = {
  colors: {
    indigo: colors.indigo, parchment: colors.parchment, flame: colors.flame,
    mutedText: colors.mutedText, text: colors.text,
  },
  font: { display: type.fontFamily.display, body: 'System' },
};
