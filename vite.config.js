import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

function devWriteGuard() {
  return {
    name: "dev-write-guard",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const method = String(req.method || "GET").toUpperCase()
        const url = req.url || ""
        const safe = method === "GET" || method === "HEAD" || method === "OPTIONS"
        if (url.startsWith("/api") && !safe) {
          res.statusCode = 403
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({
            ok: false,
            blocked: true,
            error: "Blocked in local preview. Nothing was sent.",
          }))
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devWriteGuard()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2018',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8888",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (_err, _req, res) => {
            if (!res || res.headersSent || typeof res.writeHead !== "function") return
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ ok: false, items: [], updates: [] }))
          })
        },
      },
    },
  },
})
