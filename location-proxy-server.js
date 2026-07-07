/**
 * Location API Proxy Server
 * Proxies India Location Hub API requests to avoid CORS issues
 *
 * Usage:
 *   node location-proxy-server.js
 *
 * Then call: http://localhost:3000/api/location/states
 */

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// External API base URL
const LOCATION_API_BASE = "https://india-location-hub.in/api";

// ====================================
// Middleware
// ====================================

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Enable CORS for all routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 3600,
  }),
);

// JSON parsing
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ====================================
// Proxy Routes
// ====================================

/**
 * GET /api/location/states
 * Fetches all Indian states
 */
app.get("/api/location/states", async (req, res) => {
  try {
    console.log("📍 Proxying request to: /locations/states");
    const response = await fetch(`${LOCATION_API_BASE}/locations/states`);

    if (!response.ok) {
      throw new Error(
        `External API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`✅ States fetched: ${data.length} items`);

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching states:", error.message);
    res.status(500).json({
      error: "Failed to fetch states",
      message: error.message,
    });
  }
});

/**
 * GET /api/location/districts?stateCode=XX
 * Fetches districts for a given state
 */
app.get("/api/location/districts", async (req, res) => {
  try {
    const { stateCode } = req.query;

    if (!stateCode) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "stateCode query parameter is required",
      });
    }

    console.log(
      `📍 Proxying request to: /locations/districts?stateCode=${stateCode}`,
    );
    const response = await fetch(
      `${LOCATION_API_BASE}/locations/districts?stateCode=${stateCode}`,
    );

    if (!response.ok) {
      throw new Error(
        `External API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(
      `✅ Districts fetched for state ${stateCode}: ${data.length} items`,
    );

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching districts:", error.message);
    res.status(500).json({
      error: "Failed to fetch districts",
      message: error.message,
    });
  }
});

/**
 * GET /api/location/talukas?districtCode=XXXX
 * Fetches talukas for a given district
 */
app.get("/api/location/talukas", async (req, res) => {
  try {
    const { districtCode } = req.query;

    if (!districtCode) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "districtCode query parameter is required",
      });
    }

    console.log(
      `📍 Proxying request to: /locations/talukas?districtCode=${districtCode}`,
    );
    const response = await fetch(
      `${LOCATION_API_BASE}/locations/talukas?districtCode=${districtCode}`,
    );

    if (!response.ok) {
      throw new Error(
        `External API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(
      `✅ Talukas fetched for district ${districtCode}: ${data.length} items`,
    );

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching talukas:", error.message);
    res.status(500).json({
      error: "Failed to fetch talukas",
      message: error.message,
    });
  }
});

/**
 * GET /api/location/villages?talukaCode=XXXXX
 * Fetches villages for a given taluka
 */
app.get("/api/location/villages", async (req, res) => {
  try {
    const { talukaCode } = req.query;

    if (!talukaCode) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "talukaCode query parameter is required",
      });
    }

    console.log(
      `📍 Proxying request to: /locations/villages?talukaCode=${talukaCode}`,
    );
    const response = await fetch(
      `${LOCATION_API_BASE}/locations/villages?talukaCode=${talukaCode}`,
    );

    if (!response.ok) {
      throw new Error(
        `External API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(
      `✅ Villages fetched for taluka ${talukaCode}: ${data.length} items`,
    );

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching villages:", error.message);
    res.status(500).json({
      error: "Failed to fetch villages",
      message: error.message,
    });
  }
});

// ====================================
// Health Check
// ====================================

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Location proxy server is running" });
});

// ====================================
// Error Handling
// ====================================

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ====================================
// Start Server
// ====================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🌍 Location API Proxy Server                          ║
║     ✅ Running on http://localhost:${PORT}                   ║
║                                                            ║
║     Available Endpoints:                                  ║
║     • GET /api/location/states                            ║
║     • GET /api/location/districts?stateCode=XX            ║
║     • GET /api/location/talukas?districtCode=XXXX         ║
║     • GET /api/location/villages?talukaCode=XXXXX         ║
║     • GET /health                                         ║
║                                                            ║
║     CORS enabled for all origins                          ║
║     Press Ctrl+C to stop                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down...");
  process.exit(0);
});
