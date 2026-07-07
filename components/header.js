/**
 * Header Component Module
 * Renders the top navigation bar with theme toggle, user menu, etc.
 */

import { notificationService } from "../services/notification-service.js";
import { themeService } from "../services/theme-service.js";

export class HeaderComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.user = null;
  }

  /**
   * Initialize header with user info
   */
  init(user) {
    this.user = user;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render header HTML
   */
  render() {
    const timeNow = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.container.innerHTML = `
      <div class="header-wrapper">
        <div class="header-left">
          <h1 class="header-title">🌿 EcoSterile</h1>
          <p class="header-subtitle">A Bio Acidic/Alkaline soil correction system using 'Potassium Bicarbonate' , 'Fulvic + Citric acid' for rapid microbe safe pH stabilization</p>
        </div>

        <div class="header-center">
          <div class="system-label" style="color: #22c55e; font-weight: 700;">pH Regulator Dashboard</div>
          <div class="system-time">
            <span class="time-icon">🕐</span>
            <span id="headerTime">${timeNow}</span>
          </div>
        </div>

        <div class="header-right">
          <!-- notification bell with unread count -->
          <button id="notifBtn" class="header-btn notif-btn">
            <span class="bell-icon">🔔</span>
            <span id="notifCount" class="notif-count"></span>
          </button>
          <div id="notifDropdown" class="dropdown hidden"></div>

          <!-- theme toggle button -->
          <button id="themeToggle" class="header-btn theme-btn">
            <span id="themeIcon">🌗</span>
          </button>

          <button id="userMenu" class="header-btn user-btn">
            <span class="user-icon">👤</span>
            <span class="user-name">${this.user?.displayName || "User"}</span>
          </button>

          <div id="userDropdown" class="dropdown hidden">
            <a href="#" id="lidarLink" class="dropdown-item">🗺️ Lidar Field Mapping</a>
            <a href="#" id="profileLink" class="dropdown-item">⚙️ Profile</a>
            <a href="#" id="settingsLink" class="dropdown-item">🔧 Settings</a>
            <hr class="dropdown-divider">
            <button id="logoutBtn" class="dropdown-item danger">🚪 Sign Out</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Update time every second
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);

    // Notification button and dropdown
    const notifBtn = document.getElementById("notifBtn");
    const notifDropdown = document.getElementById("notifDropdown");
    notifBtn.addEventListener("click", () => {
      notifDropdown.classList.toggle("hidden");
      if (!notifDropdown.classList.contains("hidden")) {
        this.renderNotifications();
        notificationService.markAllRead();
        this.refreshNotificationBadge();
      }
    });

    document.addEventListener("click", (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.add("hidden");
      }
    });

    // User menu dropdown
    const userMenu = document.getElementById("userMenu");
    const dropdown = document.getElementById("userDropdown");

    userMenu.addEventListener("click", () => {
      dropdown.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userMenu.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });

    // Navigation links
    const lidarLink = document.getElementById("lidarLink");
    const profileLink = document.getElementById("profileLink");
    const settingsLink = document.getElementById("settingsLink");

    // Theme toggle handler
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", async () => {
        const newTheme = await themeService.toggleTheme();
        this.updateThemeIcon(newTheme);
      });
    }

    if (lidarLink) {
      lidarLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "./lidar.html";
      });
    }

    if (profileLink) {
      profileLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "./profile.html";
      });
    }

    if (settingsLink) {
      settingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "./settings.html";
      });
    }

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      this.handleLogout();
    });
  }

  /**
   * Toggle theme between light and dark
   * (deprecated, use themeService instead)
   */
  toggleTheme() {
    return themeService.toggleTheme();
  }

  /**
   * Update current time
   */
  updateTime() {
    const timeEl = document.getElementById("headerTime");
    if (timeEl) {
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      timeEl.textContent = now;
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    // This will be implemented in the dashboard
    window.dispatchEvent(new CustomEvent("logout"));
  }

  /**
   * Update the icon inside the theme toggle button
   */
  updateThemeIcon(theme) {
    const icon = document.getElementById("themeIcon");
    if (!icon) return;
    icon.textContent = theme === "dark" ? "🌙" : "☀️";
  }

  /**
   * Refresh unread badge count
   */
  refreshNotificationBadge() {
    const countEl = document.getElementById("notifCount");
    if (!countEl) return;
    const count = notificationService.getUnreadCount();
    countEl.textContent = count > 0 ? count : "";
  }

  /**
   * Render all notifications inside dropdown
   */
  renderNotifications() {
    const list = notificationService.getAll();
    const container = document.getElementById("notifDropdown");
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = `<div class="dropdown-item">No notifications</div>`;
      return;
    }

    container.innerHTML = list
      .map(
        (n) => `
        <div class="dropdown-item notification-item">
          <strong>${n.title}</strong><br>
          <span class="notif-body">${n.body}</span><br>
          <small class="notif-time">${new Date(n.timestamp).toLocaleString()}</small>
        </div>`
      )
      .join("");
  }

  /**
   * Update user info
   */
  updateUser(user) {
    this.user = user;
    const userNameEl = document.querySelector(".user-name");
    if (userNameEl) {
      userNameEl.textContent = user?.displayName || "User";
    }
  }
}
