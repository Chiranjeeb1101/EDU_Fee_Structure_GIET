# Design System Specification: The Luminous Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Nebula"**
This design system moves away from the static, rigid "spreadsheet" feel of traditional fintech. Instead, it treats the interface as a living, breathing ecosystem of data. We achieve a "High-End Editorial" experience by utilizing high-contrast typography, intentional asymmetry, and deep, atmospheric layering. The goal is to make the user feel like they are navigating a premium private wealth terminal—sophisticated, fast, and weightless. 

By breaking the traditional grid with overlapping 3D isometric elements and shifting backgrounds, we move beyond "standard UI" into a signature digital experience where data doesn't just sit on a screen; it glows within a space.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in the "Midnight" spectrum, designed to reduce eye strain while conveying a sense of infinite depth.

### Core Palette (Material Design Tokens)
*   **Surface/Background:** `surface` (#090e1c) to `surface_container_low` (#0d1323).
*   **Primary Accents:** `primary` (#90abff) and `primary_dim` (#316bf3).
*   **Secondary Accents:** `secondary` (#af88ff) and `secondary_fixed_dim` (#d0b8ff).
*   **Tertiary/Alerts:** `tertiary` (#47c4ff) and `error` (#ff716c).

### The "No-Line" Rule
Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a transaction list in `surface_container_high` (#181f33) should sit directly on a `surface` (#090e1c) background. Let the tonal shift define the edge, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Base:** `surface_dim` (#090e1c) for the global canvas.
2.  **Sectioning:** `surface_container_low` (#0d1323) for large layout blocks.
3.  **Interaction Hubs:** `surface_container_highest` (#1e253b) for active cards or modals.

### The Glass & Gradient Rule
To provide "visual soul," all primary CTAs must use a linear gradient: `primary_fixed` to `primary_dim`. Use Glassmorphism (`surface_variant` at 10% opacity with a 20px backdrop blur) for floating navigation bars and overlaying widgets to ensure the "Nebula" background remains visible.

---

## 3. Typography
We utilize a dual-font strategy to balance high-end editorial authority with functional clarity.

*   **Display & Headlines (Plus Jakarta Sans):** Used for "Hero" moments and large data points. Bold weights only. This font communicates modernism and premium intent.
    *   *Display LG:* 3.5rem (Use for account totals).
    *   *Headline MD:* 1.75rem (Use for section headers).
*   **Body & Labels (Manrope):** A highly legible sans-serif for functional data.
    *   *Body LG:* 1rem (Primary reading text).
    *   *Label SM:* 0.6875rem (Uppercase, tracked out +10% for metadata).

**Editorial Hint:** Use `display-sm` for secondary metrics to create a clear visual hierarchy against standard `body-md` text.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by stacking `surface-container` tiers. Place a `surface_container_lowest` (#000000) card on a `surface_container` (#13192b) section to create a "sunken" effect, or a `surface_bright` (#242b43) card for a "raised" effect.

### Ambient Shadows & Neon Glow
When a floating effect is required (e.g., a hovered card):
*   **Shadow:** Use a blur of 40px, 8% opacity, using the `primary_dim` color as the shadow tint. This mimics a neon glow rather than a grey shadow.
*   **Ghost Border:** For accessibility, use a 1px border using `outline_variant` at 20% opacity. Forbid 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary (Pill):** Full `roundedness-full`, gradient fill (`primary_fixed` to `primary_dim`). White text (`on_primary_fixed`).
*   **Secondary (Glow-Stroke):** Pill shape, transparent background, 1px `primary` border with a 4px outer glow of the same color.

### Input Fields
*   **Style:** `surface_container_highest` background, `roundedness-md`.
*   **Focus State:** The border transitions to a `secondary` neon glow, and the internal icon shifts to `tertiary` (#47c4ff).

### Cards & Lists
*   **The Divider Ban:** Strictly forbid `<hr>` or border-bottom dividers. Use `spacing-6` (2rem) of vertical white space or a subtle shift from `surface_container` to `surface_container_high` to separate items.

### Floating Metrics (Signature Component)
*   3D Isometric cards that slightly overlap grid boundaries. These use `Glassmorphism` (10% opacity) with a `1px white` border at 15% opacity to catch "light" at the edges.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use intentional asymmetry. A 2-column layout should have a 60/40 split to feel like a high-end magazine rather than a generic dashboard.
*   **Do** use `primary` and `secondary` gradients for all data visualizations (charts/graphs).
*   **Do** leverage `spacing-16` (5.5rem) for major section breathing room.

### Don't:
*   **Don't** use pure white (#FFFFFF) for body text; use `on_surface_variant` (#a6aabf) to maintain the dark-mode atmosphere.
*   **Don't** use standard drop shadows. If it doesn't look like light bleeding from a neon source, it's too heavy.
*   **Don't** use square corners. This system lives in the `roundedness-md` (1.5rem) to `full` range to maintain a fluid, organic feel.