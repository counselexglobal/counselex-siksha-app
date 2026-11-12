const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { STREAMS_DATA, HOMEPAGE_DATA } = require("./data/streams");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(__dirname, "public");
const LEADS_FILE = path.resolve(__dirname, "data", "leads.json");

const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzd1hnm5a1R_5kC-oDxYuHTT5Q6OfV3ZmI896m0tL4TSbFJcqUgqyl_5iiET79u_zeT/exec";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function readLeads() {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    const raw = fs.readFileSync(LEADS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLead(lead) {
  const leads = readLeads();
  leads.push(lead);
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
}

async function forwardToGoogleSheets(sheetPayload) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: sheetPayload.name,
        phone: sheetPayload.phone,
        email: sheetPayload.email,
        university: sheetPayload.university
      }),
      redirect: "follow"
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { status: response.status, raw: text.slice(0, 200) };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function serveStaticFile(res, filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PUBLIC_DIR + path.sep) && resolved !== path.join(PUBLIC_DIR, "index.html")) {
    sendJson(res, 403, { ok: false, message: "Forbidden" });
    return;
  }
  fs.readFile(resolved, (err, content) => {
    if (err) {
      sendJson(res, 404, { ok: false, message: "Not found" });
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/api/data") {
    sendJson(res, 200, {
      ok: true,
      homepage: HOMEPAGE_DATA,
      streams: STREAMS_DATA
    });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/streams/")) {
    const slug = pathname.replace("/api/streams/", "").trim().toLowerCase();
    const stream = STREAMS_DATA[slug];
    if (!stream) {
      sendJson(res, 404, { ok: false, message: "Stream not found" });
      return;
    }
    sendJson(res, 200, { ok: true, stream });
    return;
  }

  if (req.method === "GET" && pathname === "/api/leads") {
    sendJson(res, 200, { ok: true, leads: readLeads() });
    return;
  }

  if (req.method === "POST" && pathname === "/api/leads") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        req.destroy();
      }
    });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const fullName = String(data.fullName || data.name || "").trim();
        const phone = String(data.phone || data.phoneNumber || "").trim();
        const email = String(data.email || "").trim();
        const course = String(data.course || data.stream || "B.Tech").trim();
        const city = String(data.city || "").trim();
        const college = String(data.college || "").trim();
        const source = String(data.source || "Free Counseling Modal").trim();

        if (!fullName || !phone) {
          sendJson(res, 400, {
            ok: false,
            message: "Full name and phone number are required."
          });
          return;
        }

        const universityParts = [course, city, college].map((s) => s.trim()).filter(Boolean);
        const university =
          String(data.university || "").trim() ||
          (universityParts.length > 0 ? universityParts.join(" | ") : course);

        const leadRecord = {
          id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: fullName.slice(0, 120),
          fullName: fullName.slice(0, 120),
          phone: phone.slice(0, 30),
          email: email.slice(0, 120),
          course: course.slice(0, 80),
          city: city.slice(0, 80),
          college: college.slice(0, 180),
          university: university.slice(0, 250),
          source: source.slice(0, 80),
          createdAt: new Date().toISOString()
        };

        saveLead(leadRecord);
        const sheetResult = await forwardToGoogleSheets({
          name: leadRecord.name,
          phone: leadRecord.phone,
          email: leadRecord.email,
          university: leadRecord.university
        });

        sendJson(res, 200, {
          ok: true,
          message: "Thank you! Our senior admission counselor will call you shortly.",
          lead: leadRecord,
          sheetResult
        });
      } catch {
        sendJson(res, 400, { ok: false, message: "Invalid JSON payload." });
      }
    });
    return;
  }

  if (req.method === "GET") {
    if (pathname === "/" || pathname.startsWith("/colleges/")) {
      serveStaticFile(res, path.join(PUBLIC_DIR, "index.html"));
      return;
    }

    const safeRel = pathname.replace(/^\/+/, "");
    const candidatePath = path.resolve(PUBLIC_DIR, safeRel);
    if (candidatePath.startsWith(PUBLIC_DIR + path.sep) && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      serveStaticFile(res, candidatePath);
      return;
    }

    serveStaticFile(res, path.join(PUBLIC_DIR, "index.html"));
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method Not Allowed" });
});

if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`CounselexSiksha server running on http://localhost:${PORT}`);
  });
}

module.exports = server;
