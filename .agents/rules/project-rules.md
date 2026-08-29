# Project Rules & Workflow Constraints

## 1. Branch Strategy & Git Protection
- **NEVER commit or push directly to the `main` branch** unless the user gives an explicit instruction to do so.
- All development, commits, and pushes MUST be made to the `dev` branch only.

## 2. Automated Test Coverage Mandate
- For EVERY new feature, database field, API route, admin component, or UI logic added, ALWAYS write corresponding automated unit or integration tests (Vitest / Node test runner).
- Tests must be executed and verified before concluding any task, without requiring explicit prompts from the user.

## 3. UI/UX Standards
- **Desktop Sticky Header**: The header (containing Sahara logo, brand dock, actions, and search bar) must stay sticky at the top of the viewport during scrolling with a smooth backdrop blur, allowing catalog content to pass smoothly underneath it.

### 4. Multiple Store/Showroom Addresses
- Full support for multiple store/showroom addresses in admin panel, database, and customer-facing components.

### 5. Admin Panel Synchronization & UX Quality
- Any new catalog feature, field, setting, brand, address, or model change MUST be fully supported and synchronized in the Admin Panel with intuitive UI, proper contrast, and end-to-end functionality.
- Admin Panel components must maintain strong color contrasts, reliable modal dialogs, and support both CSV and Excel (.xlsx) data exchanges.
