import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

function normalizeBase(input: string): string {
  let base = (input || '/').trim()
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

export default defineConfig(() => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'akiprisaye-web'
  const explicitBasePath = process.env.BASE_PATH
  const runningInGitHubPages = process.env.GITHUB_PAGES === 'true'

  const base = explicitBasePath
    ? normalizeBase(explicitBasePath)
    : runningInGitHubPages
      ? normalizeBase(`/${repositoryName}/`)
      : '/'

  return {
    plugins: [react()],
    resolve: {
      alias: [
        // Supporte "@/..." et aussi "@..."
        { find: /^@\//, replacement: `${srcPath}/` },
        { find: /^@$/, replacement: srcPath },
      ],
    },
    // Root on Cloudflare/local, subpath on GitHub Pages fallback
    base,
  }
})
