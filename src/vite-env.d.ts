// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ViteTypeOptions {
  // この行を追加することで ImportMetaEnv の型を厳密にし、不明なキーを許可しないように
  // できます。
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_CLIENT_SECRET: string
  // その他の環境変数...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}