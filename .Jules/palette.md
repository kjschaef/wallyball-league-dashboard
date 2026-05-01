## 2024-04-13 - Floating Action Button (FAB) Enhancements
**Learning:** Icon-only FABs are frequently implemented without ARIA labels, `aria-expanded` state, or proper keyboard focus styles. The lack of a clear "close" state when the menu is open can be confusing.
**Action:** When working with FABs or dropdown toggles, always ensure:
1. They have an explicit `aria-label` or visually hidden text.
2. They reflect their state using `aria-expanded`.
3. They provide explicit keyboard focus styles (e.g. `focus-visible:ring`).
4. Micro-interactions like an icon rotating (e.g. `rotate-45` on a `<Plus />` to form an `X`) provide immediate, intuitive feedback to users.
## 2024-05-18 - ARIA labels for Icon-Only Buttons
**Learning:** Icon-only buttons often lack accessible text, causing screen readers to announce them improperly. It is crucial to check all Button instances with size="icon" and ensure they include aria-label attributes describing their action, not just visual hints.
**Action:** When adding or auditing icon-only components, verify the presence of explicit aria-label properties so their functionality is accessible.

## 2024-05-19 - Accordion State with aria-expanded
**Learning:** When using custom `div` elements with `role="button"` as accordion toggles, they must explicitly communicate their expanded/collapsed state to screen readers.
**Action:** Ensure all custom toggle elements update `aria-expanded="true|false"` dynamically based on their current state.

## 2024-05-20 - Keyboard Accessibility for role="button"
**Learning:** Custom interactive elements using `role="button"` (e.g. div or span elements acting as buttons) often lack visual focus indicators and can cause unintended scrolling when activated with the Space key. This makes them difficult to use for keyboard-only users.
**Action:** When implementing custom interactive elements with `role="button"`, always ensure:
1. They include explicit focus styles (e.g. `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`).
2. They call `e.preventDefault()` within the `onKeyDown` handler when the Space key is pressed to avoid unwanted page scrolling.
3. They utilize `aria-disabled` for unselectable or disabled states.

## 2024-05-18 - Nested Interactive Elements

**Learning:** Replacing custom `<div role="button">` containers with native semantic `<button>` elements is highly effective for accessibility. It prevents nested interactive element issues (e.g., `<button>` inside `<div role="button">`) and ensures native keyboard support without manual `tabIndex` or `onKeyDown` listeners.
**Action:** When refactoring interactive containers, use a native `<button>` and apply `w-full text-left` to preserve layout. Convert any previously clickable inner elements (like toggle icons) to non-interactive decorative elements (e.g., `<span aria-hidden="true">`).

## 2024-05-21 - Toggle Button Accessibility
**Learning:** Components acting as selectable or toggleable options (like player selection buttons) often map visual cues (e.g. background color changes) to indicate selection but fail to communicate this state to screen readers.
**Action:** When implementing toggle buttons or selectable chips, always include `aria-pressed={boolean}`. This explicitly tells assistive technologies whether the button is currently in a pressed (selected) or unpressed state. Also ensure they have keyboard focus states (`focus-visible:ring`).
