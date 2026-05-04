const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf-8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^['\"]|['\"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const MAX_PORT_ATTEMPTS = 10;
const ROOT = process.cwd();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
const RESEND_API_KEY =
  process.env.RESEND_API_KEY || "re_d1Qdm5pP_NLcpVuigXZ3EroPksGLCqCjG";
const ALERT_TO_EMAIL = process.env.ALERT_TO_EMAIL || "tuantk2009@gmail.com";
const ALERT_FROM_EMAIL =
  process.env.ALERT_FROM_EMAIL || "onboarding@resend.dev";

const SYSTEM_PROMPT = `Role: You are "Leaf," a passionate, highly knowledgeable, and pragmatic environmentalist inside the Green Truth website. Your mission is to help people transition to more sustainable lifestyles, explain how the website works, and guide them to the right Green Truth feature for each task.

Tone and Voice:

Empathetic & Non-Judgmental: Understand that everyone is at a different stage of their "green" journey. Avoid "shaming" language.

Scientifically Grounded: Base your advice on modern environmental science (carbon footprints, life cycle assessments, biodiversity, and waste reduction).

Witty & Approachable: Use a touch of humor and warmth to make complex topics like "circular economies" feel accessible.

Solution-Oriented: If you identify a problem (e.g., plastic pollution), always provide a realistic alternative or a "small win" the user can achieve.

Website Context:

Green Truth is a sustainability-focused web platform with these main menu functions:

- Dashboard: shows a welcome overview, today's focus, workspace tags, and notes so users can quickly see priorities and keep track of green tasks.
- Profile: lets users manage their username and avatar, view coin and streak stats, and claim a daily coin reward.
- Digital Assets: lets users upload, preview, open external links for, and delete their own digital assets. Supported file types include images, videos, and PDFs.
- Go Green Map: shows a Leaflet map of planted items, user location, plant markers, plant details, and plant update logs. Users can plant at their current location, open plant details, upload update images, view their own plants, and delete only their own plants.
- Green Calculator: estimates event or activity impact based on materials and items, shows total CO2 output, impact level, green suggestions, and allows report export.
- Green Combat: is the green challenge or competition area. If users ask about it, explain it as a place for interactive green engagement, challenges, or activity-based participation within Green Truth.
- Chatbot: this is you, Leaf. You answer sustainability questions and explain how to use the platform.
- Confirm Action: helps verify cleanup or trash-picking actions using the camera, object detection, Gemini verification, and evidence checks so users can confirm actions and earn coins.

How to Help on This Website:

- If the user asks where to do something, point them to the exact menu page by name.
- If the user asks how a feature works, explain the user flow in simple steps based on the website functions above.
- If the user asks for sustainability advice, connect the advice to Green Truth tools when relevant, such as using the calculator for impact estimation, the map for plant tracking, or confirm action for cleanup verification.
- If a feature has ownership or permission limits, mention them clearly. For example, users can delete only their own plants or their own digital assets.
- If the site behavior is unclear, do not invent database fields or hidden features. Stay within the known website behavior.

Guidelines for Responses:

The "Big Three" Focus: Prioritize advice that impacts the most significant areas: Food (diets/waste), Transport (travel habits), and Energy (home efficiency).

Avoid Greenwashing: Be honest about what actually helps. If a "sustainable" trend is actually ineffective, gently explain why.

Local vs. Global: When possible, remind users that local actions (supporting native plants, local farmers, community cleanups) have massive global ripples.

Format: Use markdown. Prefer short paragraphs, bullet points for steps, and bold text for key takeaways.

Example Task:
If a user asks, "Is it better to use paper bags or plastic bags?", don't just pick one. Explain the trade-offs (energy/water use vs. biodegradability) and suggest the best option: using the bag they already own.

Example Website Task:
If a user asks, "How do I prove I picked up trash and get coins?", explain that they should open Confirm Action, start the camera, capture the cleanup action, let the model and Gemini verify it, and then receive coins if the action is approved.`;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(message);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);

  stream.on("open", () => {
    res.writeHead(200, { "Content-Type": contentType });
  });

  stream.on("error", () => {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });

  stream.pipe(res);
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^([.][.][/\\])+/, "");
  const resolved = path.resolve(
    ROOT,
    normalized === path.sep ? "index.html" : `.${path.sep}${normalized}`,
  );

  if (!resolved.startsWith(ROOT)) {
    return null;
  }

  return resolved;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function handleChat(req, res) {
  if (!GEMINI_API_KEY) {
    sendJson(res, 500, {
      error: "Missing GEMINI_API_KEY environment variable.",
    });
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      sendJson(res, 400, { error: "Message is required." });
      return;
    }

    const trimmedHistory = history
      .filter(
        (item) =>
          item &&
          typeof item.role === "string" &&
          typeof item.content === "string",
      )
      .slice(-10)
      .map((item) => ({ role: item.role, content: item.content }));

    const contents = [
      ...trimmedHistory,
      { role: "user", content: message },
    ].map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
          },
        }),
      },
    );

    const payload = await geminiRes.json();

    if (!geminiRes.ok) {
      sendJson(res, geminiRes.status, {
        error: payload.error?.message || "Gemini request failed.",
      });
      return;
    }

    const reply = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!reply) {
      sendJson(res, 502, { error: "The model returned an empty response." });
      return;
    }

    sendJson(res, 200, { reply });
  } catch (error) {
    sendJson(res, 500, {
      error:
        error instanceof Error ? error.message : "Unexpected server error.",
    });
  }
}

async function handleGreenAlert(req, res) {
  if (!RESEND_API_KEY) {
    sendJson(res, 500, {
      error: "Missing RESEND_API_KEY environment variable.",
    });
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const type = typeof body.type === "string" ? body.type.trim() : "Khác";
    const location =
      typeof body.location === "string" ? body.location.trim() : "Không rõ";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : "Không có mô tả";
    const image =
      typeof body.image === "string" && body.image.trim()
        ? body.image.trim()
        : "Chưa có ảnh";
    const imageDataUrl =
      typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";
    const imageName =
      typeof body.imageName === "string" && body.imageName.trim()
        ? body.imageName.trim()
        : "incident-photo.jpg";
    const imageType =
      typeof body.imageType === "string" && body.imageType.trim()
        ? body.imageType.trim()
        : "image/jpeg";
    const createdAt =
      typeof body.createdAt === "string"
        ? body.createdAt
        : new Date().toISOString();

    const imageMatch = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    const inlineImage = imageMatch
      ? {
          filename: imageName,
          content: imageMatch[2],
          content_type: imageMatch[1] || imageType,
          content_id: "incident-photo",
        }
      : null;

    const html = `
      <h2>Green Alert report</h2>
      <p><strong>Loai su co:</strong> ${type}</p>
      <p><strong>Toa do:</strong> ${location}</p>
      <p><strong>Mo ta:</strong> ${description}</p>
      <p><strong>Anh:</strong> ${image}</p>
      ${inlineImage ? '<p><img src="cid:incident-photo" alt="Incident photo" style="max-width:100%;border-radius:12px;border:1px solid #ddd" /></p>' : ""}
      <p><strong>Thoi gian:</strong> ${createdAt}</p>
    `;

    const emailPayload = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: `[Green Alert] ${type} - ${location}`,
      html,
      attachments: inlineImage ? [inlineImage] : undefined,
      text: [
        "Green Alert report",
        "",
        `Loai su co: ${type}`,
        `Toa do: ${location}`,
        `Mo ta: ${description}`,
        `Anh: ${image}`,
        `Thoi gian: ${createdAt}`,
      ].join("\n"),
    };

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const payload = await emailRes.json().catch(() => ({}));
    if (!emailRes.ok) {
      sendJson(res, emailRes.status, {
        error:
          payload.message || payload.error || "Email provider request failed.",
        details: payload,
      });
      return;
    }

    sendJson(res, 200, { ok: true, id: payload.id, to: ALERT_TO_EMAIL });
  } catch (error) {
    sendJson(res, 500, {
      error:
        error instanceof Error ? error.message : "Unexpected server error.",
    });
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  if (requestUrl.pathname === "/api/chat" && req.method === "POST") {
    await handleChat(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/green-alert" && req.method === "POST") {
    await handleGreenAlert(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      hasApiKey: Boolean(GEMINI_API_KEY),
      hasEmailKey: Boolean(RESEND_API_KEY),
      model: GEMINI_MODEL,
      provider: "gemini",
    });
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const pathname =
    requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const resolved = safeResolve(pathname);

  if (!resolved) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let filePath = resolved;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    sendText(res, 404, "Not found");
    return;
  }

  sendFile(res, filePath);
});

function startServer(port, attempt = 0) {
  server.listen(port, () => {
    console.log(`Green Truth server running at http://localhost:${port}`);
  });

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < MAX_PORT_ATTEMPTS - 1) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, trying ${nextPort}...`);
      server.close(() => {
        startServer(nextPort, attempt + 1);
      });
      return;
    }

    throw error;
  });
}

startServer(DEFAULT_PORT);
