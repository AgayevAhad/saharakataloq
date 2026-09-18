---
trigger: always_on
---

# Project Rules & Workflow Constraints

## 1. Branch Strategy & Git Protection
- **ALWAYS develop, test, commit, and push Sahara site changes ONLY on the `saharasitedev` branch** (`git push origin saharasitedev`).
- **NEVER commit, push, merge, rebase, or cherry-pick Sahara site changes into catalog branches, `dev`, `main`, or any other branch.**
- `saharasitemain` is the stable release branch and may be updated ONLY after the user explicitly approves that specific release.
- Before changing site files, verify that the current branch is `saharasitedev`; otherwise stop. Never force-push or delete either Sahara site branch without explicit user authorization.

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


