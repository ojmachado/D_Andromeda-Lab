/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  // mais variáveis podem ser adicionadas aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}