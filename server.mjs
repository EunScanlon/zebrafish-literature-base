import http from "node:http";
import crypto from "node:crypto";
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
const authCookieName = "zebra_auth";
const cookieMaxAge = 60 * 60 * 24 * 30;
const passwordHash = String(process.env.SITE_PASSWORD_HASH || "").trim().toLowerCase();
const cookieSecret = String(process.env.SITE_COOKIE_SECRET || "");

// Render deploys the generated public/data files from GitHub. Its source
// metadata is intentionally excluded, so rebuilding there would overwrite
// the published index with an empty dataset.
const isRender = process.env.RENDER === "true" || process.env.RENDER === "1";
if (!process.argv.includes("--skip-data-build") && !isRender) {
  await buildData();
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").map(part => part.trim().split("=")).filter(([name, value]) => name && value).map(([name, ...value]) => [name, decodeURIComponent(value.join("="))]));
}

function signCookie(payload) {
  return crypto.createHmac("sha256", cookieSecret).update(payload).digest("base64url");
}

function isAuthorized(request) {
  if (!cookieSecret) return false;
  const token = parseCookies(request)[authCookieName] || "";
  const [expiresAt, nonce, signature] = token.split(".");
  if (!expiresAt || !nonce || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = signCookie(`${expiresAt}.${nonce}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function createAuthCookie() {
  const payload = `${Date.now() + cookieMaxAge * 1000}.${crypto.randomBytes(24).toString("base64url")}`;
  return `${payload}.${signCookie(payload)}`;
}

function writeJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders });
  response.end(JSON.stringify(payload));
}

async function readRequestBody(request) {
  const parts = [];
  let length = 0;
  for await (const part of request) {
    length += part.length;
    if (length > 4096) throw Object.assign(new Error("request_too_large"), { code: "REQUEST_TOO_LARGE" });
    parts.push(part);
  }
  return Buffer.concat(parts).toString("utf8");
}

function redirectToLogin(response, nextPath) {
  const next = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  response.writeHead(302, { Location: `/login.html?next=${encodeURIComponent(next)}`, "Cache-Control": "no-store" });
  response.end();
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return writeJson(response, 200, { status: "ok", project: "zebrafish-literature-base" });
    }
    if (request.method === "GET" && url.pathname === "/auth/session") {
      return writeJson(response, 200, { authenticated: isAuthorized(request) });
    }
    if (request.method === "POST" && url.pathname === "/auth/login") {
      if (!/^[a-f0-9]{64}$/.test(passwordHash) || !cookieSecret) return writeJson(response, 503, { error: "auth_not_configured" });
      let body;
      try { body = JSON.parse(await readRequestBody(request)); } catch { return writeJson(response, 400, { error: "invalid_request" }); }
      const submitted = String(body?.hash || "").trim().toLowerCase();
      const actual = Buffer.from(submitted);
      const expected = Buffer.from(passwordHash);
      if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return writeJson(response, 401, { error: "invalid_password" });
      return writeJson(response, 200, { ok: true }, { "Set-Cookie": `${authCookieName}=${encodeURIComponent(createAuthCookie())}; Max-Age=${cookieMaxAge}; Path=/; HttpOnly; Secure; SameSite=Lax` });
    }
    if (request.method === "POST" && url.pathname === "/auth/logout") {
      return writeJson(response, 200, { ok: true }, { "Set-Cookie": `${authCookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax` });
    }
    if (!isAuthorized(request)) {
      if (request.method === "GET" && url.pathname === "/login.html") {
        // The login form must remain public so an unauthenticated visitor can authenticate.
      } else if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html" || url.pathname === "/about.html")) {
        return redirectToLogin(response, `${url.pathname}${url.search}`);
      } else {
        return writeJson(response, 401, { error: "authentication_required" });
      }
    }
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const target = path.resolve(publicDir, `.${decodeURIComponent(requested)}`);
    if (!target.startsWith(publicDir)) {
      response.writeHead(403); return response.end("Forbidden");
    }
    const extension = path.extname(target);
    const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers["accept-encoding"] || "");
    const compressible = new Set([".html", ".css", ".js", ".json", ".csv"]);
    const isPaperChunk = /^\/data\/papers-\d+\.json$/.test(url.pathname);
    const cacheControl = isPaperChunk || url.pathname === "/data/zebrafish-literature.csv"
      ? "public, max-age=3600"
      : extension === ".css" || extension === ".js"
        ? "public, max-age=86400"
        : "no-cache";
    const headers = {
      "Content-Type": mime[extension] || "application/octet-stream",
      "Cache-Control": cacheControl,
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
