const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");

const config = getDefaultConfig(__dirname);

const API_PORT = 8080;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith("/api")) {
        // Collect the full body as a Buffer before proxying.
        // This is required for native (iOS/Android) devices where the
        // request body stream may not pipe cleanly via req.pipe().
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          const body = Buffer.concat(chunks);

          // Strip hop-by-hop headers that must not be forwarded
          const forwardHeaders = { ...req.headers };
          delete forwardHeaders["transfer-encoding"];
          delete forwardHeaders["connection"];
          forwardHeaders["host"] = `localhost:${API_PORT}`;
          if (body.length > 0) {
            forwardHeaders["content-length"] = String(body.length);
          } else {
            delete forwardHeaders["content-length"];
          }

          const options = {
            hostname: "localhost",
            port: API_PORT,
            path: req.url,
            method: req.method,
            headers: forwardHeaders,
          };

          const proxyReq = http.request(options, (proxyRes) => {
            // Strip hop-by-hop headers from the response too
            const resHeaders = { ...proxyRes.headers };
            delete resHeaders["transfer-encoding"];
            delete resHeaders["connection"];
            res.writeHead(proxyRes.statusCode || 500, resHeaders);
            proxyRes.pipe(res, { end: true });
          });

          proxyReq.on("error", (err) => {
            console.error("[API Proxy Error]", err.message);
            if (!res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "API proxy error: " + err.message }));
            }
          });

          if (body.length > 0) {
            proxyReq.write(body);
          }
          proxyReq.end();
        });

        req.on("error", (err) => {
          console.error("[API Proxy Req Error]", err.message);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Request error" }));
          }
        });

        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
