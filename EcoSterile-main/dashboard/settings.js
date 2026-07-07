import { authService, db } from "../services/firebase.js";
import { themeService } from "../services/theme-service.js";
import {
  ref,
  get,
  update,
  set,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { HeaderComponent } from "../components/header.js";

// Crop Database - Comprehensive List with pH Ranges and Images
// ==========================================
const CROPS_DATABASE = [
  // ===== CEREALS =====
  {
    value: "rice",
    label: "Rice",
    minPH: 5.5,
    maxPH: 6.5,
    image: "rice.png",
  },
  {
    value: "wheat",
    label: "Wheat",
    minPH: 6.0,
    maxPH: 7.5,
    image: "wheat.png",
  },
  {
    value: "maize",
    label: "Maize",
    minPH: 5.5,
    maxPH: 7.5,
    image: "maize.png",
  },
  {
    value: "barley",
    label: "Barley",
    minPH: 6.5,
    maxPH: 7.5,
    image: "barley.png",
  },
  {
    value: "sorghum",
    label: "Sorghum",
    minPH: 5.5,
    maxPH: 8.0,
    image: "sorghum.png",
  },

  // ===== PULSES =====
  {
    value: "chickpea",
    label: "Chickpea",
    minPH: 6.0,
    maxPH: 7.5,
    image: "chickpea.png",
  },
  {
    value: "pigeon_pea",
    label: "Pigeon Pea",
    minPH: 5.5,
    maxPH: 7.0,
    image: "pigeon_pea.png",
  },
  {
    value: "lentil",
    label: "Lentil",
    minPH: 6.0,
    maxPH: 7.5,
    image: "lentil.png",
  },
  {
    value: "moong",
    label: "Moong Bean",
    minPH: 5.5,
    maxPH: 7.0,
    image: "green_gram.png",
  },
  {
    value: "urad",
    label: "Urad Bean",
    minPH: 5.5,
    maxPH: 7.0,
    image: "black_gram.png",
  },

  // ===== VEGETABLES =====
  {
    value: "tomato",
    label: "Tomato",
    minPH: 6.0,
    maxPH: 6.8,
    image: "tomato.png",
  },
  {
    value: "potato",
    label: "Potato",
    minPH: 5.5,
    maxPH: 7.0,
    image: "potato.png",
  },
  {
    value: "onion",
    label: "Onion",
    minPH: 6.0,
    maxPH: 6.8,
    image: "onion.png",
  },
  {
    value: "carrot",
    label: "Carrot",
    minPH: 6.0,
    maxPH: 6.8,
    image: "carrot.png",
  },
  {
    value: "spinach",
    label: "Spinach",
    minPH: 6.5,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "cabbage",
    label: "Cabbage",
    minPH: 6.0,
    maxPH: 7.5,
    image: "cabbage.png",
  },
  {
    value: "cauliflower",
    label: "Cauliflower",
    minPH: 5.5,
    maxPH: 7.0,
    image: "cauliflower.png",
  },
  {
    value: "capsicum",
    label: "Capsicum",
    minPH: 5.5,
    maxPH: 6.8,
    image: "capsicum.png",
  },
  {
    value: "cucumber",
    label: "Cucumber",
    minPH: 6.0,
    maxPH: 6.8,
    image: "bottle_gourd.png",
  },
  {
    value: "pumpkin",
    label: "Pumpkin",
    minPH: 5.5,
    maxPH: 7.5,
    image: "pumpkin.png",
  },

  // ===== SPICES & CASH CROPS =====
  {
    value: "turmeric",
    label: "Turmeric",
    minPH: 5.5,
    maxPH: 7.5,
    image: "turmeric.png",
  },
  {
    value: "ginger",
    label: "Ginger",
    minPH: 5.5,
    maxPH: 6.5,
    image: "ginger.png",
  },
  {
    value: "cotton",
    label: "Cotton",
    minPH: 6.0,
    maxPH: 7.5,
    image: "cotton.png",
  },
  {
    value: "sugarcane",
    label: "Sugarcane",
    minPH: 5.5,
    maxPH: 8.4,
    image: "sugarcane.png",
  },

  // ===== FRUITS =====
  {
    value: "mango",
    label: "Mango",
    minPH: 5.5,
    maxPH: 7.5,
    image: "mango.png",
  },
  {
    value: "banana",
    label: "Banana",
    minPH: 5.5,
    maxPH: 7.0,
    image: "banana.png",
  },
  {
    value: "apple",
    label: "Apple",
    minPH: 5.5,
    maxPH: 6.8,
    image: "apple.png",
  },
  {
    value: "guava",
    label: "Guava",
    minPH: 5.5,
    maxPH: 7.5,
    image: "guava.png",
  },
  {
    value: "lemon",
    label: "Lemon",
    minPH: 5.5,
    maxPH: 7.5,
    image: "lemon.png",
  },
];

class SettingsManager {
  constructor() {
    this.user = null;
    this.settings = null;
    this.saveTimeout = null;
  }

  async init() {
    console.log("⚙️ Initializing Settings...");

    authService.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("❌ Not authenticated, redirecting...");
        window.location.href = "../auth/signin.html";
        return;
      }

      this.user = user;
      console.log("✅ User authenticated:", user.uid);

      // Initialize theme from database on settings page load
      console.log("🎨 Initializing theme...");
      await themeService.initializeTheme(user.uid);

      // Initialize header
      this.initHeader();

      // Subscribe to theme changes (for cross-page sync)
      themeService.onChange((newTheme) => {
        console.log("🔄 Settings page: Theme updated to", newTheme);
        document.getElementById("darkModeToggle").checked = newTheme === "dark";
      });

      // Load settings
      await this.loadSettings();

      // Attach event listeners
      this.attachEventListeners();

      // Apply theme
      this.applyTheme();
    });
  }

  initHeader() {
    const header = new HeaderComponent("headerComponent");
    header.init({
      displayName: this.user?.displayName || "User",
      email: this.user?.email,
    });
  }

  async loadSettings() {
    try {
      const snapshot = await get(ref(db, `users/${this.user.uid}/settings`));

      if (snapshot.exists()) {
        this.settings = snapshot.val();
        console.log("✅ Settings loaded");
      } else {
        this.settings = {
          theme: "light",
          preferredCrop: "",
          notifications: {
            phAlerts: true,
            systemUpdates: true,
            weeklySummary: true,
          },
        };
        // Save defaults
        await set(ref(db, `users/${this.user.uid}/settings`), this.settings);
      }

      this.render();
    } catch (error) {
      console.error("❌ Error loading settings:", error);
    }
  }

  render() {
    // Hide skeleton, show content
    document.getElementById("skeletonLoader").style.display = "none";
    document.getElementById("settingsContent").classList.remove("hidden");

    // Set toggle states
    document.getElementById("darkModeToggle").checked =
      this.settings.theme === "dark";

    // Populate crop dropdown
    this.populateCropDropdown();

    const notif = this.settings.notifications || {};
    document.getElementById("phAlertsToggle").checked =
      notif.phAlerts !== false;
    document.getElementById("updatesToggle").checked =
      notif.systemUpdates !== false;
    document.getElementById("summaryToggle").checked =
      notif.weeklySummary !== false;
  }

  populateCropDropdown() {
    const cropSelect = document.getElementById("cropSelect");
    const selectedCrop = this.settings.preferredCrop || "";

    // Clear existing options except the first one
    while (cropSelect.options.length > 1) {
      cropSelect.remove(1);
    }

    // Add crop options from CROPS_DATABASE
    CROPS_DATABASE.forEach((crop) => {
      const option = document.createElement("option");
      option.value = crop.value;
      option.textContent = crop.label;
      if (crop.value === selectedCrop) {
        option.selected = true;
      }
      cropSelect.appendChild(option);
    });
  }

  attachEventListeners() {
    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "./dashboard.html";
    });

    document
      .getElementById("darkModeToggle")
      .addEventListener("change", async (e) => {
        const newTheme = e.target.checked ? "dark" : "light";
        console.log("🔄 Theme toggle changed to:", newTheme);
        // Save to database through theme service
        await themeService.saveThemeToDatabase(newTheme);
        // Apply immediately
        themeService.applyTheme(newTheme, false);
      });

    document.getElementById("cropSelect").addEventListener("change", (e) => {
      this.updateSetting("preferredCrop", e.target.value);
    });

    document
      .getElementById("phAlertsToggle")
      .addEventListener("change", (e) => {
        this.updateNotification("phAlerts", e.target.checked);
      });

    document.getElementById("updatesToggle").addEventListener("change", (e) => {
      this.updateNotification("systemUpdates", e.target.checked);
    });

    document.getElementById("summaryToggle").addEventListener("change", (e) => {
      this.updateNotification("weeklySummary", e.target.checked);
    });
  }

  async updateSetting(key, value) {
    try {
      this.settings[key] = value;

      await update(ref(db, `users/${this.user.uid}/settings`), {
        [key]: value,
      });

      console.log("✅ Setting updated:", key);

      if (key === "theme") {
        this.applyTheme();
      }

      this.showSaveStatus("✓ Saved", "success");
    } catch (error) {
      console.error("❌ Error updating:", error);
      this.showSaveStatus("Failed to save", "error");
    }
  }

  async updateNotification(key, value) {
    try {
      if (!this.settings.notifications) {
        this.settings.notifications = {};
      }
      this.settings.notifications[key] = value;

      await update(ref(db, `users/${this.user.uid}/settings/notifications`), {
        [key]: value,
      });

      console.log("✅ Notification updated:", key);
      this.showSaveStatus("✓ Saved", "success");
    } catch (error) {
      console.error("❌ Error updating:", error);
      this.showSaveStatus("Failed to save", "error");
    }
  }

  applyTheme() {
    const isDark = this.settings.theme === "dark";
    if (isDark) {
      document.body.classList.add("dark-mode");
      console.log("🌙 Dark mode enabled");
    } else {
      document.body.classList.remove("dark-mode");
      console.log("☀️ Light mode enabled");
    }
    localStorage.setItem("ecoSterileTheme", isDark ? "dark" : "light");
  }

  showSaveStatus(message, type) {
    const status = document.getElementById("saveStatus");
    status.textContent = message;
    status.style.background = type === "success" ? "#10b981" : "#ef4444";
    status.classList.add("show");

    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      status.classList.remove("show");
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const settings = new SettingsManager();
  settings.init();
});
