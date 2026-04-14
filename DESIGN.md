# Design System Document: Editorial Modern for Pet Telehealth

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Apothecary"**

This design system moves away from the sterile, cold "medical blue" common in telehealth, shifting instead toward a high-end wellness magazine aesthetic. It blends the clinical authority of a modern veterinary practice with the warmth of a lifestyle brand.

The system is built on **Organic Editorialism**. We break the "template" look by utilizing intentional asymmetry, oversized display typography, and a "layered paper" approach to depth. Rather than a rigid grid of boxes, the UI should feel curated—using breathing room (negative space) and sophisticated tonal shifts to guide the eye. It is the intersection of cutting-edge AI precision and the tactile comfort of a premium print publication.

---

## 2. Color Strategy
Our palette is rooted in the "Midnight Forest & Terracotta" direction, designed to feel grounded, expensive, and deeply trustworthy.

### Core Palette
*   **Primary (Midnight Forest):** `#000B0B` (Primary) to `#0B2424` (Primary Container). This is our anchor. Use it for high-authority moments, headers, and deep-tonal backgrounds to signify expertise.
*   **Secondary (Terracotta):** `#9A442D` (Secondary) to `#E07A5F`. This is our "human" element. Use it for call-to-actions, urgent health alerts, and moments requiring warmth and empathy.
*   **Neutrals (Soft Sand & Sage):** `#FDFAE7` (Surface) and `#84A59D` (Tertiary). These provide the "editorial" canvas, moving away from stark white to a more sophisticated, parchment-like feel.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Layout boundaries must be defined solely through background color shifts. Use `surface-container-low` for secondary sections sitting on a `surface` background. 

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
*   **Level 1 (Base):** `surface` (`#FDFAE7`)
*   **Level 2 (Sectioning):** `surface-container-low` (`#F7F4E1`)
*   **Level 3 (Interactive Cards):** `surface-container-highest` (`#E6E3D0`)
Nesting these creates depth without the visual "noise" of lines.

### Signature Textures & Glassmorphism
To achieve the "Cutting-Edge AI" feel, use **Glassmorphism** for floating elements (e.g., chat bubbles or prescription overlays). Use a semi-transparent `surface-container-lowest` with a 20px backdrop blur. 
*   **Gradient Tip:** Apply a subtle radial gradient from `primary` (#000B0B) to `primary-container` (#0B2424) for Hero sections to add visual "soul" and dimension.

---

## 3. Typography
We use **Manrope** exclusively, but we manipulate its weights to create an editorial rhythm.

*   **Display (lg/md/sm):** 3.5rem to 2.25rem. Set in **ExtraBold**. Use these for high-impact headlines that feel like magazine mastheads. Tighten letter-spacing slightly (-2%).
*   **Headlines:** 2rem to 1.5rem. Set in **SemiBold**. These provide structure and authority.
*   **Title (lg/md/sm):** 1.375rem to 1rem. Set in **Medium**. Use for card headers and section titles.
*   **Body (lg/md/sm):** 1rem to 0.75rem. Set in **Regular**. Maximize readability with generous line heights (1.6).
*   **Labels:** 0.75rem. Set in **Bold / All Caps**. Use sparingly for metadata or categories to add a "technical" AI layer to the organic aesthetic.

---

## 4. Elevation & Depth
Hierarchy is achieved through **Tonal Layering** rather than structural geometry.

*   **The Layering Principle:** Instead of shadows, stack containers. Place a `surface-container-lowest` card on a `surface-container-low` background to create a soft, natural lift.
*   **Ambient Shadows:** When an element must float (e.g., a modal), use an ultra-diffused shadow: `Y: 20px, Blur: 40px, Color: On-Surface @ 5%`. The shadow should feel like a soft glow, not a dark drop.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` at **15% opacity**. Never use 100% opaque borders.
*   **Motion:** Layers should slide into place with a "weighted" ease-out (cubic-bezier 0.2, 0.8, 0.2, 1), mimicking the feel of heavy paper being moved.

---

## 5. Components

### Buttons
*   **Primary:** Fill `primary-container` (`#0B2424`), text `on-primary` (`#FFFFFF`). Shape: `xl` (1.5rem). High-contrast editorial weight.
*   **Action (CTA):** Fill `secondary` (`#9A442D`). Use for "Book a Vet" or "Emergency."
*   **Tertiary:** No background. `label-md` bold text with a 2px underline in `secondary-fixed-dim`.

### Cards & Lists
*   **Rule:** Absolutely no dividers. 
*   **Execution:** Separate list items using 16px of vertical white space or a 4px left-accent bar in `tertiary`. Cards should use `surface-container-high` to distinguish themselves from the background.

### Input Fields
*   **Style:** Minimalist. No enclosing box. Use a bottom-only border in `outline-variant` (20% opacity). On focus, transition to a `secondary` (Terracotta) underline.

### Specialized Component: "The Health Pulse"
A custom AI visualization component. Use a soft, undulating gradient mask between `primary-container` and `secondary-container` to represent real-time data or pet vitals. This bridges the gap between "Pet Care" and "Cutting-Edge Technology."

---

## 6. Do's and Don'ts

### Do
*   **Use Asymmetry:** Place a large Display-L headline off-center to create an editorial, "un-templated" feel.
*   **Embrace the Sand:** Treat the `surface` (#FDFAE7) as your primary canvas. It is warmer and more premium than pure white.
*   **Leverage Type Scale:** Use the contrast between ExtraBold displays and Regular body text to create a sense of storytelling.

### Don't
*   **Don't use 1px lines:** Do not use borders to separate content. Use space and color.
*   **Don't use "Bubbly" corners:** Stick to the `lg` (1rem) or `xl` (1.5rem) roundness tokens. Anything higher feels "toy-like"; anything lower feels "corporate."
*   **Don't crowd the content:** Telehealth can be stressful. Give every element "room to breathe"—double the standard spacing values you would use for a typical SaaS app.