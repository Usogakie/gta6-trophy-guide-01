// Tiny static dev server for the GTA VI Trophy Guide & Tracker.
// Serves the app/ folder on localhost only — a development convenience,
// not a web server for the internet. Usage: `node serve.ts [--port N]`
// (default port 8080; a missing, non-integer or out-of-range port falls
// back to 8080).

import { createReadStream, stat } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const appRoot = resolve(here, "app");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

function parsePort(argv) {
  const i = argv.indexOf("--port");
  if (i === -1 || i + 1 >= argv.length) return 8080;
  const n = Number(argv[i + 1]);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return 8080;
  return n;
}

const port = parsePort(process.argv.slice(2));

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  let rel = rawPath.endsWith("/") ? rawPath + "index.html" : rawPath;
  const file = resolve(appRoot, "." + normalize(rel).replace(/^\/+/, sep));
  if (!file.startsWith(appRoot + sep) && file !== appRoot) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("Forbidden\n");
    return;
  }
  stat(file, (err, info) => {
    if (err || !info.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found\n");
      return;
    }
    const type = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, {
      "content-type": type,
      "content-length": info.size,
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(res);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("GTA VI Trophy Guide & Tracker — serving app/ at http://localhost:" + port);
});
