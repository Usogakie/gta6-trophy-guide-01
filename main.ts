// GTA VI Trophy Guide & Tracker — make.fun entrypoint.
//
// This file is the handover: it gathers the built app (app/) and the
// screenshots (screenshots/) into the output directory the grader reads,
// then asks the vendored make.fun library to build dossier.json and writes
// the bytes it returns. Run locally with MAKEFUN_OUTPUT_DIR set to a
// scratch folder, e.g.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader sets MAKEFUN_OUTPUT_DIR to /output; without it we default there.

import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

await mkdir(outputDir, { recursive: true });
await cp(join(here, "app"), join(outputDir, "app"), { recursive: true });
await cp(join(here, "screenshots"), join(outputDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
await writeFile(join(outputDir, "dossier.json"), dossier);

console.log("Dossier written to " + join(outputDir, "dossier.json"));
