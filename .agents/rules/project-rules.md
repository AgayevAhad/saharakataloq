# Project Rules & Workflow Constraints

## 1. Branch Strategy & Git Protection
- **NEVER commit or push directly to the `main` branch** unless the user gives an explicit instruction to do so.
- All development, commits, and pushes MUST be made to the `dev` branch only.

## 2. Automated Test Coverage Mandate
- For EVERY new feature, database field, API route, admin component, or UI logic added, ALWAYS write corresponding automated unit or integration tests (Vitest / Node test runner).
- Tests must be executed and verified before concluding any task, without requiring explicit prompts from the user.

## 3. UI/UX Standards
- **Desktop Sticky Header**: The header (containing Sahara logo, brand dock, actions, and search bar) must stay sticky at the top of the viewport during scrolling with a smooth backdrop blur, allowing catalog content to pass smoothly underneath it.
- **Multiple Addresses**: Support adding, editing, and deleting multiple showroom/store addresses in the admin panel and rendering them in the footer and contact sections.
