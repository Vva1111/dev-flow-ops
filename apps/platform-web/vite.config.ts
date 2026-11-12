import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'watch-workspace-apps',
      configureServer(server) {
        // 포털 밖에 추가되는 앱의 package.json도 glob 갱신 대상으로 감시한다.
        server.watcher.add(fileURLToPath(new URL('../', import.meta.url)))
      },
    },
  ],
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
})
