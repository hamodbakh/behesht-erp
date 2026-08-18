import http from "node:http";
import net from "node:net";

const HOST = "127.0.0.1";
const PORT = 8787;

function sendJson(res, statusCode, body) {
  const data = JSON.stringify(body);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(data);
}

function buildPayload({ text, protocol = "plain" }) {
  const safeText = String(text ?? "");

  if (protocol === "escpos") {
    return Buffer.concat([
      Buffer.from([0x1b, 0x40]),
      Buffer.from(safeText, "utf8"),
      Buffer.from("\n\n\n", "utf8"),
      Buffer.from([0x1d, 0x56, 0x00]),
    ]);
  }

  return Buffer.from(`\x1bE${safeText}\r\n\f`, "binary");
}

function rawTcpPrint({ ip, port, payload, timeoutMs = 5000 }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn(value);
    };

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => {
      socket.write(payload, (error) => {
        if (error) {
          finish(reject, error);
          return;
        }
        socket.end();
      });
    });

    socket.once("close", (hadError) => {
      if (!hadError && !settled) {
        finish(resolve, true);
      }
    });

    socket.once("timeout", () => {
      finish(
        reject,
        new Error(`Connection timeout after ${timeoutMs} ms`)
      );
    });

    socket.once("error", (error) => {
      finish(reject, error);
    });

    socket.connect(port, ip);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "Behesht Local Print Service",
      host: HOST,
      port: PORT,
    });
    return;
  }

  if (req.method === "POST" && req.url === "/print") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const input = JSON.parse(body || "{}");

        const ip = String(input.ip ?? "").trim();
        const tcpPort = Number(input.port ?? 9100);
        const protocol =
          input.protocol === "escpos" ? "escpos" : "plain";
        const text = String(input.text ?? "");

        if (!ip) {
          sendJson(res, 400, {
            ok: false,
            error: "Printer IP is required.",
          });
          return;
        }

        if (!text.trim()) {
          sendJson(res, 400, {
            ok: false,
            error: "Print text is empty.",
          });
          return;
        }

        const payload = buildPayload({
          text,
          protocol,
        });

        await rawTcpPrint({
          ip,
          port: tcpPort,
          payload,
        });

        sendJson(res, 200, {
          ok: true,
          ip,
          port: tcpPort,
          protocol,
          bytes: payload.length,
        });
      } catch (error) {
        sendJson(res, 500, {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    });

    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "Not found.",
  });
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("Behesht Local Print Service");
  console.log(`Running at http://${HOST}:${PORT}`);
  console.log(`Health: http://${HOST}:${PORT}/health`);
  console.log("");
});
