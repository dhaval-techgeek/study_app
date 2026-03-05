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
    // Migrate existing tables that used 'username' instead of name/email
    for (const sql of [
      "ALTER TABLE users ADD COLUMN name  VARCHAR(50)  NOT NULL DEFAULT '' AFTER id",
      "ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE AFTER name",
    ]) {
      try { await pool.execute(sql); } catch { /* column already exists */ }
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
    console.log("  Database connected and tables ready.");
  } catch (err) {
    console.warn(`  DB unavailable (${err.message}). API will return 503.`);
    pool = null;
  }
})();

// ── API Handlers ──────────────────────────────────────────────────────────────
async function apiRegister(req, res) {
  const { name, email, password } = await readBody(req);
  if (!name?.trim() || !email?.trim() || !password)
    return json(res, 400, { error: "Name, email address and password are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return json(res, 400, { error: "Please enter a valid email address." });
  if (!pool) return json(res, 503, { error: "Database unavailable." });

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
    json(res, 201, { userId: rows[0].id, name: rows[0].name, email: rows[0].email });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "An account with that email already exists." });
    json(res, 500, { error: "Server error." });
  }
}

async function apiLogin(req, res) {
  const { email, password } = await readBody(req);
  if (!email?.trim() || !password)
    return json(res, 400, { error: "Email address and password are required." });
  if (!pool) return json(res, 503, { error: "Database unavailable." });

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email FROM users WHERE email = ? AND password = ?",
      [email.trim().toLowerCase(), hashPw(password)],
    );
    if (!rows[0])
      return json(res, 401, { error: "Invalid email or password." });
    json(res, 200, { userId: rows[0].id, name: rows[0].name, email: rows[0].email });
  } catch {
    json(res, 500, { error: "Server error." });
  }
}

async function apiAttempt(req, res) {
  const { userId, category, mode, score, total, timeTakenMs } =
    await readBody(req);
  if (
    !userId ||
    !category ||
    !mode ||
    score == null ||
    !total ||
    timeTakenMs == null
  )
    return json(res, 400, { error: "Missing required fields." });
  if (!pool) return json(res, 503, { error: "Database unavailable." });

  try {
    await pool.execute(
      `INSERT INTO attempts (user_id, category, mode, score, total, percentage, time_taken_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        category,
        mode,
        score,
        total,
        Math.round((score / total) * 100),
        timeTakenMs,
      ],
    );
    json(res, 201, { success: true });
  } catch {
    json(res, 500, { error: "Server error." });
  }
}

async function apiHistory(req, res) {
  const url = new URL(req.url, "http://localhost");
  const userId = parseInt(url.searchParams.get("userId"), 10);
  const limit  = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10), 1), 50);
  if (!userId) return json(res, 400, { error: "userId is required." });
  if (!pool) return json(res, 503, { error: "Database unavailable." });

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
    json(res, 200, { attempts: rows });
  } catch {
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
      } catch {
        json(res, 500, { error: "Unexpected server error." });
      }
      return;
    }

    // Static file serving
    const safePath = path.normalize(urlNoQuery).replace(/^(\.\.[/\\])+/, "");
    const isRoot = safePath === "/" || safePath === path.sep;
    const file = path.join(
      __dirname,
      "public",
      isRoot ? "index.html" : safePath,
    );

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 – Not Found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file)] || "text/plain",
      });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log("\n  KS2 Unit Conversion Quiz – Web Edition");
    console.log("  ─────────────────────────────────────────");
    console.log(`  Open in your browser: http://localhost:${PORT}`);
    console.log("  Press Ctrl+C to stop.\n");
  });
