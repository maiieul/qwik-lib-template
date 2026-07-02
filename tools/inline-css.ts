import { readFileSync } from "node:fs";
import type { Plugin } from "rolldown";

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
