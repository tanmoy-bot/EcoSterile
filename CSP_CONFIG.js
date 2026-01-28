/**
 * Content Security Policy (CSP) Configuration Reference
 * Applied in server.js via Express middleware
 *
 * This CSP configuration is production-safe and does NOT use 'unsafe-eval'.
 * All dynamic code execution is handled by Firebase SDK modules loaded from gstatic.com
 */

// CSP Header applied to all responses:
const cspHeader = [
  "default-src 'self'",

  "script-src 'self' https://www.gstatic.com https://apis.google.com https://cdn.jsdelivr.net",
  // Allows:
  // - 'self': Local scripts loaded via <script type="module" src="...">
  // - gstatic.com: Firebase SDK modules (auth, database, storage)
  // - apis.google.com: Google Sign-In API
  // - cdn.jsdelivr.net: Third-party libraries (if needed)

  "style-src 'self' https://fonts.googleapis.com https://www.gstatic.com 'unsafe-inline'",
  // Allows:
  // - 'self': Local stylesheets
  // - fonts.googleapis.com: Google Fonts
  // - gstatic.com: Font files
  // - 'unsafe-inline': Inline <style> tags and style attributes (acceptable for inline styles)

  "font-src https://fonts.gstatic.com",
  // Allows:
  // - fonts.gstatic.com: Google Fonts backend

  "img-src 'self' data: https:",
  // Allows:
  // - 'self': Local images
  // - data: Data URIs (inline images/SVGs)
  // - https: HTTPS image URLs

  "connect-src 'self' https://eco-sterile-default-rtdb.asia-southeast1.firebasedatabase.app https://firebaseio-default-rtdb.asia-southeast1.firebasedatabase.app https://*.firebasestorage.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://geocoding-api.open-meteo.com https://api.open-meteo.com https://api.emailjs.com https://india-location-hub.in https://localhost:3000",
  // Allows network connections to:
  // - localhost:3000: Location proxy server
  // - Firebase Realtime Database endpoints
  // - Firebase Storage endpoints
  // - Firebase Auth endpoints (identitytoolkit, securetoken)
  // - Google APIs
  // - Open-Meteo Weather API (free, no key required)
  // - EmailJS API (for contact emails)
  // - India Location Hub API (via proxy)

  "worker-src blob:",
  // Allows:
  // - blob: Web Workers from Blob URLs (for Three.js loaders)

  "frame-src https://www.gstatic.com",
  // Allows:
  // - gstatic.com: Google Sign-In popup frames
].join("; ");

// ====================================
// Additional Security Headers
// ====================================
// X-Content-Type-Options: nosniff
//   Prevents MIME type sniffing
//
// X-Frame-Options: SAMEORIGIN
//   Prevents clickjacking by only allowing frames from same origin
//
// X-XSS-Protection: 1; mode=block
//   Enables XSS filter in older browsers
//
// Referrer-Policy: strict-origin-when-cross-origin
//   Controls referrer information in requests

// ====================================
// Configuration Notes
// ====================================

/**
 * WHY NO 'unsafe-eval'?
 *
 * The application does NOT use eval(), new Function(), or dynamic code execution.
 * Firebase SDK handles all necessary dynamic operations internally using Module ES6
 * syntax loaded from gstatic.com, which is whitelisted in script-src.
 *
 * All code patterns:
 * ✅ import { ... } from "https://www.gstatic.com/firebasejs/..."
 * ✅ const module = await import("...")  (for dynamic imports)
 * ✅ Regular functions and arrow functions
 * ❌ eval(code)
 * ❌ new Function(code)
 * ❌ setTimeout(stringCode, delay)
 * ❌ setInterval(stringCode, interval)
 */

/**
 * FIREBASE INTEGRATION
 *
 * All Firebase operations use official SDKs from gstatic.com:
 * - Firebase Authentication: signIn, signUp, signOut, Google Auth
 * - Firebase Realtime Database: read, write, update operations
 * - Firebase Storage: file upload/download/delete
 *
 * No direct fetch() calls to Firebase endpoints - uses SDK only.
 */

/**
 * FILE UPLOAD SAFETY
 *
 * - Location: dashboard/lidar.js
 * - Max file size: 300MB (client-side validation)
 * - Upload mechanism: Firebase Storage SDK (uploadBytesResumable)
 * - Progress tracking: Built-in upload task state changes
 * - Blob URL handling: Automatic cleanup by Firebase SDK
 */

/**
 * CORS HANDLING
 *
 * Primary server (server.js - port 3001):
 * - Serves static HTML/CSS/JS
 * - Sets CSP headers
 * - Handles favicon, stylesheets, etc.
 *
 * Location proxy (location-proxy-server.js - port 3000):
 * - Proxies India Location Hub API
 * - Implements CORS for browser requests
 * - Maintains security headers
 *
 * Firebase:
 * - Handles all auth/database/storage requests
 * - Uses OAuth 2.0 for auth popups
 * - No CORS preflight issues with SDK usage
 */

export const cspConfig = {
  cspHeader,
  headerName: "Content-Security-Policy",
  mode: "enforce", // 'enforce' for CSP, use 'report-only' for testing
};
