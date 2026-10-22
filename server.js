require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const publicDirectory = path.join(__dirname, "public");
const dataDirectory = path.join(__dirname, "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, "portfolio.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  }
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many messages sent. Please try again later." }
});

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Portfolio API is running." });
});

app.post("/api/contact", contactLimiter, (req, res) => {
  // Honeypot field: normal visitors should leave this empty.
  if (clean(req.body.website, 200)) {
    return res.status(200).json({ success: true, message: "Thanks for your message." });
  }

  const name = clean(req.body.name, 80);
  const email = clean(req.body.email, 254);
  const subject = clean(req.body.subject, 120);
  const message = clean(req.body.message, 3000);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "Please complete every field." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }
  if (name.length < 2 || message.length < 10) {
    return res.status(400).json({ success: false, message: "Please enter your name and a message of at least 10 characters." });
  }

  try {
    const insert = db.prepare(
      "INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)"
    );
    insert.run(name, email, subject, message);
    return res.status(201).json({
      success: true,
      message: "Thanks for reaching out. Your message has been saved."
    });
  } catch (error) {
    console.error("Contact form database error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Sorry, your message could not be saved right now."
    });
  }
});

app.use(express.static(publicDirectory));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API route not found." });
  }
  return res.sendFile(path.join(publicDirectory, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
});
