import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "data", "raw");
const host = "127.0.0.1";
const port = Number(process.env.CNKI_RECEIVER_PORT || 4199);
const allowedOrigin = "https://kns.cnki.net";
const fileLocks = new Map();

async function atomicWriteJson(file, payload) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(payload, null, 2), "utf8");

  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await fs.rename(temporary, file);
      return;
    } catch (error) {
      lastError = error;
      if (!/[Ee](?:PERM|ACCES|BUSY)/.test(error.code || "")) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 + attempt * 50));
    }
  }

  await fs.rm(temporary, { force: true }).catch(() => {});
  throw lastError;
}

function safeFileName(value) {
  const fileName = path.basename(String(value || "cnki-browser-titles.json"));
  if (!/^[a-z0-9][a-z0-9._-]*\.json$/i.test(fileName)) {
    throw new Error("Invalid output file name");
  }
  return fileName;
}

function recordKey(record) {
  return [record.title, record.year, record.source, record.resourceType || record.category || record.database]
    .map(value => String(value || "").trim().toLowerCase().replace(/[\s\p{P}]/gu, ""))
    .join("|");
}

async function readPayload(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { records: [], buckets: {} };
    throw error;
  }
}

async function mergePayload(fileName, incoming) {
  const file = path.join(rawDir, fileName);
  const previous = fileLocks.get(file) || Promise.resolve();
  const current = previous.then(async () => {
    await fs.mkdir(rawDir, { recursive: true });
    const existing = await readPayload(file);
    const records = new Map((existing.records || []).map(record => [recordKey(record), record]));
    for (const record of incoming.records || []) {
      if (!record?.title) continue;
      records.set(recordKey(record), { ...record, collectedAt: record.collectedAt || new Date().toISOString() });
    }

    const bucketKey = String(incoming.bucket || "unbucketed");
    const buckets = {
      ...(existing.buckets || {}),
      [bucketKey]: {
        expectedTotal: Number(incoming.expectedTotal) || null,
        received: (incoming.records || []).length,
        complete: incoming.complete !== false,
        updatedAt: new Date().toISOString()
      }
    };
    const payload = {
      query: incoming.query || existing.query || "斑马鱼",
      category: incoming.category || existing.category || "",
      language: incoming.language || existing.language || "",
      resourceType: incoming.resourceType || existing.resourceType || "",
      collectedAt: new Date().toISOString(),
      completedPages: null,
      totalPages: null,
      stopped: incoming.stopped || null,
      buckets,
      records: [...records.values()]
    };
    await atomicWriteJson(file, payload);
    return { file, records: payload.records.length, buckets: Object.keys(buckets).length };
  });
  fileLocks.set(file, current.catch(() => {}));
  return current;
}

function corsHeaders(origin) {
  return origin === allowedOrigin
    ? {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        Vary: "Origin"
      }
    : {};
}

function respond(response, status, payload, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  const cors = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    response.writeHead(origin === allowedOrigin ? 204 : 403, cors);
    response.end();
    return;
  }
  if (origin && origin !== allowedOrigin) {
    respond(response, 403, { error: "Origin is not allowed" });
    return;
  }

  const url = new URL(request.url, `http://${host}:${port}`);
  if (request.method === "GET" && url.pathname === "/health") {
    respond(response, 200, { ok: true, rawDir }, cors);
    return;
  }
  if (request.method !== "POST" || url.pathname !== "/append") {
    respond(response, 404, { error: "Not found" }, cors);
    return;
  }

  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 25 * 1024 * 1024) throw new Error("Payload exceeds 25 MB");
      chunks.push(chunk);
    }
    const incoming = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const result = await mergePayload(safeFileName(url.searchParams.get("file")), incoming);
    respond(response, 200, { ok: true, ...result }, cors);
  } catch (error) {
    respond(response, 400, { error: error.message }, cors);
  }
});

server.listen(port, host, () => {
  console.log(`CNKI receiver listening on http://${host}:${port}`);
});
