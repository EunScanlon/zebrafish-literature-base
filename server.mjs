import http from "node:http";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { buildData } from "./scripts/build-data.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const port = Number(process.env.PORT || 4188);
// Bind every interface by default so the same service works on LANs and cloud hosts.
const host = process.env.HOST || "0.0.0.0";
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png" };

// Render deploys the generated public/data files from GitHub. Its source
// metadata is intentionally excluded, so rebuilding there would overwrite
// the published index with an empty dataset.
const isRender = process.env.RENDER === "true" || process.env.RENDER === "1";
if (!process.argv.includes("--skip-data-build") && !isRender) {
  await buildData();
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/api/health") {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return response.end(JSON.stringify({ status: "ok", project: "zebrafish-literature-base" }));
    }
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const target = path.resolve(publicDir, `.${decodeURIComponent(requested)}`);
    if (!target.startsWith(publicDir)) {
      response.writeHead(403); return response.end("Forbidden");
    }
    const extension = path.extname(target);
    const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers["accept-encoding"] || "");
    const compressible = new Set([".html", ".css", ".js", ".json", ".csv"]);
    const headers = {
      "Content-Type": mime[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Vary": "Accept-Encoding"
    };
    await fs.access(target);
    if (acceptsGzip && compressible.has(extension)) {
      response.writeHead(200, { ...headers, "Content-Encoding": "gzip" });
      return fsSync.createReadStream(target).pipe(zlib.createGzip({ level: 6 })).pipe(response);
    }
    response.writeHead(200, headers);
    fsSync.createReadStream(target).pipe(response);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.code === "ENOENT" ? "not_found" : "internal_error" }));
  }
});

server.listen(port, host, () => {
  const addresses = Object.values(os.networkInterfaces())
    .flatMap(items => items || [])
    .filter(item => item.family === "IPv4" && !item.internal)
    .map(item => `http://${item.address}:${port}`);
  console.log(`Zebrafish literature base: http://localhost:${port}`);
  for (const address of addresses) console.log(`LAN/public candidate: ${address}`);
});
