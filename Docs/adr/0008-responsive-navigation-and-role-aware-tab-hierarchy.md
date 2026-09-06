# Responsive Navigation and Role-Aware Tab Hierarchy

To streamline league navigation across desktop and mobile devices while maintaining domain language alignment:

1. **Desktop Navigation Alignment**:
   - The desktop navigation bar adopts a flat hierarchy exposing core surfaces: **Dashboard** (`/`), **Matches** (`/games`), **Results** (`/results`), and **Signups** (`/signups`).
   - The `/games` route is labeled **Matches** in adherence to the league ubiquitous language in `CONTEXT.md` (defining matches as multi-game contests and games as rounds within matches).
   - The legacy `/players` directory route is excluded from navigation in preparation for consolidation.
   - **Settings** (`/settings`) is role-aware and conditionally rendered only when the administrative session is active (`isAdmin === true`).

2. **Native App-Style Mobile Bottom Tab Bar**:
   - Mobile and small viewports replace the stacked vertical header with a fixed bottom tab bar inspired by native mobile applications (`fixed bottom-0 z-40`).
   - The mobile bottom bar displays 3 primary high-frequency destinations for league players: **Dashboard**, **Results**, and **Signups**, with dedicated touch targets (min 44px) and icons (`LayoutDashboard`, `Trophy`, `CalendarCheck`).
   - When Admin Mode is enabled, **Settings** is dynamically added as a 4th tab with a `Settings` icon.
   - **Matches** is excluded from the mobile bottom tab bar to maintain an ergonomic 3-to-4 tab density.

3. **Viewport Clearances & Contextual Linkage**:
   - The root layout container applies `pb-24 sm:pb-8` to guarantee that page content and scrollable tables are never obscured by the fixed bottom tab bar.
   - The floating action button (`FloatingActionButton`) elevates to `bottom-20 right-4 sm:bottom-6 sm:right-6` on mobile screens to float cleanly above the tab bar.
   - The Dashboard's Recent Matches card includes a contextual `"View all matches →"` link directing users seamlessly to `/games`.
