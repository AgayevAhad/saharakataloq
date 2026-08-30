# Sahara Kataloq Development Guidelines

## Critical Rules for Agents
1. **Strict Dev Branch Rule**: ALWAYS and under all circumstances commit and push changes ONLY to the `dev` branch (`git push origin dev`). NEVER commit or push to `main` without explicit user permission.
2. **No Raw Sample / Example Media on GitHub**: Raw reference media folders like `Foto/` and raw sample file dumps (`File/`) are private source examples/assets. They MUST NOT be committed or pushed to GitHub. Always keep them in `.gitignore`. Only production web-optimized catalog assets (inside `public/media/`) should be served.
3. **Automated Testing**: Always write and execute automated tests for every newly added or modified feature before finishing.
4. **Sticky Desktop Header**: Keep the header fixed/sticky at the top during scrolling with proper z-index and backdrop blur.
5. **Multiple Addresses**: Full support for multiple store/showroom addresses in admin panel, database, and customer-facing components.
6. **Admin Panel Synchronization**: Any new catalog feature, field, setting, brand, address, or model change MUST be fully supported and synchronized in the Admin Panel with intuitive UI, proper contrast, and end-to-end functionality.
7. **Strict Responsiveness & Visual Integrity**: Responsiveness on BOTH Desktop (large screens, laptops) and Mobile (phones, tablets, touch devices) must NEVER be broken. Always maintain proper CSS grid/flex proportions, non-distorted images, card heights, touch targets, and automated test coverage for responsive layouts.

