/**
 * pH Service - Core pH logic & pump control
 * SAME logic as original EcoSterile, extracted to service layer
 */

// Dynamic optimal pH range (defaults)
let optimalPHMin = 6.5;
let optimalPHMax = 7.5;

// Pump log data
let pumpLog = [];
let lastPump = null;
let phHistory = {
  timestamps: [],
  values: [],
};

/**
 * Set optimal pH range for current crop
 */
export function setOptimalPHRange(min, max) {
  optimalPHMin = parseFloat(min) || optimalPHMin;
  optimalPHMax = parseFloat(max) || optimalPHMax;
}

/**
 * Get current optimal pH range
 */
export function getOptimalPHRange() {
  return { min: optimalPHMin, max: optimalPHMax };
}

/**
 * Get pH status
 */
export function getPHStatus(pH) {
  if (pH < optimalPHMin) {
    return {
      status: "acidic",
      label: "🔴 Too Acidic",
      color: "#e74c3c",
      pump: "basic",
    };
  } else if (pH > optimalPHMax) {
    return {
      status: "basic",
      label: "🔵 Too Basic",
      color: "#3498db",
      pump: "acidic",
    };
  } else {
    return {
      status: "optimal",
      label: "🟢 Optimal",
      color: "#27ae60",
      pump: null,
    };
  }
}

/**
 * Calculate pump decision based on pH
 */
export function calculatePumpAction(pH) {
  const status = getPHStatus(pH);
  return status.pump; // returns 'basic', 'acidic', or null
}

/**
 * Log pump activity
 */
export function logPumpActivity(type, concentration = "1%") {
  const timestamp = new Date();
  const entry = {
    timestamp: timestamp.toISOString(),
    type: type, // 'basic' or 'acidic'
    concentration: concentration,
    solution:
      type === "basic" ? "Ammonium Hydroxide (NH4OH)" : "Acetic Acid (CH3COOH)",
  };

  pumpLog.push(entry);
  lastPump = entry;

  // Keep only last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  pumpLog = pumpLog.filter((log) => new Date(log.timestamp) > thirtyDaysAgo);

  savePHData();
  return entry;
}

/**
 * Add pH reading
 */
export function addPHReading(pH) {
  const timestamp = new Date().toISOString();
  phHistory.timestamps.push(timestamp);
  phHistory.values.push(pH);

  // Keep only last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const validIndices = phHistory.timestamps
    .map((time, idx) => (new Date(time) > thirtyDaysAgo ? idx : -1))
    .filter((idx) => idx !== -1);

  if (validIndices.length < phHistory.timestamps.length) {
    phHistory.timestamps = validIndices.map((idx) => phHistory.timestamps[idx]);
    phHistory.values = validIndices.map((idx) => phHistory.values[idx]);
  }

  savePHData();
}

/**
 * Get pump activity log
 */
export function getPumpLog() {
  return [...pumpLog];
}

/**
 * Get last pump action
 */
export function getLastPump() {
  return lastPump ? { ...lastPump } : null;
}

/**
 * Get pH history
 */
export function getPHHistory() {
  return {
    timestamps: [...phHistory.timestamps],
    values: [...phHistory.values],
  };
}

/**
 * Calculate statistics
 */
export function calculateStats() {
  const values = phHistory.values;

  if (values.length === 0) {
    return {
      average: null,
      min: null,
      max: null,
      basicPumpCount: 0,
      acidicPumpCount: 0,
    };
  }

  const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(
    2
  );
  const min = Math.min(...values).toFixed(1);
  const max = Math.max(...values).toFixed(1);

  const basicCount = pumpLog.filter((log) => log.type === "basic").length;
  const acidicCount = pumpLog.filter((log) => log.type === "acidic").length;

  return {
    average: parseFloat(average),
    min: parseFloat(min),
    max: parseFloat(max),
    basicPumpCount: basicCount,
    acidicPumpCount: acidicCount,
  };
}

/**
 * Get time ago string
 */
export function getTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);

  if (seconds < 60) return seconds + " sec ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hr ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + " day" + (days > 1 ? "s" : "") + " ago";

  return new Date(date).toLocaleDateString();
}

/**
 * Clear all data
 */
export function clearAllData() {
  phHistory.timestamps = [];
  phHistory.values = [];
  pumpLog = [];
  lastPump = null;
  savePHData();
}

/**
 * Save pH data to localStorage
 */
function savePHData() {
  const data = {
    phHistory,
    pumpLog,
    lastPump,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("ecosterile_ph_data", JSON.stringify(data));
}

/**
 * Load pH data from localStorage
 */
export function loadPHData() {
  try {
    const stored = localStorage.getItem("ecosterile_ph_data");
    if (stored) {
      const data = JSON.parse(stored);
      phHistory = data.phHistory || { timestamps: [], values: [] };
      pumpLog = data.pumpLog || [];
      lastPump = data.lastPump || null;
    }
  } catch (e) {
    console.error("Failed to load pH data:", e);
  }
}

// Load data on initialization
loadPHData();
