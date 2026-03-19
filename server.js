"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mysql = require("mysql2/promise");

const PORT = parseInt(process.env.PORT || "3000", 10);

// ── DB credentials – set via environment variables on the server ───────────────
const DB_CONFIG = {
  host    : process.env.DB_HOST     || "localhost",
  user    : process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "MyStrongPass123!",
  database: process.env.DB_NAME     || "study_app_db",
  waitForConnections: true,
  connectionLimit   : 10,
};

// ── Static MIME map ───────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const hashPw = (pw) => crypto.createHash("sha256").update(pw).digest("hex");

function log(level, ...args) {
  const ts = new Date().toISOString();
  console[level](`[${ts}] [${level.toUpperCase()}]`, ...args);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ── Database setup ────────────────────────────────────────────────────────────
let pool = null;

(async () => {
  log("info", `Connecting to MySQL at ${DB_CONFIG.host}/${DB_CONFIG.database} as '${DB_CONFIG.user}'`);
  try {
    pool = mysql.createPool(DB_CONFIG);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(50)  NOT NULL,
        email      VARCHAR(100) UNIQUE NOT NULL,
        password   VARCHAR(64)  NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    log("info", "Table 'users' ready.");

    // Migrate existing tables that used 'username' instead of name/email
    const migrations = [
      "ALTER TABLE users ADD COLUMN name  VARCHAR(50)  NOT NULL DEFAULT '' AFTER id",
      "ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE AFTER name",
      "ALTER TABLE users DROP COLUMN username",
    ];
    for (const sql of migrations) {
      try {
        await pool.execute(sql);
        log("info", `Migration applied: ${sql}`);
      } catch (err) {
        log("info", `Migration skipped (${err.message.split(";")[0]}): ${sql}`);
      }
    }

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attempts (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        user_id       INT NOT NULL,
        category      VARCHAR(20) NOT NULL,
        mode          VARCHAR(20) NOT NULL,
        score         INT NOT NULL,
        total         INT NOT NULL,
        percentage    INT NOT NULL,
        time_taken_ms INT NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    log("info", "Table 'attempts' ready.");
    log("info", "Database connected and all tables ready.");
  } catch (err) {
    log("error", `DB setup failed: ${err.message}`);
    log("warn", "API endpoints will return 503 until DB is available.");
    pool = null;
  }
})();

// ── API Handlers ──────────────────────────────────────────────────────────────
async function apiRegister(req, res) {
  const { name, email, password } = await readBody(req);
  log("info", `POST /api/register – email=${email?.trim().toLowerCase()}`);

  if (!name?.trim() || !email?.trim() || !password) {
    log("warn", "Register rejected: missing name, email or password.");
    return json(res, 400, { error: "Name, email address and password are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    log("warn", `Register rejected: invalid email format – "${email.trim()}"`);
    return json(res, 400, { error: "Please enter a valid email address." });
  }
  if (!pool) {
    log("error", "Register failed: database pool is null.");
    return json(res, 503, { error: "Database unavailable." });
  }

  try {
    await pool.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name.trim(),
      email.trim().toLowerCase(),
      hashPw(password),
    ]);
    const [rows] = await pool.execute(
      "SELECT id, name, email FROM users WHERE email = ?",
      [email.trim().toLowerCase()],
    );
    log("info", `Register success: userId=${rows[0].id} email=${rows[0].email}`);
    json(res, 201, { userId: rows[0].id, name: rows[0].name, email: rows[0].email });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      log("warn", `Register rejected: duplicate email – ${email.trim().toLowerCase()}`);
      return json(res, 409, { error: "An account with that email already exists." });
    }
    log("error", `Register DB error [${err.code}]: ${err.message}`);
    json(res, 500, { error: "Server error." });
  }
}

async function apiLogin(req, res) {
  const { email, password } = await readBody(req);
  log("info", `POST /api/login – email=${email?.trim().toLowerCase()}`);

  if (!email?.trim() || !password) {
    log("warn", "Login rejected: missing email or password.");
    return json(res, 400, { error: "Email address and password are required." });
  }
  if (!pool) {
    log("error", "Login failed: database pool is null.");
    return json(res, 503, { error: "Database unavailable." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email FROM users WHERE email = ? AND password = ?",
      [email.trim().toLowerCase(), hashPw(password)],
    );
    if (!rows[0]) {
      log("warn", `Login failed: no match for email=${email.trim().toLowerCase()}`);
      return json(res, 401, { error: "Invalid email or password." });
    }
    log("info", `Login success: userId=${rows[0].id} email=${rows[0].email}`);
    json(res, 200, { userId: rows[0].id, name: rows[0].name, email: rows[0].email });
  } catch (err) {
    log("error", `Login DB error [${err.code}]: ${err.message}`);
    json(res, 500, { error: "Server error." });
  }
}

async function apiAttempt(req, res) {
  const { userId, category, mode, score, total, timeTakenMs } = await readBody(req);
  log("info", `POST /api/attempt – userId=${userId} category=${category} score=${score}/${total}`);

  if (!userId || !category || !mode || score == null || !total || timeTakenMs == null) {
    log("warn", "Attempt rejected: missing required fields.");
    return json(res, 400, { error: "Missing required fields." });
  }
  if (!pool) {
    log("error", "Attempt failed: database pool is null.");
    return json(res, 503, { error: "Database unavailable." });
  }

  try {
    await pool.execute(
      `INSERT INTO attempts (user_id, category, mode, score, total, percentage, time_taken_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, category, mode, score, total, Math.round((score / total) * 100), timeTakenMs],
    );
    log("info", `Attempt saved: userId=${userId} score=${score}/${total}`);
    json(res, 201, { success: true });
  } catch (err) {
    log("error", `Attempt DB error [${err.code}]: ${err.message}`);
    json(res, 500, { error: "Server error." });
  }
}

async function apiHistory(req, res) {
  const url    = new URL(req.url, "http://localhost");
  const userId = parseInt(url.searchParams.get("userId"), 10);
  const limit  = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10), 1), 50);
  log("info", `GET /api/history – userId=${userId} limit=${limit}`);

  if (!userId) {
    log("warn", "History rejected: missing userId.");
    return json(res, 400, { error: "userId is required." });
  }
  if (!pool) {
    log("error", "History failed: database pool is null.");
    return json(res, 503, { error: "Database unavailable." });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT category, mode, score, total, percentage,
              time_taken_ms AS timeTakenMs, created_at AS date
       FROM   attempts
       WHERE  user_id = ?
       ORDER  BY created_at DESC
       LIMIT  ${limit}`,
      [userId],
    );
    log("info", `History returned ${rows.length} attempt(s) for userId=${userId}`);
    json(res, 200, { attempts: rows });
  } catch (err) {
    log("error", `History DB error [${err.code}]: ${err.message}`);
    json(res, 500, { error: "Server error." });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
const API = {
  "POST /api/register": apiRegister,
  "POST /api/login": apiLogin,
  "POST /api/attempt": apiAttempt,
  "GET /api/history": apiHistory,
};

// ── HTTP Server ───────────────────────────────────────────────────────────────
http
  .createServer(async (req, res) => {
    const urlNoQuery = req.url.split("?")[0];
    const handler = API[`${req.method} ${urlNoQuery}`];

    if (handler) {
      try {
        await handler(req, res);
      } catch (err) {
        log("error", `Unhandled error in ${req.method} ${urlNoQuery}: ${err.message}`);
        json(res, 500, { error: "Unexpected server error." });
      }
      return;
    }

    // Static file serving
    const safePath = path.normalize(urlNoQuery).replace(/^(\.\.[/\\])+/, "");
    const isRoot = safePath === "/" || safePath === path.sep;
    const file = path.join(__dirname, "public", isRoot ? "index.html" : safePath);

    fs.readFile(file, (err, data) => {
      if (err) {
        log("warn", `Static file not found: ${file}`);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 – Not Found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "text/plain" });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    log("info", "11+ Study App – Web Edition");
    log("info", `Listening on http://localhost:${PORT}`);
  });
