# yatrivo-frontend

React + Vite + Tailwind CSS frontend for Yatrivo. This app originated from the approved Figma Make export and is now the canonical production frontend code.

## Development Server

Use the Vite scripts in this folder when working on the frontend.

- `npm run dev` (or `npm --prefix . run dev` from the repo root) starts the local Vite development server on port `3000`.
- `npm run build` verifies the production frontend build.
- `npm run preview` serves the built app locally on port `3000`.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, Figma Make compatibility plugins, and the `@` alias for `src`
. `.mise.toml` - Toolchain versions for Node.js and the chosen package manager

## Frontend Source Rule

Treat the files in this folder as the real frontend implementation, not as reference material. Adapt components in place for production routing, data, API integration, auth, admin behavior, accessibility, and maintainability.

Do not recreate existing screens or components from screenshots. Preserve the approved visual language unless a documented production requirement calls for a targeted change.

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses Tailwind CSS v4 through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

