## 2024-04-13 - Floating Action Button (FAB) Enhancements
**Learning:** Icon-only FABs are frequently implemented without ARIA labels, `aria-expanded` state, or proper keyboard focus styles. The lack of a clear "close" state when the menu is open can be confusing.
**Action:** When working with FABs or dropdown toggles, always ensure:
1. They have an explicit `aria-label` or visually hidden text.
2. They reflect their state using `aria-expanded`.
3. They provide explicit keyboard focus styles (e.g. `focus-visible:ring`).
4. Micro-interactions like an icon rotating (e.g. `rotate-45` on a `<Plus />` to form an `X`) provide immediate, intuitive feedback to users.
