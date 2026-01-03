/**
 * Firebase Configuration & Initialization
 * Central service for all Firebase operations
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6G8DgCBqA9lFMlKfGIC_JCEaZU-GuPxs",
  authDomain: "eco-sterile.firebaseapp.com",
  databaseURL:
    "https://eco-sterile-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eco-sterile",
  storageBucket: "eco-sterile.firebasestorage.app",
  messagingSenderId: "429228597840",
  appId: "1:429228597840:web:45c0f163c578480fc2a755",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Initialize user database structure
 * Creates all required sub-nodes for a new user
 * MUST run exactly once immediately after sign-up
 */
async function initializeUserDatabase(userId, email, displayName, location) {
  const now = new Date().toISOString();

  try {
    console.log("🚀 Starting initialization for user:", userId);
    console.log("   Email:", email);
    console.log("   DisplayName:", displayName);
    console.log("   Location parameter received:", location);

    // Create profile with all required fields
    console.log("📝 Step 1: Creating profile...");
    try {
      await set(ref(db, `users/${userId}/profile`), {
        email: email,
        displayName: displayName || "",
        photoURL: null,
        currentCrop: null,
        cropMinPH: null,
        cropMaxPH: null,
        lastCropChange: null,
        createdAt: now,
        lastVisited: now,
      });
      console.log("✅ Profile created successfully");
    } catch (e) {
      console.error("❌ Profile creation FAILED:", e.message);
      throw e;
    }

    // Create location object with all required fields
    // IMPORTANT: Never store "Not provided" as a string - use empty strings instead
    const cityValue = location ? location.trim() : "";
    console.log(
      "📝 Step 2: Creating location with city:",
      cityValue || "(empty)"
    );
    console.log("   Raw input:", location);
    try {
      const locationRef = ref(db, `users/${userId}/location`);
      console.log("   Writing to path:", `users/${userId}/location`);
      await set(locationRef, {
        country: "",
        state: "",
        city: cityValue,
        latitude: null,
        longitude: null,
        updatedAt: now,
      });
      console.log("✅ Location created successfully with city:", cityValue);
    } catch (e) {
      console.error("❌ Location creation FAILED:", e.message);
      console.error("   Error code:", e.code);
      throw e;
    }

    // Create settings with all required fields
    console.log("📝 Step 3: Creating settings...");
    try {
      await set(ref(db, `users/${userId}/settings`), {
        theme: "light",
        autoPump: true,
        preferredCrop: "",
        notifications: {
          phAlerts: true,
          systemUpdates: true,
          weeklySummary: true,
        },
        updatedAt: now,
      });
      console.log("✅ Settings created successfully");
    } catch (e) {
      console.error("❌ Settings creation FAILED:", e.message);
      throw e;
    }

    // Create device object with all required fields
    console.log("📝 Step 4: Creating device...");
    try {
      await set(ref(db, `users/${userId}/device`), {
        status: "disconnected",
        lastSeen: now,
      });
      console.log("✅ Device created successfully");
    } catch (e) {
      console.error("❌ Device creation FAILED:", e.message);
      throw e;
    }

    // Debug flag to verify initialization completed
    console.log("📝 Step 5: Setting init flag...");
    try {
      await set(ref(db, `users/${userId}/_initDone`), true);
      console.log("✅ Init flag set successfully");
    } catch (e) {
      console.error("❌ Init flag FAILED:", e.message);
      throw e;
    }

    console.log(`\n🎉 USER INITIALIZATION COMPLETE for ${userId}`);
    console.log(`  ├─ profile ✅`);
    console.log(`  ├─ location ✅`);
    console.log(`  ├─ settings ✅`);
    console.log(`  ├─ device ✅`);
    console.log(`  └─ _initDone ✅`);

    return { success: true };
  } catch (error) {
    console.error("❌ INITIALIZATION FAILED:", error);
    console.error("   Full error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email, password, userData) {
    try {
      console.log("🔐 Starting sign-up process for:", email);
      console.log("📋 User data received:", {
        email,
        fullName: userData.fullName,
        location: userData.location,
        locationExists: !!userData.location,
        locationTrimmed: userData.location
          ? userData.location.trim()
          : "(empty)",
      });

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("✅ Auth user created with uid:", user.uid);

      // Initialize complete user database structure
      console.log("🔄 Calling initializeUserDatabase with:");
      console.log("   uid:", user.uid);
      console.log("   email:", email);
      console.log("   fullName:", userData.fullName);
      console.log("   location:", userData.location);

      const initResult = await initializeUserDatabase(
        user.uid,
        email,
        userData.fullName || "",
        userData.location ? userData.location.trim() : "" // Use empty string if no location
      );

      console.log("📋 Init result:", initResult);

      if (!initResult.success) {
        console.error("❌ Initialization failed, throwing error");
        throw new Error(initResult.error);
      }

      console.log("✅ Sign-up completed successfully for:", user.uid);
      return { success: true, user };
    } catch (error) {
      console.error("❌ Sign-up failed:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Try to update last visited time, but don't fail if it doesn't exist
      try {
        await update(ref(db, `users/${user.uid}/profile`), {
          lastVisited: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Could not update profile timestamp:", e);
      }

      return { success: true, user };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const now = new Date().toISOString();

      // Check if user profile exists
      const profileRef = ref(db, `users/${user.uid}/profile`);
      const snapshot = await get(profileRef);

      if (!snapshot.exists()) {
        // First login - initialize complete user database
        // IMPORTANT: Pass empty string, not "Not provided" for new Google users
        const initResult = await initializeUserDatabase(
          user.uid,
          user.email,
          user.displayName || "",
          "" // Empty string for new users without location
        );

        if (!initResult.success) {
          throw new Error(initResult.error);
        }
      } else {
        // Existing user - update last visited
        await update(profileRef, {
          lastVisited: now,
        });
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  },
};

/**
 * Database Service - pH Readings
 */
export const phService = {
  /**
   * Add pH reading
   * Uses numeric timestamps (Date.now()) for reliable filtering and comparison
   * This ensures multi-day filtering (24h, 7d, 30d) works correctly
   */
  async addReading(userId, phValue) {
    try {
      const reading = {
        value: phValue,
        timestamp: Date.now(), // Numeric timestamp for reliable filtering
      };
      // Store in user-scoped path for complete data isolation
      const ref_path = ref(db, `users/${userId}/phReadings`);
      await push(ref_path, reading);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get pH readings for a user
   */
  async getReadings(userId, limit = 500) {
    try {
      // Query user-scoped phReadings for complete data isolation
      // Limit to 500 readings for performance
      const ref_path = query(
        ref(db, `users/${userId}/phReadings`),
        orderByChild("timestamp"),
        limitToLast(limit)
      );
      const snapshot = await get(ref_path);

      if (!snapshot.exists()) {
        console.log(`No pH readings found for user ${userId}`);
        return { success: true, readings: [] };
      }

      const readings = [];
      snapshot.forEach((child) => {
        const data = child.val();
        // Validate data structure
        if (data && typeof data.value === "number" && data.timestamp) {
          readings.push({
            id: child.key,
            value: data.value,
            timestamp: data.timestamp,
          });
        }
      });

      console.log(
        `Fetched ${readings.length} valid pH readings for user ${userId}`
      );
      return { success: true, readings };
    } catch (error) {
      console.error("Error fetching pH readings:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listen to real-time pH updates for user
   */
  onReadingsUpdate(userId, callback) {
    // Listen to user-scoped phReadings
    const ref_path = query(
      ref(db, `users/${userId}/phReadings`),
      orderByChild("timestamp"),
      limitToLast(100)
    );
    return onValue(ref_path, (snapshot) => {
      const readings = [];
      snapshot.forEach((child) => {
        const data = child.val();
        console.log("📊 Reading snapshot:", data);

        readings.push({
          id: child.key,
          value: data.value,
          timestamp: data.timestamp,
        });
      });

      console.log("📊 All readings in callback:", readings.length);
      callback(readings);
    });
  },
};

/**
 * Database Service - Pump Activities
 */
export const pumpService = {
  /**
   * Log pump activity
   * Uses numeric timestamps (Date.now()) for consistent filtering across the app
   */
  async logActivity(userId, pumpType, solution, concentration) {
    try {
      const activity = {
        type: pumpType, // 'basic' or 'acidic'
        solution: solution,
        concentration: concentration,
        timestamp: Date.now(), // Numeric timestamp for reliable operations
      };
      // Store in user-scoped path for complete data isolation
      const ref_path = ref(db, `users/${userId}/pumpLogs`);
      await push(ref_path, activity);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get pump activity logs for user
   */
  async getLogs(userId, limit = 100) {
    try {
      // Query user-scoped pumpLogs
      const ref_path = query(
        ref(db, `users/${userId}/pumpLogs`),
        orderByChild("timestamp"),
        limitToLast(limit)
      );
      const snapshot = await get(ref_path);

      if (!snapshot.exists()) {
        console.log(`No pump logs found for user ${userId}`);
        return { success: true, logs: [] };
      }

      const logs = [];
      snapshot.forEach((child) => {
        logs.push({
          id: child.key,
          ...child.val(),
        });
      });

      console.log(`Fetched ${logs.length} pump logs for user ${userId}`);
      return { success: true, logs: logs.reverse() };
    } catch (error) {
      console.error("Error fetching pump logs:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listen to real-time pump activity updates for user
   */
  onLogsUpdate(userId, callback) {
    // Listen to user-scoped pumpLogs
    const ref_path = query(
      ref(db, `users/${userId}/pumpLogs`),
      orderByChild("timestamp"),
      limitToLast(50)
    );
    return onValue(ref_path, (snapshot) => {
      const logs = [];
      snapshot.forEach((child) => {
        logs.push({
          id: child.key,
          ...child.val(),
        });
      });
      callback(logs.reverse());
    });
  },
};

/**
 * Database Service - User Profile & Settings
 */
export const userService = {
  /**
   * Get user profile
   */
  async getProfile(userId) {
    try {
      const snapshot = await get(ref(db, `users/${userId}/profile`));
      if (!snapshot.exists()) {
        return { success: false, error: "Profile not found" };
      }
      return { success: true, profile: snapshot.val() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      await update(ref(db, `users/${userId}/profile`), updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Save selected crop
   */
  async saveCropSelection(userId, cropData) {
    try {
      await update(ref(db, `users/${userId}/profile`), {
        currentCrop: cropData.value,
        cropMinPH: cropData.minPH,
        cropMaxPH: cropData.maxPH,
        lastCropChange: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Save system settings
   */
  async saveSettings(userId, settings) {
    try {
      await set(ref(db, `users/${userId}/settings`), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get system settings
   */
  async getSettings(userId) {
    try {
      const snapshot = await get(ref(db, `users/${userId}/settings`));
      if (!snapshot.exists()) {
        return { success: true, settings: {} };
      }
      return { success: true, settings: snapshot.val() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user location
   * IMPORTANT: Never rely on string comparison with "Not provided"
   * Construct display location only from truthy non-empty values
   */
  async getLocation(userId) {
    try {
      const snapshot = await get(ref(db, `users/${userId}/location`));

      if (!snapshot.exists()) {
        // Fallback if location node doesn't exist
        console.warn("⚠️  Location node does not exist for user:", userId);
        console.warn("   This can happen with legacy accounts");
        return {
          success: true,
          location: "Not provided",
          data: { city: "", state: "", country: "" },
          isEmpty: true,
        };
      }

      const locationData = snapshot.val();
      console.log(
        "📍 Raw location snapshot from DB:",
        JSON.stringify(locationData)
      );

      // Defensive: Handle null values
      if (!locationData || typeof locationData !== "object") {
        console.warn(
          "⚠️  Location data is invalid (null or not object):",
          locationData
        );
        return {
          success: true,
          location: "Not provided",
          data: { city: "", state: "", country: "" },
          isEmpty: true,
        };
      }

      // Sanitize each field - trim and handle empty strings
      const city = (locationData.city || "").trim();
      const state = (locationData.state || "").trim();
      const country = (locationData.country || "").trim();

      console.log("📍 Sanitized values:");
      console.log("   City:", city ? `"${city}"` : "(empty)");
      console.log("   State:", state ? `"${state}"` : "(empty)");
      console.log("   Country:", country ? `"${country}"` : "(empty)");

      // Build display location from only truthy, non-empty values
      const locationParts = [];
      if (city) locationParts.push(city);
      if (state) locationParts.push(state);
      if (country) locationParts.push(country);

      const isEmpty = locationParts.length === 0;
      const displayLocation = isEmpty
        ? "Not provided"
        : locationParts.join(", ");

      console.log("📍 Display location constructed:", displayLocation);
      console.log("   Is empty?:", isEmpty);

      return {
        success: true,
        location: displayLocation,
        data: locationData,
        isEmpty: isEmpty,
      };
    } catch (error) {
      console.error("❌ Error fetching location:", error);
      return {
        success: false,
        error: error.message,
        location: "Not provided",
        isEmpty: true,
      };
    }
  },

  /**
   * Update user location
   * IMPORTANT: Never store "Not provided" as a string value
   */
  async updateLocation(userId, locationData) {
    try {
      const now = new Date().toISOString();

      // Sanitize all fields - never store "Not provided"
      const countryValue = locationData.country
        ? locationData.country.trim()
        : "";
      const stateValue = locationData.state ? locationData.state.trim() : "";
      const cityValue = locationData.city ? locationData.city.trim() : "";

      console.log("📍 Updating location for user:", userId);
      console.log("   Country:", countryValue || "(empty)");
      console.log("   State:", stateValue || "(empty)");
      console.log("   City:", cityValue || "(empty)");
      console.log("   Latitude:", locationData.latitude || null);
      console.log("   Longitude:", locationData.longitude || null);

      await update(ref(db, `users/${userId}/location`), {
        country: countryValue,
        state: stateValue,
        city: cityValue,
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        updatedAt: now,
      });

      console.log("✅ Location updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating location:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Migrate user - create missing location node if it doesn't exist
   * Fixes legacy accounts that were created before location support
   */
  async ensureLocationExists(userId) {
    try {
      console.log("🔄 Ensuring location exists for user:", userId);
      const snapshot = await get(ref(db, `users/${userId}/location`));

      if (snapshot.exists()) {
        console.log("✅ Location already exists for user:", userId);
        return { success: true, created: false };
      }

      // Location doesn't exist - create it for legacy user
      console.log("⚠️  Location missing for user:", userId);
      console.log("   Creating location node now...");

      const now = new Date().toISOString();
      await set(ref(db, `users/${userId}/location`), {
        country: "",
        state: "",
        city: "",
        latitude: null,
        longitude: null,
        updatedAt: now,
      });

      console.log("✅ Location node created successfully for legacy user");
      return { success: true, created: true };
    } catch (error) {
      console.error("❌ Error ensuring location exists:", error);
      return { success: false, error: error.message, created: false };
    }
  },
};

/**
 * Database Service - System Status
 */
export const systemService = {
  /**
   * Update Arduino connection status
   */
  async updateArduinoStatus(userId, isConnected) {
    try {
      await update(ref(db, `users/${userId}/status`), {
        arduinoConnected: isConnected,
        lastStatusUpdate: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Listen to system status
   */
  onStatusUpdate(userId, callback) {
    return onValue(ref(db, `users/${userId}/status`), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  },
};

export { auth, db };
