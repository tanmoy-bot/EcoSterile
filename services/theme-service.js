/**
 * Theme Service (Database-First)
 * Manages theme state with database as single source of truth
 * Supports dark mode, light mode, auto-sync across pages
 */

import {
  ref,
  get,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { db } from "./firebase.js";

export class ThemeService {
  constructor() {
    this.THEME_CLASS_DARK = "theme-dark";
    this.THEME_CLASS_LIGHT = "theme-light";
    this.listeners = []; // For cross-page sync
    this.currentUserId = null;
    this.unsubscribe = null; // For real-time DB listener
  }

  /**
   * Initialize theme from database on app load
   * MUST be called before rendering UI
   */
  async initializeTheme(userId) {
    this.currentUserId = userId;
    console.log("🎨 Theme Service: Initializing theme for user", userId);

    try {
      // 1. Fetch theme from database
      const settingsRef = ref(db, `users/${userId}/settings`);
      const snapshot = await get(settingsRef);

      let theme = "light"; // Default
      if (snapshot.exists()) {
        const settings = snapshot.val();
        theme = settings.theme || "light";
        console.log("✅ Theme loaded from DB:", theme);
      } else {
        console.log("⚠️ No settings in DB, using default:", theme);
      }

      // 2. Apply theme to <body> BEFORE any UI renders
      this.applyTheme(theme, false); // false = don't save, just apply

      // 3. Set up real-time listener for cross-page sync
      this.setupRealtimeListener(userId);

      return theme;
    } catch (error) {
      console.error("❌ Error initializing theme:", error);
      // Fallback to light mode
      this.applyTheme("light", false);
      return "light";
    }
  }

  /**
   * Listen to theme changes in real-time (for sync across pages)
   */
  setupRealtimeListener(userId) {
    const settingsRef = ref(db, `users/${userId}/settings/theme`);

    this.unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const newTheme = snapshot.val();
          console.log("🔄 Theme updated in DB:", newTheme);
          this.applyTheme(newTheme, false);

          // Notify listeners (other pages, components)
          this.notifyListeners(newTheme);
        }
      },
      (error) => {
        console.error("❌ Error listening to theme:", error);
      }
    );
  }

  /**
   * Apply theme to <body> element
   * @param {string} theme - "dark" or "light"
   * @param {boolean} save - If true, also save to database
   */
  applyTheme(theme, save = true) {
    if (!["dark", "light"].includes(theme)) {
      console.warn("⚠️ Invalid theme:", theme);
      theme = "light";
    }

    // Remove old classes
    document.body.classList.remove(
      this.THEME_CLASS_DARK,
      this.THEME_CLASS_LIGHT
    );

    // Add new class
    if (theme === "dark") {
      document.body.classList.add(this.THEME_CLASS_DARK);
    } else {
      document.body.classList.add(this.THEME_CLASS_LIGHT);
    }

    // Update data attribute (for CSS)
    document.documentElement.setAttribute("data-theme", theme);
    console.log(`✅ Theme applied: ${theme}`);

    // Optionally save to database
    if (save && this.currentUserId) {
      this.saveThemeToDatabase(theme);
    }
  }

  /**
   * Save theme to database
   */
  async saveThemeToDatabase(theme) {
    if (!this.currentUserId) {
      console.warn("⚠️ No user ID available, cannot save theme");
      return;
    }

    try {
      const settingsRef = ref(db, `users/${this.currentUserId}/settings`);
      await update(settingsRef, { theme });
      console.log("💾 Theme saved to DB:", theme);
    } catch (error) {
      console.error("❌ Error saving theme to DB:", error);
    }
  }

  /**
   * Toggle between dark and light modes
   * Updates database and applies theme
   */
  async toggleTheme() {
    const current = this.getTheme();
    const newTheme = current === "dark" ? "light" : "dark";
    console.log(`🔄 Toggling theme: ${current} → ${newTheme}`);

    // Apply immediately (don't wait for DB)
    this.applyTheme(newTheme, true);

    return newTheme;
  }

  /**
   * Get current theme
   */
  getTheme() {
    if (document.body.classList.contains(this.THEME_CLASS_DARK)) {
      return "dark";
    }
    return "light";
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode() {
    return this.getTheme() === "dark";
  }

  /**
   * Subscribe to theme changes
   */
  onChange(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners of theme change
   */
  notifyListeners(theme) {
    this.listeners.forEach((callback) => {
      try {
        callback(theme);
      } catch (error) {
        console.error("❌ Error in theme listener:", error);
      }
    });
  }

  /**
   * Cleanup on page unload
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      console.log("🧹 Theme listener cleaned up");
    }
  }

  /**
   * Get Chart.js dark mode config
   */
  getChartConfig() {
    const isDark = this.isDarkMode();

    if (!isDark) {
      return {
        colors: {
          text: "#0F1719",
          grid: "rgba(0, 0, 0, 0.1)",
          line: "#3fb950",
          area: "rgba(63, 185, 80, 0.08)",
        },
      };
    }

    // Dark mode colors
    return {
      colors: {
        text: "#9BA3AF", // Axis labels
        grid: "rgba(255, 255, 255, 0.06)", // Grid lines
        line: "#4fdd9b", // Muted green
        area: "rgba(63, 185, 80, 0.12)", // Area fill (max 0.12)
      },
    };
  }
}

// Export singleton instance
export const themeService = new ThemeService();
