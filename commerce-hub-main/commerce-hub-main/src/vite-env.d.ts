/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_HOME_DASHBOARD?: string;
  /** When "true", any signed-in user may open /dashboard (emergency only; keeps Dashboard hidden until login). */
  readonly VITE_ALLOW_DASHBOARD_WITHOUT_ROLE?: string;
}
