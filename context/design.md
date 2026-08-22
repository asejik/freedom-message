\# Design System Specification (design.md)

Last Updated: 2026-05-03



\## Design Philosophy

This system is a "Spotify for Sermons"—light, calm, fast, reverent, and modern. It combines Apple Music’s clarity, Stripe’s structure, and Framer‑level motion within a bright, glassmorphism shell. The emotional tone is trustworthy and effortless; it feels like a sacred library made instantly searchable. 



The UX intention is driven by \*\*frictionless discoverability\*\*. Users should never feel overwhelmed by data. The UI must guide them smoothly from natural language search to immediate, uninterrupted audio playback.



\---



\## Color System



\### Primary Colors

\*   \*\*Primary:\*\* `oklch(0.45 0.2 260)`

&#x20;   \*   \*Visual Role:\* Deep but soft blue.

&#x20;   \*   \*Usage:\* Primary CTAs, active states, progress bar fills, highlighted search terms.

\*   \*\*Secondary:\*\* `oklch(0.85 0.1 85)`

&#x20;   \*   \*Visual Role:\* Gentle gold.

&#x20;   \*   \*Usage:\* "Simulated Live" indicators, spiritual emphasis, special event badges.

\*   \*\*Accent:\*\* `oklch(0.6 0.15 250)`

&#x20;   \*   \*Visual Role:\* Soft interactive blue.

&#x20;   \*   \*Usage:\* Hover states, focus rings, subtle background gradients.



\### Neutral Colors

\*   \*\*Background:\*\* `oklch(0.98 0.01 260)`

&#x20;   \*   \*Visual Role:\* Soft off-white base with a very light cool/cream tint.

\*   \*\*Surface (Card):\*\* `oklch(0.99 0.005 260)`

&#x20;   \*   \*Visual Role:\* Near-white for glassmorphism panels.

\*   \*\*Muted:\*\* `oklch(0.92 0.02 260)`

&#x20;   \*   \*Visual Role:\* Soft grey for secondary backgrounds and disabled states.

\*   \*\*Border:\*\* `oklch(0.85 0.02 260)`

&#x20;   \*   \*Visual Role:\* Low-contrast dividers and card outlines.



\### Usage Rules

\*   \*\*Contrast Hierarchy:\*\* Never place primary blue text on a primary blue background. Ensure text on glass panels maintains WCAG AA contrast (≥ 4.5:1).

\*   \*\*Lightness Relationships:\*\* Background is the darkest neutral; Surfaces (cards) sit above it (lighter); Muted is used to push elements back.

\*   \*\*Glassmorphism:\*\* Use `backdrop-filter: blur(12px)` paired with a translucent Surface color (e.g., `rgba(255,255,255,0.6)`) for the search bar and persistent player.



\---



\## Token Mapping (global.css)

```css

:root {

&#x20; /\* Base Backgrounds \*/

&#x20; --background: oklch(0.98 0.01 260);

&#x20; --foreground: oklch(0.2 0.02 260);



&#x20; /\* Surfaces \& Cards \*/

&#x20; --card: oklch(0.99 0.005 260 / 0.6); /\* Glass base \*/

&#x20; --card-foreground: oklch(0.2 0.02 260);

&#x20; 

&#x20; /\* Brand Colors \*/

&#x20; --primary: oklch(0.45 0.2 260);

&#x20; --primary-foreground: oklch(0.99 0.01 260);

&#x20; 

&#x20; --secondary: oklch(0.85 0.1 85);

&#x20; --secondary-foreground: oklch(0.2 0.05 85);



&#x20; --accent: oklch(0.95 0.05 250);

&#x20; --accent-foreground: oklch(0.3 0.15 260);



&#x20; /\* UI Elements \*/

&#x20; --muted: oklch(0.92 0.02 260);

&#x20; --muted-foreground: oklch(0.5 0.02 260);

&#x20; 

&#x20; --border: oklch(0.85 0.02 260);

&#x20; --input: oklch(0.9 0.02 260);

&#x20; --ring: oklch(0.45 0.2 260 / 0.4);

}

```



\*Rules:\*

\*   Maintain the cool hue range (250-260) for brand cohesion.

\*   Use the gold hue (85) strictly for "Live" emphasis.



\---



\## Layout System



\### Container

\*   \*\*Max Width:\*\* `1200px` for desktop hero and list views.

\*   \*\*Padding:\*\* Mobile `1rem` (16px), Tablet `2rem` (32px), Desktop `4rem` (64px).



\### Grid

\*   \*\*Columns:\*\* Mobile (1), Tablet (2), Desktop (3 or 4 for sermon lists).

\*   \*\*Gap:\*\* `1.5rem` (24px) standard, `2rem` (32px) for major sections.



\### Spacing Scale

\*   \*\*Section Spacing:\*\* `120px` (desktop), `80px` (mobile).

\*   \*\*Component Spacing:\*\* `16px` (tight), `24px` (standard), `32px` (loose).



\---



\## Elevation \& Surfaces



\*   \*\*Card Styles:\*\* Glassmorphism base. Very slight white fill (`rgba(255,255,255, 0.4)`) with a 1px solid white inner border (`rgba(255,255,255, 0.8)`).

\*   \*\*Shadows:\*\* Soft, low contrast, wide spread.

&#x20;   \*   `sm`: `0 2px 8px oklch(0.2 0.02 260 / 0.04)`

&#x20;   \*   `md`: `0 8px 24px oklch(0.2 0.02 260 / 0.06)`

&#x20;   \*   `lg`: `0 24px 60px oklch(0.2 0.02 260 / 0.08)`

\*   \*\*Surface Hierarchy:\*\* Search Bar (Top) > Persistent Player (Floating) > Cards (Grid) > Background.



\---



\## Border Radius

\*   `sm`: `6px` (Tags, badges)

\*   `md`: `12px` (Inputs, standard buttons)

\*   `lg`: `16px` (Sermon cards, dialogs)

\*   `xl`: `24px` (Hero containers, persistent player)



\---



\## Components (High-Level)



\### Buttons

\*   \*\*Primary:\*\* Pill shape (`9999px` radius). Solid `--primary` fill. `--primary-foreground` text.

&#x20;   \*   \*Hover:\* Scale `1.03`, ease-out `160ms`. Add `--ring` box-shadow.

\*   \*\*Secondary:\*\* Outline style. 1px `--border`. No fill.

&#x20;   \*   \*Hover:\* `--accent` background fill.



\### Cards

\*   \*\*Layout:\*\* Image/Icon top, Title middle, Meta (Date/Preacher) bottom.

\*   \*\*Padding:\*\* `1.5rem` (24px) internal.

\*   \*\*Hover Behavior:\*\* Lift `translateY(-4px)`, shadow transitions from `md` to `lg`.



\### Inputs (Search Bar)

\*   \*\*Style:\*\* Glass pill. `12px` blur. Left search icon.

\*   \*\*Focus State:\*\* 2px solid `--primary` border. Background opacity increases slightly for text legibility.



\---



\## Visual Rules

\*   \*\*Image Style:\*\* Real, high-quality, desaturated photography for series covers. No cartoon illustrations.

\*   \*\*Icon Style:\*\* 2px stroke width, rounded caps, single SVG set (e.g., Lucide).

\*   \*\*Consistency:\*\* Keep backdrop blur constrained to interactive surfaces to prevent low-end mobile lag.



\---



\## Design Intent

This system works because it relies on strict typographical hierarchy and generous whitespace rather than heavy structural borders. The light glassmorphism creates a feeling of depth and modernity without feeling "heavy" or distracting from the core content: the sermons. The minimal use of color ensures that when the "Simulated Live" gold appears, it commands immediate attention.



\---



\## Rules to NEVER Break

\*   No more than the defined 5 core color concepts.

\*   No inconsistent spacing (stick strictly to the 8px/16px/24px/32px scale).

\*   No random font usage (stick to the defined Sans-serif stack).

\*   Maintain hierarchy via size and contrast, never via decoration.

