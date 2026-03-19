declare module "*.json" {
  const value: any;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_PLATFORM_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY: string;
    APP_URL: string;
  }
}
