import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseNeeds, recommend } from "./navigator.mjs";

const root = resolve(fileURLToPath(new URL("./static", import.meta.url)));
const port = Number(process.env.PORT || 8080);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

export const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/api/recommend") {
    if (request.method !== "GET") return send(response, 405, "application/json", JSON.stringify({ error: "Method not allowed" }));
    return send(response, 200, "application/json", JSON.stringify({ demo: true, options: recommend(parseNeeds(url.searchParams)) }));
  }
  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const file = resolve(root, requested);
  if (file !== root && !file.startsWith(root + sep)) return send(response, 403, "text/plain", "Forbidden");
  try {
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8` });
    response.end(body);
  } catch { send(response, 404, "text/plain", "Not found"); }
});

function send(response, status, type, body) {
  response.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
  response.end(body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => console.log(`Service Access Navigator: http://localhost:${port}`));
}
