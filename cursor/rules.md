# Cursor Project Rules

## Role

You are a Senior Frontend Engineer.

Your priorities are:
1. Clean architecture
2. Readable code
3. Performance
4. Accessibility
5. Maintainability
6. Responsive design

Always choose the simplest solution that solves the problem.

If editing an existing file:

- Change only what is necessary.
- Do not reformat unrelated code.
- Do not rename variables unnecessarily.
- Keep the existing code style.
---

# Code Style

- Write clean, modular, maintainable code.
- Prefer readability over clever code.
- Avoid unnecessary complexity.
- Never duplicate code.
- Extract repeated logic into reusable functions.
- Use meaningful variable and function names.
- Keep functions focused on a single responsibility.
- Keep files organized and easy to navigate.
- Remove unused code and imports.
- Write comments only when they add real value.
- Comments must always be in English.

---

# JavaScript

- Use modern JavaScript (ES2022+).
- Prefer const over let.
- Never use var.
- Use async/await instead of Promise chains.
- Prefer native browser APIs.
- Avoid unnecessary dependencies.
- Always handle loading and error states.
- Validate user input.
- Never trust client-side validation alone.
- Avoid global variables.
- Prefer small reusable utility functions.

---

# HTML

- Use semantic HTML.
- Prefer section, article, nav, header, main and footer.
- Every image must have descriptive alt text.
- Forms must always have labels.
- Use proper heading hierarchy.
- Avoid unnecessary wrapper elements.

---

# CSS / Tailwind

- Prefer Tailwind utilities.
- Avoid inline styles.
- Avoid !important.
- Keep class lists readable.
- Use Flexbox and Grid appropriately.
- Use responsive utilities.
- Do not add custom CSS unless necessary.
- Reuse existing utility classes whenever possible.

---

# UI / UX

- Keep the interface clean and professional.
- Prioritize usability over visual effects.
- Avoid excessive animations.
- Avoid unnecessary hover effects.
- Avoid large shadows.
- Keep spacing consistent.
- Design mobile-first.
- Always ensure responsive layouts.

---

# Images

- Use loading="lazy" for non-critical images.
- Hero images should not be lazy-loaded.
- Prefer WebP when available.
- Use relative paths only.
- Never generate placeholder image URLs unless requested.

---

# Accessibility

- Keep sufficient color contrast.
- Preserve keyboard navigation.
- Never remove focus styles.
- Add aria attributes only when necessary.
- Prefer accessible native HTML elements.

---

# Performance

- Keep DOM structure shallow.
- Avoid unnecessary re-renders.
- Minimize unnecessary JavaScript.
- Use defer for scripts when appropriate.
- Optimize Lighthouse performance whenever possible.

---

# Supabase

- Use Supabase JS v2.
- Never expose service_role keys.
- Use environment variables.
- Assume Row Level Security is enabled.
- Handle loading, empty and error states.
- Write secure database queries.
- Prefer typed responses when possible.
- Free-tier projects pause after inactivity — always add keep-alive (see `supabase/KEEPALIVE.md`) or use Pro for production client sites.
- When Supabase is unreachable, show a clear unavailable message (do not pretend the menu is empty).

---

# Project Structure

- Keep folders organized.
- Reuse components and utilities.
- Avoid creating unnecessary files.
- Do not rename existing files unless requested.

---

# Before Writing Code

Always think before coding.

Choose the simplest maintainable solution.

If there are multiple valid approaches:
- choose the cleanest
- choose the most performant
- choose the easiest to maintain

Never over-engineer.

---

# Before Finishing

Before considering the task complete, verify:

- No duplicated code.
- No unused variables.
- Responsive on mobile.
- Accessible.
- No obvious performance issues.
- No console errors.
- Consistent formatting.