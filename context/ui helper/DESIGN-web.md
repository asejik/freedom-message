---
name: Citizens Library
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434751'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737782'
  outline-variant: '#c3c6d3'
  surface-tint: '#2d5da9'
  primary: '#00438e'
  on-primary: '#ffffff'
  primary-container: '#2a5ba7'
  on-primary-container: '#c3d6ff'
  inverse-primary: '#acc7ff'
  secondary: '#6c5d2b'
  on-secondary: '#ffffff'
  secondary-container: '#f4dea0'
  on-secondary-container: '#71612f'
  tertiary: '#6b3700'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e4b00'
  on-tertiary-container: '#ffcba5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#044590'
  secondary-fixed: '#f7e1a3'
  secondary-fixed-dim: '#dac589'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#534616'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77e'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system for this premium AI-powered sermon archive is rooted in a philosophy of **Sacred Modernism**. It balances the weight of timeless wisdom with the clarity of cutting-edge technology. The visual language is calm, reverent, and light-filled, ensuring that the interface never competes with the spiritual content it hosts.

The aesthetic leans heavily into **Glassmorphism** and **Minimalism**. By using semi-transparent layers and soft blurs, the UI feels ethereal and fast, mimicking the qualities of light passing through glass. The goal is to create a digital sanctuary—a quiet, focused environment that encourages deep listening and reflection.

## Colors
The palette is built on a foundation of "Atmospheric White," providing a soft, non-clinical backdrop that reduces eye strain during long reading or listening sessions.

- **Primary (Deep Blue):** Used for primary actions, active navigation states, and branding. It conveys stability, depth, and authority.
- **Secondary (Gentle Gold):** Reserved exclusively for "Live" indicators, premium highlights, and moments of spiritual significance. It should be used sparingly to maintain its impact.
- **Glass Surfaces:** These use a semi-transparent white base with a heavy backdrop blur. This allows the soft background color to bleed through, creating a sense of unified depth.
- **Text Tones:** Use varying opacities of the primary blue for text to maintain a monochromatic harmony, rather than pure blacks or greys.

## Typography
The system utilizes **Inter** exclusively to achieve a systematic, clean, and highly legible experience. High contrast is achieved through dramatic shifts in scale and weight rather than font mixing.

- **Headlines:** Use tight letter-spacing and heavy weights for a modern, "editorial" feel.
- **Body Text:** Optimized for readability with generous line-heights (1.6) to accommodate long-form sermon transcripts.
- **Labels:** Small caps or all-caps are used for metadata (e.g., Speaker names, Dates) to create a distinct visual texture compared to body content.
- **Mobile scaling:** On mobile devices, display type scales down while maintaining bold weights to ensure the "premium" feel is preserved in a compact viewport.

## Layout & Spacing
This is a **mobile-first** design system using a fluid grid. The layout prioritizes vertical flow and "thumb-friendly" interaction zones.

- **Grid:** 4-column grid for mobile, expanding to 12-columns for desktop.
- **Margins:** A standard 20px safe area on mobile ensures content doesn't feel cramped against the screen edges.
- **Rhythm:** Use an 8px base unit for all spacing. Consistent use of `lg` (40px) spacing between sections creates the "airy" and "calm" emotional response.
- **Safe Areas:** Navigation and primary actions should be anchored to the bottom of the screen on mobile, utilizing glass ribbons for persistence without blocking content.

## Elevation & Depth
Depth is created through **Backdrop Blurs** and **Tonal Layering** rather than traditional drop shadows.

- **Level 0 (Background):** The soft off-white base.
- **Level 1 (Cards/Surfaces):** `bg-white/60` with `backdrop-blur-md`. These surfaces should have a thin `1px` border of `white/80` to simulate the catchlight on the edge of a glass pane.
- **Level 2 (Floating Ribbons):** Used for navigation or "Now Playing" bars. These sit higher, featuring a subtle, extremely diffused `oklch(0.45 0.2 260 / 0.05)` shadow to distinguish them from the cards below.
- **Transitions:** Elements should feel light; use "fade and slide" transitions to reinforce the ethereal glass aesthetic.

## Shapes
The shape language is "Softly Geometric." We avoid the playfulness of pill-shapes in favor of a more sophisticated, architectural "Rounded" approach.

- **Primary Radius:** 0.5rem (8px) for standard buttons and input fields.
- **Large Radius:** 1rem (16px) for media cards and modal containers.
- **Media:** Album art and sermon thumbnails should always follow the `rounded-lg` (16px) rule to maintain a premium, app-like feel reminiscent of modern OS design.

## Components
- **Glass Ribbons:** Navigation bars and floating headers should use a continuous glass surface that spans the width of the viewport. Borders are only applied to the top or bottom edges to maintain a seamless look.
- **Premium Media Cards:** Similar to high-end music streaming apps. Images should be high-resolution with a subtle inner glow. Text is overlaid using a bottom-up gradient scrim or placed on a glass panel below the image.
- **Segment Controls:** These should be "In-set" controls. A recessed background container with a sliding glass "thumb" that moves between options.
- **Buttons:**
  - *Primary:* Solid Deep Blue with white text. No shadow, but a slight scale-down on press.
  - *Secondary:* Glass base with a Primary Blue border and text.
- **Sermon List Items:** High-density layouts featuring a small thumbnail, bold title, and metadata labels. Use "Gold" accents for "New" or "Live" badges.
- **Input Fields:** Minimalist design with only a bottom border that thickens and changes to Primary Blue on focus. Labels float above the field.