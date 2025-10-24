import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fijar la raíz de output tracing para evitar que Next.js infiera
  // el workspace root desde otros lockfiles en el sistema
  outputFileTracingRoot: resolve(__dirname),
  // Comentar output: 'export' para permitir API routes dinámicos
  // output: 'export',
  // Desabilitar caché de webpack en Windows para evitar ENOENT errors
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
}

export default nextConfig
