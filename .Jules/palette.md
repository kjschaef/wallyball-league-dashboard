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
## 2025-05-19 - Keyboard Accessibility for Custom Buttons
**Learning:** When using custom `div` elements as buttons (e.g. `role="button"`), it's critical to capture Spacebar interactions within the `onKeyDown` handler to prevent default behavior. Otherwise, pressing Space to activate the "button" causes an unwanted page scroll, breaking the expected UX. Additionally, explicit `focus-visible` styles and accurate `aria-disabled` attributes are essential for robust keyboard accessibility on these elements.
**Action:** Always include `e.preventDefault()` for Space/Enter keys in custom button `onKeyDown` handlers, and verify focus styles/ARIA attributes are present and responsive to the component's interactive state.
