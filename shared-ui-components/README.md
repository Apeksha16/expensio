# Expensio Shared UI Component Library

This directory contains standalone, pure HTML/Tailwind CSS prototypes of every single user interface component in the Expensio application. 

These components are designed to be framework-agnostic. Any other web project (HTML/JS, React, Angular, Vue, Svelte) can copy-paste the HTML structure and Tailwind classes to replicate the exact neobrutalist look and feel.

---

## Neobrutalist Design Foundations
To maintain visual consistency across projects:
1. **No rounded edges** (`rounded-none` everywhere).
2. **Solid 2px black borders** (`border-2 border-black` on inputs, buttons, cards, drawers).
3. **Flat offset box shadows** (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`).
4. **Bold, uppercase typography** using the **Poppins** font.
5. **High-contrast element backgrounds** (dark theme panels, white/gray form elements).

---

## Component Directory

| Component Showcase | Description |
|---|---|
| [`button.html`](button.html) | Forest green primary CTAs, loading states, outline/flat, module-themed buttons. |
| [`cards.html`](cards.html) | Stats blocks, progress bars, and module selection quick-action grids. |
| [`dropdown.html`](dropdown.html) | Fully styled drop-down select widgets with active/focus states and toggle logic. |
| [`input-box.html`](input-box.html) | Form text fields, disabled states, error validation styling, prefix/suffix (e.g. ₹ / INR). |
| [`popup.html`](popup.html) | Alert confirm dialogs with backdrop blur overlay and action trigger logic. |
| [`list-menu.html`](list-menu.html) | Sidebar navigation drawer with brand header and version/toolbar controls. |
| [`search-bar.html`](search-bar.html) | Neobrutalist filter input fields with absolute positioned search icons. |
| [`table.html`](table.html) | Transaction logs with category iconography, description labels, and pagination footers. |
| [`bottom-sheet.html`](bottom-sheet.html) | Slide-up bottom panel with touch-drag swipe-down close gesture physics (vanilla JS). |
| [`pin-input.html`](pin-input.html) | 4-digit code fields with keyboard auto-advance, backspace-to-previous, and paste handler. |
| [`amount-input.html`](amount-input.html) | Indian numbering system formatter (`Intl.NumberFormat('en-IN')`) with decimal controls. |
| [`toast.html`](toast.html) | Overlay toast alert notifications (success, error, info) with entry animations and auto-dismiss. |
| [`date-picker.html`](date-picker.html) | Horizontal scrollable month strip and grid-based calendar day picker. |
| [`dashboard-gauge.html`](dashboard-gauge.html) | Semicircular SVG gauge representing spent vs. limit percentages. |
| [`layout-shell.html`](layout-shell.html) | Combined mobile shell containing the top header, floating bottom navigation, and FAB. |
| [`skeleton-shimmer.html`](skeleton-shimmer.html) | Pulsing placeholder skeletons for async loading states. |

---

## Reusing in Other Projects (e.g., React / Next.js)

To adapt these components in other JSX-based frameworks like React:
- Convert HTML attributes (e.g. `class` → `className`, `onclick` → `onClick`, `inputmode` → `inputMode`).
- Translate inline script functions (found at the bottom of the `.html` files) into react hooks (`useState`, `useRef`, `useEffect`).
- Make sure to add the Google Font stylesheet link for **Poppins** in your project's `<head>`.
