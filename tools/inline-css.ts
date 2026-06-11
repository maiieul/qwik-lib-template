import { readFileSync } from "node:fs";
import type { Plugin } from "rolldown";

/**
 * Rolldown plugin replicating Vite's `import styles from "./x.css?inline"`
 * semantics: the CSS file content is returned as a JS string module.
 *
 * Needed because `vp pack` builds with Rolldown directly, which does not
 * implement Vite's `?inline` import query. The dev harness and vitest run
 * through Vite itself, where `?inline` works natively.
 */
export function inlineCss(): Plugin {
  return {
    name: "inline-css",
    load: {
      filter: { id: /\.css(\?.*)?$/ },
      handler(id) {
        if (!id.includes("?inline")) {
          return null;
        }
        const filePath = id.split("?")[0];
        if (!filePath) {
          return null;
        }
        return {
          code: `export default ${JSON.stringify(readFileSync(filePath, "utf-8"))};`,
          map: null,
        };
      },
    },
  };
}
