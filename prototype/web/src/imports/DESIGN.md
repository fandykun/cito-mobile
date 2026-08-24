---
name: Modern Minimalist Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#45464d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  charcoal-text: '#1E293B'
  border-subtle: '#E2E8F0'
  digital-teal: '#0D9488'
  error-red: '#E11D48'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The brand personality is defined by **minimalist precision** and **refined efficiency**. It moves away from the traditional medical aesthetic toward a high-end SaaS feel that prioritizes cognitive ease and visual airiness. The target audience—professionals requiring rapid data processing—benefits from a UI that feels "light" despite its functional depth.

The design style is **Minimalism** with a **Flat** execution. It relies on significant whitespace, a constrained color palette, and high-quality typography to communicate hierarchy. By removing all heavy shadows and gradients, the interface achieves a "breathable" quality that reduces user fatigue. Sections are defined by generous margins or ultra-thin lines, creating a structured but uncluttered environment.

- **Tone:** Professional, calm, and hyper-focused.
- **Visual Motif:** Clean horizontal planes, precise alignment, and subtle accent highlights.
- **Philosophy:** Content-first design where the UI recedes to let data and actions lead.

## Colors

The palette transitions to a high-contrast, modern scheme designed for maximum legibility.

- **Primary (#0F172A):** A deep charcoal-navy used for primary text and high-priority branding elements. This provides the "weight" in an otherwise light interface.
- **Secondary / Accent (#0D9488):** A vibrant digital teal. This is the sole chromatic driver for interactive elements, progress indicators, and focus states.
- **Neutral (#FAFAFA):** The foundation of the design system. This near-white background ensures a clean, sterile, and airy canvas.
- **Functional Grays:** Used sparingly for secondary text and thin dividers to maintain the minimalist aesthetic.

## Typography

This design system uses **Manrope** exclusively to maintain a cohesive, modern geometric look. The hierarchy is driven by **intentional weight contrast**—pairing ExtraBold/Bold headings with Regular weight body text to create immediate visual anchors.

**Key Principles:**
- **Headlines:** Use larger scales and tighter letter-spacing for a "display" feel that commands attention.
- **Body:** Maintains generous line-heights to support readability in data-heavy contexts.
- **Labels:** Utilizes slightly increased letter-spacing and SemiBold weights for quick scanning of metadata and tags.

## Layout & Spacing

The layout model is a **Fluid Grid** that emphasizes "airy" proportions. By increasing margins and gutters, the design avoids the cramped feel common in professional tools.

- **Desktop (1440px+):** 12-column grid with 40px external margins and 24px gutters. Content is often centered in a max-width container to prevent line-lengths from becoming excessive.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 20px margins.
- **Rhythm:** A strict 4px baseline. Components use `xl (48px)` spacing between major sections and `md (16px)` for internal component padding.

## Elevation & Depth

In line with the minimalist flat aesthetic, **shadows are strictly prohibited** for standard UI elements. Depth is communicated through:

- **Tonal Differentiation:** High-contrast background (#FAFAFA) vs. pure white (#FFFFFF) for interactive surfaces.
- **Thin Rules:** 1px borders in `border-subtle` (#E2E8F0) are used only when necessary to separate scrolling content.
- **Whitespace:** Elements are grouped by proximity rather than containment. Negative space is the primary tool for defining boundaries.
- **Overlays:** Only Modals or Menus may use a minimal, 1px border. Backdrop blurs (Glassmorphism) are used at a very low intensity (4px-8px) for overlays to maintain the airy feel without adding visual weight.

## Shapes

The shape language is **Rounded**, using a consistent 0.5rem (8px) corner radius for most components. This specific value bridges the gap between "technical/sharp" and "friendly/soft."

- **Standard (Buttons, Inputs, Cards):** 0.5rem (8px).
- **Large (Section Containers):** 1rem (16px).
- **Pill (Badges, Status):** 999px for a distinct, modern look.

## Components

### Buttons
- **Primary:** Solid `primary_color` (Deep Navy) with white text. No shadows or gradients. Rectangular with `rounded` (8px) corners.
- **Secondary:** Transparent background with a `digital-teal` label. No border unless the button is on a busy background.
- **Labels:** Always use `label-lg` for clarity and impact.

### Input Fields
- Background is a subtle `border-subtle` tint or pure white.
- Border is 1px and only becomes prominent on focus (changing to `digital-teal`).
- Labels sit above the field in `label-sm` (bold).

### Cards
- Pure white background (#FFFFFF).
- No shadow.
- Defined by either a 1px border (#E2E8F0) or simply by the contrast against the #FAFAFA background.
- Internal padding is consistently `lg (24px)`.

### Chips & Badges
- Used for status and tags. 
- High-contrast: A light tint of the category color with a dark, bold version of that color for text.
- Shape is always `full` (pill).

### Lists
- Separated by `border-subtle` top-borders only.
- High vertical padding (`md` to `lg`) to ensure data doesn't feel "crunched."
- Use `body-md` for primary list text and `body-sm` for supporting metadata.