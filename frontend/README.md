# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Netlify deployment

This frontend is configured to deploy on Netlify from the `frontend` directory.

- Build command: `npm run build`
- Publish directory: `dist`
- Static SPA fallback: `frontend/public/_redirects`
- Backend proxying:
  - `/api/*` → `https://vector-ai.up.railway.app/api/:splat`
  - `/auth/*` → `https://vector-ai.up.railway.app/auth/:splat`
  - `/chat`, `/match-animation`, `/voice-tutor`, `/logout`, `/favicon.ico`

If you need to change the backend destination, update `frontend/netlify.toml` and `frontend/public/_redirects` accordingly.
