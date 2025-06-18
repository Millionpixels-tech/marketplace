/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_PAYHERE_MERCHANT_ID: string
  readonly VITE_PAYHERE_MERCHANT_SECRET: string
  readonly VITE_PAYHERE_SANDBOX: string
  readonly VITE_SMTP_HOST: string
  readonly VITE_SMTP_PORT: string
  readonly VITE_SMTP_SECURE: string
  readonly VITE_SMTP_USER: string
  readonly VITE_SMTP_PASS: string
  readonly VITE_FROM_EMAIL: string
  readonly VITE_FROM_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
