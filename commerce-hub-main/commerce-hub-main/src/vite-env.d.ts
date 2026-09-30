/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_HOME_DASHBOARD?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  /** When "true", any signed-in user may open /dashboard (emergency only; keeps Dashboard hidden until login). */
}
