/**
 * Database Service - Firebase Realtime Database operations
 * Handles reading/writing to Firebase
 */

import { db } from "./firebase-config.js";
import {
  ref,
  push,
  onValue,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

/**
 * Write pH reading to Firebase
 */
export async function writePHReading(pH) {
  try {
    await push(ref(db, "phReadings"), {
      value: pH,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to write pH reading:", err);
    return false;
  }
}

/**
 * Write pump activity to Firebase
 */
export async function writePumpActivity(type, concentration = "1%") {
  try {
    await push(ref(db, "pumpActivity"), {
      type: type,
      concentration: concentration,
      timestamp: new Date().toISOString(),
      solution:
        type === "basic"
          ? "Ammonium Hydroxide (NH4OH)"
          : "Acetic Acid (CH3COOH)",
    });
    return true;
  } catch (err) {
    console.error("Failed to write pump activity:", err);
    return false;
  }
}

/**
 * Listen to pH readings from Firebase
 */
export function onPHReadingsUpdate(callback) {
  const phRef = ref(db, "phReadings");
  return onValue(
    phRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const readings = Object.values(data)
        .filter((entry) => entry.timestamp && entry.value !== undefined)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      callback(readings);
    },
    (error) => {
      console.error("Error reading pH data:", error);
    }
  );
}

/**
 * Listen to pump activities from Firebase
 */
export function onPumpActivityUpdate(callback) {
  const pumpRef = ref(db, "pumpActivity");
  return onValue(
    pumpRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const activities = Object.values(data)
        .filter((entry) => entry.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      callback(activities);
    },
    (error) => {
      console.error("Error reading pump activity:", error);
    }
  );
}

/**
 * Write user crop preference
 */
export async function saveCropPreference(userId, cropData) {
  try {
    await set(ref(db, `users/${userId}/crop`), {
      ...cropData,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to save crop preference:", err);
    return false;
  }
}

/**
 * Read user crop preference
 */
export function onCropPreferenceUpdate(userId, callback) {
  const cropRef = ref(db, `users/${userId}/crop`);
  return onValue(
    cropRef,
    (snapshot) => {
      const data = snapshot.val();
      callback(data || null);
    },
    (error) => {
      console.error("Error reading crop preference:", error);
    }
  );
}

/**
 * Get filtered pH readings by time range
 */
export function getFilteredReadings(readings, timeRange = "24h") {
  const now = new Date();
  let cutoffTime;

  switch (timeRange) {
    case "24h":
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      cutoffTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      cutoffTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
  }

  return readings.filter((reading) => new Date(reading.timestamp) > cutoffTime);
}
