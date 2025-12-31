/**
 * Admin Panel Utilities
 * Shared functions for admin authentication and authorization
 */

// Admin email whitelist - UPDATE THIS WITH YOUR ACTUAL ADMIN EMAILS
export const ADMIN_EMAILS = [
  "admin@ecosterile.com",
  "dev@ecosterile.com",
  "support@ecosterile.com",
  "ayushmanchoudhury30@gmail.com",
  "tanmoykanoo30@gmail.com",
  // Add more admin emails as needed
];

/**
 * Verify if an email belongs to an admin
 * @param {string} email - Email address to check
 * @returns {boolean} True if email is in admin whitelist
 */
export function isAdminUser(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get current admin user info from localStorage
 * @returns {object|null} Admin user object or null if not logged in
 */
export function getCurrentAdminUser() {
  const stored = localStorage.getItem("adminUser");
  return stored ? JSON.parse(stored) : null;
}

/**
 * Store admin user info in localStorage
 * @param {object} user - Firebase user object
 */
export function saveAdminUser(user) {
  const adminData = {
    email: user.email,
    uid: user.uid,
    displayName: user.displayName || "Admin",
    photoURL: user.photoURL,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem("adminUser", JSON.stringify(adminData));
}

/**
 * Clear admin session from localStorage
 */
export function clearAdminSession() {
  localStorage.removeItem("adminUser");
}

/**
 * Check if user is authenticated and is an admin
 * @param {object} user - Firebase user object
 * @returns {boolean} True if authenticated and admin
 */
export function validateAdminAccess(user) {
  if (!user) return false;
  return isAdminUser(user.email);
}

/**
 * Generate audit log entry
 * @param {string} action - Action performed
 * @param {string} details - Additional details
 * @param {string} adminEmail - Admin email
 * @returns {object} Audit log entry
 */
export function createAuditLog(action, details, adminEmail) {
  return {
    timestamp: new Date().toISOString(),
    action: action,
    details: details,
    adminEmail: adminEmail,
    userAgent: navigator.userAgent,
    ipAddress: "unknown", // IP detection would require backend
  };
}

/**
 * Redirect to login if not authenticated
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {string} loginPageUrl - URL of login page
 */
export function redirectIfNotAuthenticated(
  isAuthenticated,
  loginPageUrl = "admin-login.html"
) {
  if (!isAuthenticated) {
    window.location.href = loginPageUrl;
  }
}

/**
 * Log audit event (in production, send to backend)
 * @param {object} auditLog - Audit log entry
 */
export async function logAuditEvent(auditLog) {
  // In production with backend:
  // await fetch('/api/audit', { method: 'POST', body: JSON.stringify(auditLog) });

  // For now, log to console and localStorage
  console.log("🔐 Audit Log:", auditLog);

  // Store locally for retrieval
  const logs = JSON.parse(localStorage.getItem("adminAuditLogs") || "[]");
  logs.push(auditLog);
  // Keep only last 100 logs
  if (logs.length > 100) logs.shift();
  localStorage.setItem("adminAuditLogs", JSON.stringify(logs));
}

/**
 * Get all stored audit logs
 * @returns {array} Array of audit log entries
 */
export function getAuditLogs() {
  return JSON.parse(localStorage.getItem("adminAuditLogs") || "[]");
}

/**
 * Add admin email to whitelist (for authorized admins only)
 * @param {string} email - Email to add
 */
export function addAdminEmail(email) {
  const normalized = email.toLowerCase();
  if (!ADMIN_EMAILS.includes(normalized)) {
    ADMIN_EMAILS.push(normalized);
    // Note: This only persists in memory. For permanent storage, use Firebase or backend.
    console.log(`✅ Added admin email: ${normalized}`);
  }
}

/**
 * Remove admin email from whitelist (for authorized admins only)
 * @param {string} email - Email to remove
 */
export function removeAdminEmail(email) {
  const normalized = email.toLowerCase();
  const index = ADMIN_EMAILS.indexOf(normalized);
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    console.log(`✅ Removed admin email: ${normalized}`);
  }
}

/**
 * Check if email is valid format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Generate timestamp for exported files
 * @returns {string} Timestamp string (YYYY-MM-DD_HH-MM-SS)
 */
export function getExportTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

/**
 * Hash password (basic, not cryptographically secure - for reference only)
 * Always use Firebase Auth for production
 * @param {string} password - Password to hash
 * @returns {string} Hashed password
 */
export function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = "info", duration = 3000) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : type === "warning"
            ? "#f97316"
            : "#3b82f6"
        };
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Sanitize data for safe display (prevent XSS)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create a downloadable file blob
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (e.g., 'YYYY-MM-DD')
 * @returns {string} Formatted date
 */
export function formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * Deep clone an object (safe for JSON-serializable objects)
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge multiple objects
 * @param {...object} objects - Objects to merge
 * @returns {object} Merged object
 */
export function mergeObjects(...objects) {
  return Object.assign({}, ...objects);
}

