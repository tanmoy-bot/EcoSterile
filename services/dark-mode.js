/**
 * Dark Mode Service
 * Manages dark mode state and preferences for the dashboard
 * This service ONLY affects dashboard.html
 */

export class DarkModeService {
  constructor() {
    this.STORAGE_KEY = "ecoSterile-theme";
    this.DARK_MODE_CLASS = "dark-mode";
    this.THEME_ATTR = "data-theme";
  }

  /**
   * Initialize dark mode from localStorage or system preference
   * Only runs on dashboard
   */
  init() {
    if (!this.isDashboardPage()) {
      return;
    }

    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");

    this.setTheme(theme);
    this.setupSystemPreferenceListener();
  }

  /**
   * Check if current page is dashboard
   */
  isDashboardPage() {
    return window.location.pathname.includes("dashboard.html");
  }

  /**
   * Set theme on document root
   */
  setTheme(theme) {
    const html = document.documentElement;
    html.setAttribute(this.THEME_ATTR, theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  /**
   * Get current theme
   */
  getTheme() {
    return document.documentElement.getAttribute(this.THEME_ATTR) || "light";
  }

  /**
   * Toggle between dark and light
   */
  toggleTheme() {
    const current = this.getTheme();
    const newTheme = current === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Listen to system preference changes
   */
  setupSystemPreferenceListener() {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    darkModeQuery.addEventListener("change", (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? "dark" : "light");
      }
    });
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode() {
    return this.getTheme() === "dark";
  }

  /**
   * Apply dark mode styles to Chart.js
   * Used for pH chart styling
   */
  getChartDarkModeConfig() {
    if (!this.isDarkMode()) {
      return {
        gridColor: "rgba(15, 23, 42, 0.1)",
        textColor: "#111827",
      };
    }

    return {
      gridColor: "rgba(255, 255, 255, 0.05)",
      textColor: "#eaeaea",
      backgroundColor: "rgba(13, 17, 23, 0.5)",
    };
  }
}

// Export singleton instance
export const darkModeService = new DarkModeService();
