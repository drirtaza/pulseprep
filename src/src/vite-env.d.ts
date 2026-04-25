/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SMTP_HOST: string
  readonly VITE_SMTP_PORT: string
  readonly VITE_SMTP_SECURE: string
  readonly VITE_SMTP_USERNAME: string
  readonly VITE_SMTP_PASSWORD: string
  readonly VITE_FROM_EMAIL: string
  readonly VITE_FROM_NAME: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}