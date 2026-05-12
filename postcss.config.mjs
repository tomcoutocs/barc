import path from "node:path";
import { fileURLToPath } from "node:url";

/** App root (`barc/`). Passed to `@tailwindcss/postcss` so it never uses wrong `process.cwd()`. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    "@tailwindcss/postcss": { base: projectRoot },
  },
};
