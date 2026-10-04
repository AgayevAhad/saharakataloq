---
trigger: always_on
---

# Project Rules & Workflow Constraints

## 1. User-Controlled Git Operations
- **NEVER commit or push to any branch unless the user explicitly requests that exact Git operation.**
- When the user explicitly requests a commit or push, execute it only for the branch or branches the user names after verifying the target refs and payload.
- Do not infer Git permission from implementation requests, completion language, or earlier Git approvals. Each later commit or push requires a new explicit user instruction.
- Never force-push, delete a branch, rewrite history, merge, rebase, or cherry-pick unless the user explicitly authorizes that exact operation and scope.

## 2. No Raw Sample / Example Media on GitHub
- Raw photo source folders (`Foto/`) and raw example specification files (`File/`) are reference samples and MUST NOT be committed or pushed to GitHub. Keep them ignored in `.gitignore`.
- Only production-optimized, clean web media placed in `public/media/` or uploaded via admin panel should be part of the application delivery.

## 3. Automated Test Coverage Mandate
- For EVERY new feature, database field, API route, admin component, or UI logic added, ALWAYS write corresponding automated unit or integration tests (Vitest / Node test runner).
- Tests must be executed and verified before concluding any task, without requiring explicit prompts from the user.

## 4. UI/UX Standards
- **Desktop Sticky Header**: The header (containing Sahara logo, brand dock, actions, and search bar) must stay sticky at the top of the viewport during scrolling with a smooth backdrop blur, allowing catalog content to pass smoothly underneath it.

## 5. Multiple Store/Showroom Addresses
- Full support for multiple store/showroom addresses in admin panel, database, and customer-facing components.

## 6. Admin Panel Synchronization & UX Quality
- Any new catalog feature, field, setting, brand, address, or model change MUST be fully supported and synchronized in the Admin Panel with intuitive UI, proper contrast, and end-to-end functionality.
- Admin Panel components must maintain strong color contrasts, reliable modal dialogs, and support both CSV and Excel (.xlsx) data exchanges.

## 7. Splash Screen & SSR Freshness Synchronization
- The initial splash screen (`#app-splash-screen`) and SSR rendering state MUST strictly match the latest active design tokens, theme modes (Light & Dark), and brand identity (Sahara spiral mark, Outfit typography).
- On browser refresh or initial load, stale/deprecated layout structures, old promo placeholders, or obsolete catalog information MUST NEVER flash or be visible before hydration. The server ISR cache and client hydration MUST immediately deliver the freshest live catalog state.

## 8. Strict Prohibition of Fake Data, Mock Reviews & Hallucinated Content
- Never inject, hardcode, or seed fake/synthetic user reviews, dummy customer ratings, or fictitious product descriptions into catalog products or public interfaces.
- If data does not exist in the database or has not been authored by an administrator, the interface MUST present clean, authentic empty states.
- All reviews must be authored strictly by authenticated, registered users with zero automated or fake test seeds in production.

## 9. Strict Catalog-to-Site Isolation & Zero Unintended Redirection
- In Catalog mode (`CatalogApp`), footer links, bottom components, category items, and modal actions MUST strictly remain within the Catalog app and NEVER navigate or redirect the user to the Site storefront (e.g. `/site`, `/about`, `/haqqimizda`, etc.).
- The ONLY authorized action permitted to navigate to the site storefront is the explicit 'Sayta keç' / 'Sayta keçid' button.
- All informational footer actions (stores, support, about, terms, privacy) within catalog mode must open in-catalog modals or drawers without altering browser routing to site pages.
