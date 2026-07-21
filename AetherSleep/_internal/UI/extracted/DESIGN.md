---
name: Nocturne
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#f5f5ff'
  on-tertiary: '#283044'
  tertiary-container: '#d1d9f3'
  on-tertiary-container: '#575e75'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-timer:
    fontFamily: Sora
    fontSize: 80px
    fontWeight: '600'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 40px
  gutter: 24px
  section-gap: 64px
---

## Brand & Style

The design system is centered on a "Deep Space" aesthetic—a premium, futuristic environment designed to transition users from active work to restorative rest. The brand personality is professional yet ethereal, utilizing high-end visual effects to create a sense of vastness and calm. 

The style utilizes **Glassmorphism** as its primary structural driver, layering semi-transparent "frosted" panels over deep, dark gradients. This creates a sense of physical depth without visual clutter. Interactive elements feature subtle "glow" states—neon cyan and soft violet—to mimic bioluminescence or cockpit instrumentation, ensuring that the interface feels alive but never overstimulating.

## Colors

The palette is rooted in a "True Dark" philosophy to minimize blue light strain. 

- **Primary (Neon Cyan):** Used for critical timers, active states, and primary action glows. It represents clarity and the "active" phase of the countdown.
- **Secondary (Soft Violet):** Used for secondary accents, "sleep" modes, and transition states. It represents the "dream" phase and relaxation.
- **Background (Obsidian):** A base of `#020617` (Deep Obsidian) provides the infinite canvas.
- **Surfaces (Midnight Blue):** Semi-transparent layers of `#1E293B` with 40-60% opacity form the glass panels.
- **Accents:** Linear gradients transitioning from Primary to Secondary are used for progress bars and high-priority visualizations.

## Typography

This design system uses a trio of modern sans-serifs to establish a technical yet premium hierarchy. 

- **Sora** handles the heavy lifting for the countdown and headlines. Its geometric construction feels futuristic and authoritative.
- **Hanken Grotesk** is used for body text and descriptive settings, offering high readability and a contemporary, sharp edge.
- **Geist** is reserved for labels, metadata, and mono-spaced utility values (like time intervals), reinforcing the "developer-tool" precision of the sleep timer.

All large display text should utilize a subtle text-shadow glow (`0 0 20px rgba(0, 240, 255, 0.3)`) when the timer is active.

## Layout & Spacing

The layout follows a **Fixed Grid** approach for the desktop application, centered on a 12-column system to maintain a "dashboard" feel. 

- **Focus Area:** The central timer sits within a 6-column span in the middle of the screen, surrounded by generous negative space to minimize cognitive load.
- **Sidebars/Panels:** Floating glass modules are used for settings (Soundscapes, Fade-out duration). These modules use a 24px gutter.
- **Rhythm:** An 8px linear scale governs all padding and margins. Most components use 16px (2 units) or 24px (3 units) internal padding to maintain an airy, breathable aesthetic.

## Elevation & Depth

Depth is conveyed through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

1.  **Level 0 (Base):** Deep Obsidian `#020617`.
2.  **Level 1 (Panels):** Midnight Blue `#1E293B` at 40% opacity with a `20px` backdrop-blur. 1px stroke border in `#FFFFFF` at 10% opacity.
3.  **Level 2 (Active/Floating):** Midnight Blue at 60% opacity with a `40px` backdrop-blur. 1px stroke border in Primary Cyan at 20% opacity.

**Glows:** Instead of black shadows, use "Ambient Glows." Elevated elements should have a soft, low-opacity spread of the Primary or Secondary color (e.g., `box-shadow: 0 10px 40px -10px rgba(0, 240, 255, 0.15)`).

## Shapes

The design system adopts a **Rounded** profile to soften the technical futuristic aesthetic, making it feel more approachable for a sleep application.

- **Standard Elements:** 8px (`0.5rem`) for standard inputs and small containers.
- **Large Panels:** 16px (`1rem`) for the main timer container and glass cards.
- **Interactive States:** Buttons and toggles use a slightly more aggressive rounding (up to 32px for pills) to distinguish them as touch/click targets.
- **Borders:** All glass panels must have a 1px "inner-glow" border to define the shape against the dark background.

## Components

- **Main Timer Display:** Massive `display-timer` typography. When active, the numbers should have a breathing animation (slowly pulsing opacity from 80% to 100%).
- **Primary Buttons:** Pill-shaped with a gradient fill (Cyan to Violet). On hover, the button should "bloom" with an external glow.
- **Glass Cards:** Used for sound selection (e.g., "White Noise," "Rain"). Features a subtle hover state where the backdrop blur increases and the border brightness doubles.
- **Sliders (Volume/Fade):** Sleek, 4px height tracks. The "thumb" should be a 16px glowing cyan circle. The track behind the thumb uses the primary gradient; the track ahead is a muted dark blue.
- **Chips (Quick Select):** Used for preset times (15m, 30m, 1h). Semi-transparent background with a 1px border. Selected state uses a solid Primary Cyan border and text.
- **Input Fields:** Minimalist under-line inputs or very subtle 10% white background rectangles. Focus state triggers a bottom-border glow.
- **Visualizer:** A subtle, low-opacity waveform at the bottom of the screen that reacts to the "Soundscape" volume, rendered in soft Violet.