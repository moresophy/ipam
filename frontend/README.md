# IPAM Frontend

React 19 SPA built with Vite and Tailwind CSS v4.

## Development

```bash
npm install
npm run dev      # http://localhost:5173 (Vite dev server)
npm run build    # production build → dist/
npm run lint     # ESLint
npm run preview  # preview production build locally
```

The frontend expects the backend API at `/api` (relative path). In development, Vite proxies this to `http://127.0.0.1:5000/api` via the config in `vite.config.js`. In production, the Kubernetes Ingress routes `/api` to the backend service.

## Structure

```
src/
├── api.js                  # Axios instance with JWT interceptor
├── App.jsx                 # Routes: / → Dashboard, /login → Login
├── i18n.js                 # i18next config, 8 languages
├── components/
│   ├── Dashboard.jsx       # Main app: subnet tree, IP table, modals
│   ├── Login.jsx           # Login page (split layout)
│   └── SettingsModal.jsx   # Language, default CIDR, password change
├── context/
│   ├── AuthContext.jsx     # JWT token state, login/logout
│   └── ThemeContext.jsx    # Light/dark mode toggle
└── locales/                # Translation files (en.json is source of truth)
    ├── en.json
    ├── de.json
    └── ...
```

## Adding translations

1. Add the key to `src/locales/en.json`
2. Add to all 7 other locale files
3. Use `const { t } = useTranslation()` → `t('key_name')` in components
