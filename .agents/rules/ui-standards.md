# PdfFlow UI Standards

Enforced design rules for this workspace. Apply automatically to all UI/UX work.

## 1. No Emoji Icons (Critical)
❌ NEVER use emoji characters (☀️ 🌙 ☰ ✕ ▼ 📄 🚀) as UI icons, buttons, or indicators.
✅ ALWAYS use inline SVG icon components (stroke-based, 24x24 viewBox, aria-hidden="true").
✅ Preferred icon sets: Heroicons, Lucide, or custom inline SVG.
✅ Icon buttons must have aria-label on the <button> element.

## 2. Design System Variables
The design system lives in `design-system/pdfflow/MASTER.md`.
Always check it before starting any UI work. Never reference colors or fonts not defined there.
CSS variables that are currently defined and available:
- `--accent` (#D4AF37 gold) — primary CTA color
- `--accent-warm` (#E8C547)
- `--color-teal` (#14b8a6) — status/data only, not brand
- `--color-cyan` (#22d3ee) — status/data only
- `--color-indigo`, `--color-purple`

## 3. Font Stack
Primary body font: **Plus Jakarta Sans** (SaaS-optimized, recommended by ui-ux-pro-max).
Heading font: **Poppins** (weights 400–900 loaded).
Both are loaded in `client/app/layout.js`.

## 4. Brand Color Coherence
- Gold (`--accent`) is the ONLY brand CTA color — use for buttons, links, hover accents, gradient text.
- Teal/cyan is for data, progress bars, and status indicators ONLY — not for brand identity.
- Do not mix teal hovers on gold-branded cards.

## 5. Cursor Pointer
ALL clickable elements (cards, buttons, links that look like buttons) must have `cursor: pointer`.

## 6. Transition Timing
All hover/interactive transitions must be 150–300ms. Use `cubic-bezier(0.22, 1, 0.36, 1)` for
premium feel (spring-like). Never use instant state changes.

## 7. No Placeholder Copy
Never use lorem ipsum text. All section subtitles and body copy must be real, descriptive content.

## 8. prefers-reduced-motion
All CSS animations must be wrapped with a `@media (prefers-reduced-motion: reduce)` block
that disables them. This is already in globals.css — preserve it.

## 9. Light Mode Contrast
In light mode (`.light` class on `<html>`):
- Body text minimum: `#0f0f14` (slate-950 equivalent)
- Muted text minimum: `#4a4a6a` — never lighter than this
- Card backgrounds: `rgba(255,255,255,0.88)` or higher opacity
- Borders: `rgba(0,0,0,0.09)` minimum visibility

## 10. Hero Background Atmosphere & Glow
- Hero backgrounds should use deep midnight navy bases (`#03050a` / `#0d152a`) rather than flat black.
- Use layered radial gradients with `mix-blend-mode: screen` and heavy Gaussian blurs (`50px–80px`) for ethereal light beams.
- Slat / perspective rays should employ gradient fills with subtle beveled stroke edges (`0.8px` opacity `0.12–0.18`) to give tactile 3D depth.
- Always maintain a soft top vertical fade mask into the deep backdrop so headlines retain maximum readability (WCAG AA contrast).
