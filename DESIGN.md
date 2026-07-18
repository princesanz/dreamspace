# Design

Visual system for Dreamspace. Colors and fonts are pinned by the owner's spec (docs/SPEC.md §1–§2) — identity-preservation wins over greenfield rules.

## Color

| Token | Hex | Role |
|---|---|---|
| `--void` | `#030308` | Background + FogExp2 color (density 0.04) |
| `--cyan` | `#7fd8ff` | Primary accent: origin island, dust, active UI |
| `--violet` | `#b9a8ff` | Secondary accent: about station, links hover |
| `--violet-deep` | `#8f6bff` | Fresnel rim, gradients, panel accents |
| `--amber` | `#ffb45e` | Project monoliths, warm highlights |
| `--portal` | `#e8f6ff` | Portal white, headings, brightest text |
| `--text` | `#8f88b8` | Muted lavender body text (6.3:1 on void ✓ AA) |

Strategy: **Drenched dark** — the void IS the surface; accents are light emission, not paint. Additive-blended glow sprites carry color; UI chrome stays near-monochrome so the world glows brighter than the interface.

## Typography

- **Display**: Syne 700/800 — hero name, station headings. `clamp()` ceiling 6rem, letter-spacing ≥ -0.03em, `text-wrap: balance`.
- **Body/UI**: Space Grotesk 400/500 — body 16px/1.7 (light-on-dark gets +0.1 line-height), max 62ch.
- Kickers: Space Grotesk 500, 11px, tracked +0.18em — numbered station sequence (01–04) is a *real* ordered flight path, not decorative scaffolding.

## Motion

- Scroll→flight: target progress lerped at 0.06/frame — weighty, cinematic.
- Camera focus transitions: GSAP `power3.inOut`, 1.4s in / 1.1s out.
- UI enters: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo family), 500–700ms. No bounce, no elastic.
- Ambient: FOV breathing 62 ± 1.5 (~8s period), idle sway sin/cos, per-object rotation at varied speeds.
- `prefers-reduced-motion`: continuous flight OFF → camera eases between stations; overlays crossfade; comets/trail/sway/breathing OFF.

## Components

- **Station overlay**: fixed, proximity-faded, alternating alignment (hero left, about right, karya left, skills right, kontak center).
- **Monolith label**: 3D-anchored chip — name + index, cyan hairline border.
- **Focus panel**: right-side glass slab (blur is purposeful here: separates UI layer from the world it describes), slides in 560ms expo.
- **Progress rail**: 5 dots + rail fill at right edge; active dot 2× + glow.
- **Magnetic button**: pill, 1px hairline, pulls ≤ 8px toward cursor within 80px.
- **Cursor**: 4px dot + 28px lagged ring; ring expands 1.6× and fills 12% on interactives.

## Z-scale

`canvas 0 → vignette 1 → 3D-anchored labels 2 → station overlays 3 → chrome (nav/rail/audio) 5 → focus panel 6 → custom cursor 8 → preloader 9`
