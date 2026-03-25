# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Architecture

This is a React PWA (Progressive Web App) built with Vite.

**PWA Setup:**
- `public/manifest.json` - Web app manifest for Android installability
- `public/sw.js` - Service worker with cache-first strategy for offline support
- Service worker registration happens in `src/main.jsx`

**Key Files:**
- `src/main.jsx` - App entry point, includes service worker registration
- `src/App.jsx` - Main React component
- `index.html` - HTML template with manifest and theme-color meta tags
