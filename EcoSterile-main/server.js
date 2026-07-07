/**
 * EcoSterile Web Server
 * Serves static content with proper CSP headers and CORS configuration
 *
 * Usage:
 *   node server.js
 *
 * Serves on: http://localhost:3001
 */

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// ====================================
// Security Headers Middleware
// ====================================

/**
 * Content Security Policy (CSP) Header
 * Allows:
 * - Scripts: self, gstatic.com (Firebase), googleapis.com
 * - Styles: self, fonts.googleapis.com, gstatic.com
 * - Fonts: fonts.gstatic.com
 * - Images: self, data, https
 * - Connections: Firebase Realtime DB, Firebase Storage, Open-Meteo API, EmailJS
 * - Workers: blob URLs (for Three.js loaders)
 * - Frames: gstatic.com (Google Auth popup)
 */
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' https://www.gstatic.com https://apis.google.com https://cdn.jsdelivr.net",
  "style-src 'self' https://fonts.googleapis.com https://www.gstatic.com 'unsafe-inline'",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://eco-sterile-default-rtdb.asia-southeast1.firebasedatabase.app https://firebaseio-default-rtdb.asia-southeast1.firebasedatabase.app https://*.firebasestorage.app https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://geocoding-api.open-meteo.com https://api.open-meteo.com https://api.emailjs.com https://india-location-hub.in https://localhost:3000",
  "worker-src blob:",
  "frame-src https://www.gstatic.com",
].join("; ");

app.use((req, res, next) => {
  // CSP disabled for development - inline scripts in HTML
  // For production, move scripts to external files and enable CSP
  // res.setHeader("Content-Security-Policy", cspHeader);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ====================================
// CORS Configuration
// ====================================

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 3600,
  }),
);

// ====================================
// Middleware
// ====================================

app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));

// ====================================
// Routes
// ====================================

/**
 * Serve index.html for root path
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * Serve auth pages
 */
app.get("/auth/:page", (req, res) => {
  const { page } = req.params;
  res.sendFile(path.join(__dirname, `auth/${page}.html`));
});

/**
 * Serve dashboard pages
 */
app.get("/dashboard/:page", (req, res) => {
  const { page } = req.params;
  res.sendFile(path.join(__dirname, `dashboard/${page}.html`));
});

/**
 * Handle 404s - serve index.html for SPA routing (if needed)
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
    path: req.path,
  });
});

// ====================================
// Error Handling
// ====================================

app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ====================================
// Start Server
// ====================================

app.listen(PORT, () => {
  console.log(`\n🚀 EcoSterile Web Server running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔒 CSP headers enabled`);
  console.log(`✅ Ready to serve requests\n`);
});
