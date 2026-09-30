const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { dashboard } = require("./data");

const PORT = process.env.PORT || 3000;
const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "biolinks");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: "File not found" });
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function resolveStaticPath(requestPath) {
  if (requestPath === "/") return path.join(frontendDir, "index.html");

  const cleanPath = path.normalize(requestPath.replace(/^\/+/, ""));
  const fullPath = path.join(rootDir, cleanPath);
  if (!fullPath.startsWith(rootDir)) return null;
  return fullPath;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok", service: "biolinks-commerce-api" });
    return;
  }

  if (url.pathname === "/api/dashboard") {
    sendJson(response, 200, dashboard);
    return;
  }

  if (url.pathname === "/api/schema") {
    sendJson(response, 200, {
      file: "schema.sql",
      modules: ["commerce", "inventory", "finance", "reporting", "security"]
    });
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    sendJson(response, 400, { error: "Invalid path" });
    return;
  }

  sendFile(response, filePath);
});

server.listen(PORT, () => {
  console.log(`Biopharmlifescience Commerce OS running at http://localhost:${PORT}`);
});
