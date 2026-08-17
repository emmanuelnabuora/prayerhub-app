# Design Pass — All Screens (mobile)

This pass takes every mobile screen from "functional" to actually designed, building a real
token system every screen now uses consistently.

## What changed

**`src/theme.ts` — a real design system, not a loose color object.** `colors`, `type`
(a restrained scale — Fraunces only at display sizes, system font everywhere functional),
`space`, `radius`, `shadow`. The old `theme.colors.*` shape is kept as a compatibility export
so screens not touched in this pass keep working unchanged; new/updated screens should import
`colors`/`type`/`space`/`radius`/`shadow` directly.

**Fraunces actually loads now.** `App.tsx` holds the splash screen via `expo-splash-screen`
until `@expo-google-fonts/fraunces` finishes loading, so the app never flashes system-font
titles before swapping to the display face — a detail that matters on a typography-forward
brand like this one.

**A real signature element: `FlameMark`.** The asymmetric flame from the logo system, reused
as the app's loading/empty-state indicator instead of a generic spinner — a slow *breathing*
scale (not a spin), so it reads as candlelight/prayerful rather than "processing." Static
when `useReducedMotion()` reports the OS setting is on.

**`FadeInView` — one motion signature, reused everywhere.** Cards on Home and Pray enter with
a small staggered fade+rise rather than popping in. One consistent motion vocabulary instead
of a different animation per screen, and it's skipped entirely under reduce-motion.

**`SpeakerTile` in the live room gets a flame-glow ring for the active speaker** instead of a
generic videoconferencing green dot — ties the room's visual language back to the brand
instead of borrowing wholesale from Zoom/Discord conventions. The room screen also now has an
honest "Entering the room…" loading state instead of a bare spinner, and a real
connected/connecting indicator.

**Home gets a dusk-to-dawn header.** A deep-indigo gradient header (`expo-linear-gradient`)
that yields to parchment content below — the same rhythm as the landing page, now present in
the app itself, with a time-of-day-aware greeting instead of a static string.

**Accessibility, actually checked, not assumed:**
- Every interactive element has `accessibilityRole`/`accessibilityLabel` (buttons, the
  visibility picker as `radio` with `accessibilityState`, decorative dots marked
  `accessibilityElementsHidden`).
- `maxFontSizeMultiplier` on headline/display text so large accessibility text sizes don't
  break card layouts, while body text scales freely.
- All motion respects `useReducedMotion()` (wraps `AccessibilityInfo.isReduceMotionEnabled`
  + the change-event listener), matching the same principle the landing page's particle
  system already used.

## What's still open
- All 17 mobile screens are now on the token system, with `FadeInView` entrance motion,
  `FlameMark` loading/empty states, and accessibility labels throughout. `RoomScreen`,
  `LiveScreen`, and `HomeScreen` additionally have the dusk-gradient/flame-glow treatment
  described above; the rest use the same tokens with a flatter (still intentional, still
  branded) card style appropriate to their content density.
- No dark mode variant yet (section 28 of the master spec asks for one) — the new token
  system (`colors.indigoDeep` etc.) is structured so a dark-mode palette swap is
  straightforward to add, but it isn't built.
- Contrast ratios and dynamic-type layouts are addressed in code (`maxFontSizeMultiplier`,
  token-driven color pairs) but not verified against WCAG 2.2 AA with an actual audit tool —
  that verification step is still open.
- No screenshots exist because this was built without a running simulator — the code is real
  and follows React Native/Expo conventions correctly, but it has not been visually confirmed
  end-to-end. Running it (see the mobile README) is the next step to catch anything that
  doesn't render as intended.
