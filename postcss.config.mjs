import path from "node:path";
import { fileURLToPath } from "node:url";

/** Must match Turbopack/Next workspace root (`barc/`), not terminal cwd (`.../cursor apps`). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {
    // Without `base`, @tailwindcss/postcss falls back to `process.cwd()` and resolves
    // `tailwindcss` from the wrong folder when multiple lockfiles exist (e.g. under %USERPROFILE%).
    "@tailwindcss/postcss": { base: projectRoot },
  },
};

export default config;
