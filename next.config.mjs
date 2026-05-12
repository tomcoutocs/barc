/**
 * Use `.mjs` so `import.meta.url` is this file’s real path. Next can otherwise mis-infer
 * Turbopack root when a lockfile exists in the user profile (e.g. `C:\\Users\\…\\package-lock.json`),
 * which breaks resolving `tailwindcss` from `…/barc/node_modules`.
 *
 * @typedef {import("next").NextConfig} NextConfig
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const abs = (...segments) => path.resolve(projectRoot, ...segments);

/** Stable path inside this app’s `node_modules` (avoids package “exports” restrictions on resolve). */
function nodeModules(pkg) {
  return abs("node_modules", ...pkg.replace(/\\/g, "/").split("/"));
}

/** @type {NextConfig} */
const nextConfig = {
  turbopack: {
    root: abs(),
    resolveAlias: {
      tailwindcss: nodeModules("tailwindcss"),
      "@tailwindcss/postcss": nodeModules("@tailwindcss/postcss"),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
