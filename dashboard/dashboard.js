/**
 * EcoSterile Dashboard - Main Application
 * Orchestrates all components and handles core logic
 */

import {
  authService,
  phService,
  pumpService,
  userService,
  systemService,
} from "../services/firebase.js";
import { weatherService } from "../services/weather.js";
import { HeaderComponent } from "../components/header.js";
import { StatusIndicatorComponent } from "../components/status-indicator.js";
import { PumpLogComponent } from "../components/pump-log.js";
import { CropCardsComponent } from "../components/crop-cards.js";
import { ChatbotComponent } from "../components/chatbot.js";
import { CropRecommendationEngine } from "../services/crop-recommendations.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ==========================================
// Global Application State
// ==========================================
const appState = {
  user: null,
  profile: null,
  currentCrop: null,
  phReadings: [],
  pumpLogs: [],
  systemStatus: {
    arduinoConnected: false,
    systemOnline: true,
    lastUpdate: new Date(),
    pumpStatus: "idle",
  },
  optimalPHMin: 6.5,
  optimalPHMax: 7.5,
  currentTimeRange: "24h", // Track current time filter
  chart: null,
  chartUpdateTimer: null, // Debounce timer for chart updates
  dataIsContinuous: true, // Track if pH data is continuous
  lastReadingTime: null, // Track last reading for UI display
};

// ==========================================
// Debounce helper for chart updates
// ==========================================
function debounceChartUpdate() {
  // Clear existing timer if any
  if (appState.chartUpdateTimer) {
    clearTimeout(appState.chartUpdateTimer);
  }

  // Set new timer - wait 500ms before updating chart
  appState.chartUpdateTimer = setTimeout(() => {
    console.log("⏰ Debounced chart update triggered");
    updatePHChart(appState.currentTimeRange);
    updatePHStats();
    appState.chartUpdateTimer = null;
  }, 500);
}

// ==========================================
// Crop Database - Comprehensive List with pH Ranges and Images
// ==========================================
const CROPS_DATABASE = [
  // ===== CEREALS =====
  {
    value: "rice",
    label: "Rice (Dhaan)",
    minPH: 5.5,
    maxPH: 6.5,
    image: "rice.png",
  },
  {
    value: "wheat",
    label: "Wheat (Gehun)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "wheat.png",
  },
  {
    value: "maize",
    label: "Maize/Corn",
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
  { value: "oats", label: "Oats", minPH: 5.5, maxPH: 7.0, image: "rice.png" },
  { value: "rye", label: "Rye", minPH: 5.5, maxPH: 7.0, image: "wheat.png" },
  {
    value: "millet",
    label: "Millet (Bajra)",
    minPH: 5.5,
    maxPH: 7.5,
    image: "pearl_millet.png",
  },
  {
    value: "sorghum",
    label: "Sorghum (Jowar)",
    minPH: 5.5,
    maxPH: 8.0,
    image: "sorghum.png",
  },

  // ===== PULSES =====
  {
    value: "chickpea",
    label: "Chickpea (Chana)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "chickpea.png",
  },
  {
    value: "pigeon_pea",
    label: "Pigeon Pea (Arhar)",
    minPH: 5.5,
    maxPH: 7.0,
    image: "pigeon_pea.png",
  },
  {
    value: "lentil",
    label: "Lentil (Masoor)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "lentil.png",
  },
  {
    value: "moong",
    label: "Moong Bean (Mung)",
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
  {
    value: "peas",
    label: "Peas (Matar)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "kidney_bean.png",
  },
  {
    value: "beans",
    label: "Beans",
    minPH: 6.0,
    maxPH: 7.0,
    image: "kidney_bean.png",
  },

  // ===== VEGETABLES - Leafy =====
  {
    value: "spinach",
    label: "Spinach",
    minPH: 6.5,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "lettuce",
    label: "Lettuce",
    minPH: 6.0,
    maxPH: 7.0,
    image: "lettuce.png",
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
    minPH: 6.0,
    maxPH: 7.5,
    image: "cauliflower.png",
  },
  {
    value: "broccoli",
    label: "Broccoli",
    minPH: 6.0,
    maxPH: 7.0,
    image: "cauliflower.png",
  },
  {
    value: "kale",
    label: "Kale",
    minPH: 6.0,
    maxPH: 7.5,
    image: "spinach.png",
  },
  {
    value: "mustard",
    label: "Mustard Greens",
    minPH: 6.0,
    maxPH: 7.5,
    image: "mustard.png",
  },

  // ===== VEGETABLES - Root =====
  {
    value: "potato",
    label: "Potato",
    minPH: 5.0,
    maxPH: 6.0,
    image: "potato.png",
  },
  {
    value: "carrot",
    label: "Carrot",
    minPH: 6.0,
    maxPH: 7.0,
    image: "carrot.png",
  },
  {
    value: "radish",
    label: "Radish",
    minPH: 6.0,
    maxPH: 7.0,
    image: "carrot.png",
  },
  {
    value: "turnip",
    label: "Turnip",
    minPH: 6.0,
    maxPH: 7.5,
    image: "carrot.png",
  },
  {
    value: "beet",
    label: "Beet (Chukandar)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "carrot.png",
  },
  {
    value: "parsnip",
    label: "Parsnip",
    minPH: 6.0,
    maxPH: 7.5,
    image: "carrot.png",
  },

  // ===== VEGETABLES - Other =====
  {
    value: "tomato",
    label: "Tomato",
    minPH: 5.5,
    maxPH: 6.8,
    image: "tomato.png",
  },
  {
    value: "cucumber",
    label: "Cucumber",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bottle_gourd.png",
  },
  {
    value: "squash",
    label: "Squash",
    minPH: 6.0,
    maxPH: 7.0,
    image: "pumpkin.png",
  },
  {
    value: "zucchini",
    label: "Zucchini",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bottle_gourd.png",
  },
  {
    value: "pumpkin",
    label: "Pumpkin",
    minPH: 6.0,
    maxPH: 7.0,
    image: "pumpkin.png",
  },
  {
    value: "eggplant",
    label: "Eggplant",
    minPH: 5.5,
    maxPH: 7.0,
    image: "brinjal.png",
  },
  {
    value: "pepper",
    label: "Pepper/Capsicum",
    minPH: 5.5,
    maxPH: 6.8,
    image: "capsicum.png",
  },
  {
    value: "chili",
    label: "Chili Pepper",
    minPH: 5.5,
    maxPH: 6.8,
    image: "capsicum.png",
  },
  {
    value: "onion",
    label: "Onion",
    minPH: 6.0,
    maxPH: 7.0,
    image: "onion.png",
  },
  {
    value: "garlic",
    label: "Garlic",
    minPH: 6.0,
    maxPH: 7.5,
    image: "onion.png",
  },
  { value: "leek", label: "Leek", minPH: 6.0, maxPH: 7.0, image: "onion.png" },
  {
    value: "okra",
    label: "Okra (Bhindi)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "okra.png",
  },
  {
    value: "bottle_gourd",
    label: "Bottle Gourd",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bottle_gourd.png",
  },
  {
    value: "bitter_melon",
    label: "Bitter Melon (Karela)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bitter_gourd.png",
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
    maxPH: 6.5,
    image: "apple.png",
  },
  {
    value: "orange",
    label: "Orange",
    minPH: 5.5,
    maxPH: 6.5,
    image: "orange.png",
  },
  {
    value: "lemon",
    label: "Lemon",
    minPH: 5.5,
    maxPH: 6.5,
    image: "lemon.png",
  },
  {
    value: "grape",
    label: "Grapes",
    minPH: 5.5,
    maxPH: 7.0,
    image: "orange.png",
  },
  {
    value: "strawberry",
    label: "Strawberry",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  {
    value: "guava",
    label: "Guava",
    minPH: 5.5,
    maxPH: 7.0,
    image: "guava.png",
  },
  {
    value: "papaya",
    label: "Papaya",
    minPH: 5.5,
    maxPH: 7.0,
    image: "papaya.png",
  },
  {
    value: "pineapple",
    label: "Pineapple",
    minPH: 4.5,
    maxPH: 5.5,
    image: "orange.png",
  },
  {
    value: "coconut",
    label: "Coconut",
    minPH: 5.5,
    maxPH: 6.5,
    image: "coconut.png",
  },
  {
    value: "pomegranate",
    label: "Pomegranate",
    minPH: 5.5,
    maxPH: 7.5,
    image: "pomegranate.png",
  },
  {
    value: "peach",
    label: "Peach",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  { value: "plum", label: "Plum", minPH: 5.5, maxPH: 6.5, image: "apple.png" },
  {
    value: "cherry",
    label: "Cherry",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  {
    value: "watermelon",
    label: "Watermelon",
    minPH: 5.5,
    maxPH: 7.0,
    image: "watermelon.png",
  },
  {
    value: "muskmelon",
    label: "Muskmelon",
    minPH: 6.0,
    maxPH: 7.0,
    image: "pumpkin.png",
  },

  // ===== CASH CROPS =====
  {
    value: "cotton",
    label: "Cotton",
    minPH: 5.5,
    maxPH: 7.5,
    image: "cotton.png",
  },
  {
    value: "sugarcane",
    label: "Sugarcane",
    minPH: 6.0,
    maxPH: 7.5,
    image: "sugarcane.png",
  },
  {
    value: "tobacco",
    label: "Tobacco",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cotton.png",
  },
  { value: "jute", label: "Jute", minPH: 5.5, maxPH: 7.0, image: "cotton.png" },
  { value: "tea", label: "Tea", minPH: 5.0, maxPH: 5.5, image: "coffee.png" },
  {
    value: "coffee",
    label: "Coffee",
    minPH: 5.5,
    maxPH: 6.5,
    image: "coffee.png",
  },
  {
    value: "cocoa",
    label: "Cocoa",
    minPH: 5.5,
    maxPH: 7.0,
    image: "coffee.png",
  },

  // ===== SPICES & CONDIMENTS =====
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
    maxPH: 7.0,
    image: "ginger.png",
  },
  {
    value: "coriander",
    label: "Coriander",
    minPH: 6.0,
    maxPH: 7.0,
    image: "coriander.png",
  },
  {
    value: "cumin",
    label: "Cumin",
    minPH: 6.0,
    maxPH: 7.5,
    image: "coriander.png",
  },
  {
    value: "fenugreek",
    label: "Fenugreek (Methi)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "fenugreek.png",
  },
  {
    value: "black_pepper",
    label: "Black Pepper",
    minPH: 5.5,
    maxPH: 6.5,
    image: "black_pepper.png",
  },
  {
    value: "cardamom",
    label: "Cardamom",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cardamom.png",
  },
  {
    value: "cinnamon",
    label: "Cinnamon",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cinnamon.png",
  },
  {
    value: "clove",
    label: "Clove",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cinnamon.png",
  },

  // ===== OIL CROPS =====
  {
    value: "soybean",
    label: "Soybean",
    minPH: 6.0,
    maxPH: 7.0,
    image: "soybean.png",
  },
  {
    value: "groundnut",
    label: "Groundnut (Peanut)",
    minPH: 5.5,
    maxPH: 6.5,
    image: "groundnut.png",
  },
  {
    value: "sunflower",
    label: "Sunflower",
    minPH: 6.0,
    maxPH: 7.5,
    image: "sunflower.png",
  },
  {
    value: "mustard",
    label: "Mustard (Oil)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "mustard.png",
  },
  {
    value: "sesame",
    label: "Sesame (Til)",
    minPH: 5.5,
    maxPH: 7.0,
    image: "sesame.png",
  },
  {
    value: "safflower",
    label: "Safflower",
    minPH: 5.5,
    maxPH: 7.5,
    image: "sunflower.png",
  },

  // ===== OTHERS =====
  {
    value: "aloe",
    label: "Aloe Vera",
    minPH: 6.5,
    maxPH: 7.5,
    image: "spinach.png",
  },
  {
    value: "stevia",
    label: "Stevia",
    minPH: 6.0,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "mint",
    label: "Mint (Pudina)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "spinach.png",
  },
  {
    value: "basil",
    label: "Basil (Tulsi)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "oregano",
    label: "Oregano",
    minPH: 6.0,
    maxPH: 7.0,
    image: "spinach.png",
  },
];

// ==========================================
// Component Instances
// ==========================================
let headerComponent = null;
let statusComponent = null;
let pumpLogComponent = null;
let cropCardsComponent = null;

// ==========================================
// Initialization
// ==========================================
async function initializeDashboard() {
  try {
    // Check authentication and profile completion
    authService.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "../auth/signin.html";
        return;
      }

      try {
        // Check if profile and location are complete
        try {
          const db = getDatabase();
          const profileSnap = await get(ref(db, `users/${user.uid}/profile`));
          const locationSnap = await get(ref(db, `users/${user.uid}/location`));

          const hasProfile = profileSnap.exists();
          const hasLocation = locationSnap.exists();

          if (!hasProfile || !hasLocation) {
            // Profile incomplete, redirect to completion page
            console.warn(
              "⚠️ Profile incomplete. Redirecting to complete-profile.html"
            );
            window.location.href = "../auth/complete-profile.html";
            return;
          }
        } catch (error) {
          console.error("Error checking profile completeness:", error);
          // On error, allow access (safer than blocking)
        }

        appState.user = user;
        await loadUserProfile();
        initializeComponents();
        startMonitoring();
        setupEventListeners();
      } catch (e) {
        console.error("❌ Dashboard initialization error:", e.message);
        // Ensure UI is at least partially visible even on error
        initializeComponents();
        showNotification("Dashboard loaded with limited features", "warning");
      }
    });
  } catch (e) {
    console.error("❌ Critical initialization error:", e.message);
    showNotification("Failed to initialize dashboard", "error");
  }
}

// ==========================================
// Load User Profile
// ==========================================
async function loadUserProfile() {
  console.log("📊 Loading user profile for:", appState.user.uid);

  const result = await userService.getProfile(appState.user.uid);

  if (result.success) {
    console.log("✅ Profile retrieved:", result.profile);
    appState.profile = result.profile;

    // Ensure location node exists (migration for legacy accounts)
    console.log("🔄 Checking if location node exists...");
    const ensureResult = await userService.ensureLocationExists(
      appState.user.uid
    );
    if (ensureResult.created) {
      console.log("✨ Location node was created for legacy account");
    }

    // Get user location from persistent location object
    console.log("📍 Getting location from database...");
    const locationResult = await userService.getLocation(appState.user.uid);
    console.log("📍 Location result:", JSON.stringify(locationResult));

    // Defensive: Handle location result properly
    let location = "Karimganj, Assam"; // Default fallback

    if (locationResult.success) {
      // Check if location is genuinely provided (not empty object)
      const displayLoc = locationResult.location;

      // Only use non-"Not provided" values
      if (
        displayLoc &&
        displayLoc !== "Not provided" &&
        displayLoc.trim() !== ""
      ) {
        location = displayLoc;
        console.log("✅ Using location from database:", location);
      } else {
        console.log("⚠️  Location is empty, using default:", location);
        console.log("   isEmpty flag:", locationResult.isEmpty);
      }
    } else {
      console.warn("⚠️  Error retrieving location:", locationResult.error);
      console.log("   Using default fallback:", location);
    }

    console.log("📍 Final location to display:", location);
    document.getElementById("farmLocation").textContent = location;

    // Format and display last visited
    if (result.profile.lastVisited) {
      const lastVisitDate = new Date(result.profile.lastVisited);
      document.getElementById("lastVisit").textContent =
        lastVisitDate.toLocaleDateString() +
        " " +
        lastVisitDate.toLocaleTimeString();
    } else {
      document.getElementById("lastVisit").textContent = "First visit";
    }

    // Load weather for the location
    await loadWeather(location);

    appState.optimalPHMin = parseFloat(result.profile.cropMinPH) || 6.5;
    appState.optimalPHMax = parseFloat(result.profile.cropMaxPH) || 7.5;
    console.log(
      "🌾 Crop pH range set:",
      appState.optimalPHMin,
      "-",
      appState.optimalPHMax
    );

    // Set current crop if saved
    if (result.profile.currentCrop) {
      const crop = CROPS_DATABASE.find(
        (c) => c.value === result.profile.currentCrop
      );
      if (crop) {
        appState.currentCrop = crop;
        // Update optimal pH to match the crop's range
        appState.optimalPHMin = crop.minPH;
        appState.optimalPHMax = crop.maxPH;
      }
    }
  }
}

// ==========================================
// Load Weather
// ==========================================
async function loadWeather(location) {
  const weather = await weatherService.getWeather(location);

  if (weather.success) {
    document.getElementById("weatherIcon").textContent = weather.icon;
    document.getElementById("weatherTemp").textContent = weather.temp + "°C";
    document.getElementById("weatherDesc").textContent = weather.description;
    document.getElementById("weatherLocation").textContent = weather.location;
    document.getElementById("weatherHumidity").textContent =
      weather.humidity + "%";
    document.getElementById("weatherWind").textContent =
      weather.windSpeed + " km/h";
  }
}

// ==========================================
// Load pH Readings
// ==========================================
async function loadPhReadings() {
  console.log("Loading pH readings for user:", appState.user.uid);
  // Fetch more readings to support 30-day filter (assuming ~1 reading per minute = ~43,200 per 30 days)
  // Limiting to 2000 for performance while ensuring 7d/30d have adequate data
  const result = await phService.getReadings(appState.user.uid, 2000);

  if (result.success) {
    appState.phReadings = result.readings;
    console.log("pH readings loaded successfully:", appState.phReadings.length);
    updatePHChart();
    updatePHStats();
  } else {
    console.error("Failed to load pH readings:", result.error);
  }

  // Listen for real-time updates
  phService.onReadingsUpdate(appState.user.uid, (readings) => {
    appState.phReadings = readings;
    console.log("pH readings updated in real-time:", readings.length);

    // Update display with latest reading
    if (readings.length > 0) {
      const latest = readings[readings.length - 1];
      updatePHDisplay(parseFloat(latest.value));
    }

    // Update chart
    updatePHChart();
    updatePHStats();
  });
}

// ==========================================
// Load Pump Logs
// ==========================================
async function loadPumpLogs() {
  console.log("Loading pump logs for user:", appState.user.uid);
  const result = await pumpService.getLogs(appState.user.uid, 100);

  if (result.success) {
    appState.pumpLogs = result.logs;
    console.log("Pump logs loaded successfully:", appState.pumpLogs.length);
    pumpLogComponent.render(appState.pumpLogs);
  } else {
    console.error("Failed to load pump logs:", result.error);
  }

  // Listen for real-time updates
  pumpService.onLogsUpdate(appState.user.uid, (logs) => {
    appState.pumpLogs = logs;
    console.log("Pump logs updated in real-time:", logs.length);
    pumpLogComponent.render(appState.pumpLogs);
  });
}

// ==========================================
// pH Display Functions
// ==========================================
function updatePHDisplay(pH) {
  const phValue = document.getElementById("phValue");
  const phStatus = document.getElementById("phStatus");
  const phIndicator = document.getElementById("phIndicator");

  // Update value
  phValue.textContent = pH.toFixed(1);

  // Update status based on optimal range
  if (pH < appState.optimalPHMin) {
    phStatus.textContent = "🔴 Too Acidic";
    phStatus.style.color = "var(--danger-color)";
  } else if (pH > appState.optimalPHMax) {
    phStatus.textContent = "🔵 Too Basic";
    phStatus.style.color = "var(--info-color)";
  } else {
    phStatus.textContent = "🟢 Optimal";
    phStatus.style.color = "var(--success-color)";
  }

  // Update indicator position
  const percentage = (pH / 14) * 100;
  phIndicator.style.left = percentage + "%";
}

// ==========================================
// Update Optimal pH Display
// ==========================================
function updateOptimalPHDisplay() {
  const display = document.getElementById("optimalRangeDisplay");
  if (display) {
    display.textContent = `${appState.optimalPHMin} - ${appState.optimalPHMax}`;
  }
}

// ==========================================
// Initialize Components
// ==========================================
function initializeComponents() {
  try {
    // Header Component
    headerComponent = new HeaderComponent("headerComponent");
    headerComponent.init(appState.user);
    console.log("✅ Header component initialized");
  } catch (e) {
    console.error("❌ Header component error:", e.message);
  }

  try {
    // Status Indicator Component
    statusComponent = new StatusIndicatorComponent("statusComponent");
    statusComponent.render(appState.systemStatus);
    console.log("✅ Status component initialized");
  } catch (e) {
    console.error("❌ Status component error:", e.message);
  }

  try {
    // Pump Log Component
    pumpLogComponent = new PumpLogComponent("pumpLogComponent");
    pumpLogComponent.render([]);
    console.log("✅ Pump log component initialized");
  } catch (e) {
    console.error("❌ Pump log component error:", e.message);
  }

  try {
    // Crop Cards Component with Recommendations
    const recommendationEngine = new CropRecommendationEngine();
    cropCardsComponent = new CropCardsComponent(
      "cropCardsComponent",
      recommendationEngine
    );

    // Build user profile for recommendations
    const userProfileForRecommendations = {
      farmLocation: appState.profile?.farmLocation || "",
      // Add other relevant profile data as needed
    };

    cropCardsComponent.render(
      CROPS_DATABASE,
      appState.currentCrop,
      appState.profile?.cropLocked || false,
      userProfileForRecommendations
    );
    console.log("✅ Crop cards component initialized");
  } catch (e) {
    console.error("❌ Crop cards component error:", e.message);
  }

  try {
    // Chatbot Component
    const chatbot = new ChatbotComponent("chatbotContainer");
    chatbot.init();
    console.log("✅ Chatbot component initialized");
  } catch (e) {
    console.error("❌ Chatbot component error:", e.message);
  }

  // Initialize pH Chart (critical for UI)
  try {
    initializePHChart();
    console.log("✅ pH chart initialized");
  } catch (e) {
    console.error("❌ pH chart initialization error:", e.message);
  }

  // Load initial data
  try {
    loadPhReadings();
  } catch (e) {
    console.error("❌ pH readings load error:", e.message);
  }

  try {
    loadPumpLogs();
  } catch (e) {
    console.error("❌ Pump logs load error:", e.message);
  }

  // Set optimal pH display
  try {
    updateOptimalPHDisplay();
  } catch (e) {
    console.error("❌ Optimal pH display error:", e.message);
  }
}

// ==========================================
// pH Chart Initialization
// ==========================================
// ================= REPLACE START =================

// pH Chart Initialization
function initializePHChart() {
  const canvasElement = document.getElementById("phChart");
  console.log("🎯 Initializing pH Chart...", canvasElement);

  if (!canvasElement) {
    console.error("❌ phChart canvas element not found!");
    return;
  }

  if (typeof Chart === "undefined") {
    console.error(
      '❌ Chart.js not loaded - include <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
    );
    return;
  }

  const ctx = canvasElement.getContext("2d");
  console.log("✅ Canvas context obtained:", ctx);

  // Chart state for interactive features
  appState.chartState = {
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    zoomLevel: 1.0,
    minZoom: 0.5,
    maxZoom: 4.0,
  };

  // If there is an existing instance, destroy it cleanly
  if (appState.chart) {
    try {
      appState.chart.destroy();
    } catch (e) {
      // ignore
    }
    appState.chart = null;
  }

  appState.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [], // intentionally empty - x comes from data.x
      datasets: [
        {
          label: "pH Level",
          data: [], // will be {x, y}
          borderColor: "var(--primary-color)",
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          borderWidth: 2,
          tension: 0.25,
          fill: true,
          pointRadius: 0, // hide static dots
          pointHoverRadius: 5,
          pointBackgroundColor: "var(--primary-color)",
          pointBorderColor: "white",
          pointBorderWidth: 1,
          spanGaps: false, // don't connect missing points
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: "nearest",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "var(--text-secondary)",
            font: { size: 12 },
            padding: 10,
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "white",
          bodyColor: "var(--text-secondary)",
          borderColor: "var(--primary-color)",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: function (ctx) {
              if (!ctx.length) return "";
              const xVal = ctx[0].raw.x || 0; // seconds relative to now
              const now = Date.now();
              const timestamp = now + xVal * 1000;
              const date = new Date(timestamp);
              const hours = date.getHours();
              const mins = String(date.getMinutes()).padStart(2, "0");
              const ampm = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${String(displayHours).padStart(2, "0")}:${mins} ${ampm}`;
            },
            label: function (ctx) {
              const y = ctx.raw.y;
              return y !== null ? `pH: ${parseFloat(y).toFixed(2)}` : "No data";
            },
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 14,
          ticks: {
            color: "var(--text-tertiary)",
            stepSize: 1,
            font: { size: 11 },
          },
          grid: {
            color: "rgba(15, 23, 42, 0.08)",
            drawBorder: false,
          },
        },
        x: {
          type: "linear",
          position: "bottom",
          min: -86400,
          max: 0,
          ticks: {
            color: "var(--text-tertiary)",
            font: { size: 11 },
            stepSize: 120, // ~2 minutes
            callback: function (value) {
              // Check if labels should be shown (controlled by appState.showChartLabels)
              if (appState.dataIsContinuous === false) {
                // Discontinuous data: hide all labels
                return "";
              }

              const now = Date.now();
              const timestamp = now + value * 1000;
              const date = new Date(timestamp);

              // Show label every 2 minutes for continuous data
              if (value % 120 === 0) {
                const hours = date.getHours();
                const mins = String(date.getMinutes()).padStart(2, "0");
                const ampm = hours >= 12 ? "PM" : "AM";
                const displayHours = hours % 12 || 12;
                return `${String(displayHours).padStart(
                  2,
                  "0"
                )}:${mins} ${ampm}`;
              }
              return "";
            },
          },
          grid: {
            color: "rgba(15, 23, 42, 0.12)",
            drawBorder: false,
            lineWidth: 1,
          },
        },
      },
    },
  });

  console.log("✅ Chart instance created");

  // Setup interactive features (drag/zoom)
  setupChartInteractivity();
}

// Chart Interactivity (wheel zoom only - auto-follow NOW)
function setupChartInteractivity() {
  const container = document.getElementById("phChartWrapper");
  const canvas = document.getElementById("phChart");
  if (!container || !canvas || !appState.chart) return;

  container.title =
    "Zoom in/out using the mouse wheel or pinching. Graph auto-follows live data.";

  // Wheel zoom only
  const wheelHandler = (e) => {
    if (!appState.chart) return;
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    appState.chartState.zoomLevel = Math.max(
      appState.chartState.minZoom,
      Math.min(
        appState.chartState.maxZoom,
        appState.chartState.zoomLevel * zoomFactor
      )
    );
    updateChartZoom();
  };
  container.removeEventListener("wheel", wheelHandler);
  container.addEventListener("wheel", wheelHandler, { passive: false });

  // Pinch-to-zoom only (no pan)
  let lastDistance = 0;
  container.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastDistance) {
        const zoomDir = d > lastDistance ? 1.05 : 0.95;
        appState.chartState.zoomLevel = Math.max(
          appState.chartState.minZoom,
          Math.min(
            appState.chartState.maxZoom,
            appState.chartState.zoomLevel * zoomDir
          )
        );
        updateChartZoom();
      }
      lastDistance = d;
    },
    { passive: false }
  );
  container.addEventListener("touchend", () => {
    lastDistance = 0;
  });
}

// Update chart visible range according to zoom
function updateChartZoom() {
  if (!appState.chart) return;

  // Get the actual window size from axis config (set by updatePHChart)
  const currentMax = appState.chart.options.scales.x.max || 0;
  const currentMinStatic = appState.chart.options.scales.x.min || -86400;
  const windowSize = Math.abs(currentMinStatic); // Total window in seconds

  // Calculate visible range based on zoom level
  const visibleSeconds = Math.max(
    300,
    windowSize / appState.chartState.zoomLevel
  ); // Min 5 min
  const newMin = Math.max(currentMinStatic, -visibleSeconds);
  appState.chart.update("none");
}

// Update pH Chart - Real-time Industrial Telemetry with Dynamic Time Window
// Timeline anchored to NOW (x=0), continuous line with forward-fill
// Window size adapts to actual data availability (min of data span or 24 hours)
function updatePHChart() {
  if (!appState.chart) {
    console.warn("⚠️ appState.chart not initialized yet");
    return;
  }

  if (!appState.phReadings || appState.phReadings.length === 0) {
    appState.chart.data.datasets[0].data = [];
    appState.chart.options.scales.x.min = -300; // 5 minutes minimum
    appState.chart.options.scales.x.max = 0;
    appState.chart.update("none");
    return;
  }

  // Get current time
  const now = Date.now();
  const maxHistorySeconds = 24 * 60 * 60; // 24 hours in seconds

  // Find actual data span
  const firstReadingTime =
    typeof appState.phReadings[0].timestamp === "number"
      ? appState.phReadings[0].timestamp
      : new Date(appState.phReadings[0].timestamp).getTime();

  // Calculate how much data we actually have
  const dataSpanSeconds = Math.round((now - firstReadingTime) / 1000);

  // Dynamic window: use minimum of actual data span or 24 hours
  const visibleWindowSeconds = Math.min(dataSpanSeconds, maxHistorySeconds);
  const windowStartTime = now - visibleWindowSeconds * 1000;

  // Filter to the dynamic window
  const filtered = appState.phReadings.filter((r) => {
    const ts =
      typeof r.timestamp === "number"
        ? r.timestamp
        : new Date(r.timestamp).getTime();
    return ts >= windowStartTime && ts <= now;
  });

  if (filtered.length === 0) {
    appState.chart.data.datasets[0].data = [];
    appState.chart.options.scales.x.min = -visibleWindowSeconds;
    appState.chart.options.scales.x.max = 0;
    appState.chart.update("none");
    return;
  }

  // Convert to industrial telemetry format:
  // x = seconds relative to NOW (negative for past, 0 for now)
  const points = filtered.map((r) => {
    const ts =
      typeof r.timestamp === "number"
        ? r.timestamp
        : new Date(r.timestamp).getTime();
    return {
      x: Math.round((ts - now) / 1000),
      y: parseFloat(r.value),
      ts: ts,
    };
  });

  // Sort by timestamp to ensure chronological order
  points.sort((a, b) => a.ts - b.ts);

  // Build timeline with 5-second intervals
  // Use forward-fill (carry forward last known value) to eliminate gaps
  const startSeconds = Math.ceil((windowStartTime - now) / 1000);
  const timelinePoints = [];
  let lastKnownValue = null;

  for (let x = startSeconds; x <= 0; x += 5) {
    const found = points.find((p) => Math.abs(p.x - x) < 2.5);

    if (found) {
      lastKnownValue = found.y;
      timelinePoints.push({ x, y: found.y });
    } else if (lastKnownValue !== null) {
      // Forward-fill: carry forward last known value (continuous line)
      timelinePoints.push({ x, y: lastKnownValue });
    } else {
      // No data yet for this time
      timelinePoints.push({ x, y: null });
    }
  }

  // Ensure latest point is at x=0 (NOW)
  if (
    timelinePoints.length > 0 &&
    timelinePoints[timelinePoints.length - 1].x !== 0
  ) {
    timelinePoints.push({
      x: 0,
      y: lastKnownValue !== null ? lastKnownValue : points[points.length - 1].y,
    });
  }

  // Update dataset
  appState.chart.data.labels = [];
  appState.chart.data.datasets[0].data = timelinePoints;

  // X-axis uses dynamic window: spans from first data to NOW
  appState.chart.options.scales.x.min = -visibleWindowSeconds;
  appState.chart.options.scales.x.max = 0;

  // Update chart without animation
  appState.chart.update("none");

  // Apply zoom logic (respects dynamic window, keeps x.max = 0)
  updateChartZoom();

  // Auto-scroll to latest
  setTimeout(autoScrollToLatest, 50);

  // Update range label
  if (filtered.length > 0) {
    const values = filtered.map((r) => parseFloat(r.value));
    const minPH = Math.min(...values);
    const maxPH = Math.max(...values);
    const phRangeEl = document.getElementById("phRange");
    if (phRangeEl) {
      phRangeEl.textContent = `${minPH.toFixed(1)} - ${maxPH.toFixed(1)}`;
    }

    // Detect data continuity: check gaps between consecutive readings
    // Gap ≤ 2 minutes (120 seconds) = continuous
    const TWO_MINUTES = 120000; // milliseconds
    let isContinuous = true;

    for (let i = 1; i < filtered.length; i++) {
      const prevTs =
        typeof filtered[i - 1].timestamp === "number"
          ? filtered[i - 1].timestamp
          : new Date(filtered[i - 1].timestamp).getTime();
      const currTs =
        typeof filtered[i].timestamp === "number"
          ? filtered[i].timestamp
          : new Date(filtered[i].timestamp).getTime();
      const gap = currTs - prevTs;

      if (gap > TWO_MINUTES) {
        isContinuous = false;
        break;
      }
    }

    appState.dataIsContinuous = isContinuous;

    // Store last reading time for UI display
    const lastTs =
      typeof filtered[filtered.length - 1].timestamp === "number"
        ? filtered[filtered.length - 1].timestamp
        : new Date(filtered[filtered.length - 1].timestamp).getTime();
    appState.lastReadingTime = lastTs;

    // Update "Last reading" UI if discontinuous
    const lastReadingEl = document.getElementById("lastReadingTime");
    if (lastReadingEl) {
      if (!isContinuous) {
        const lastDate = new Date(lastTs);
        const day = String(lastDate.getDate()).padStart(2, "0");
        const month = lastDate.toLocaleDateString("en-US", { month: "short" });
        const hours = lastDate.getHours();
        const mins = String(lastDate.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        lastReadingEl.textContent = `Last reading: ${day} ${month}, ${String(
          displayHours
        ).padStart(2, "0")}:${mins} ${ampm}`;
        lastReadingEl.style.display = "block";
      } else {
        lastReadingEl.style.display = "none";
      }
    }
  }
}

// Auto-scroll to latest data inside wrapper (keeps UI synced)
function autoScrollToLatest() {
  const container = document.getElementById("phChartWrapper");
  if (!container) return;
  requestAnimationFrame(() => {
    container.scrollLeft = container.scrollWidth - container.clientWidth;
  });
}

// ================= REPLACE END =================

// ==========================================
// Update pH Range Label
// ==========================================
function updatePHRangeLabel() {
  const phRangeLabelEl = document.getElementById("phRangeLabel");
  if (phRangeLabelEl) {
    phRangeLabelEl.textContent = "pH Range (Last 24h)";
  }
}

// ==========================================
// Update pH Statistics
// ==========================================
function updatePHStats() {
  const avgPhEl = document.getElementById("avgPH");
  const phRangeEl = document.getElementById("phRange");
  const basicCountEl = document.getElementById("basicPumpCount");
  const acidicCountEl = document.getElementById("acidicPumpCount");

  if (appState.phReadings.length > 0) {
    // Average pH (calculated from all loaded readings for consistency)
    const avg =
      appState.phReadings.reduce((sum, reading) => sum + reading.value, 0) /
      appState.phReadings.length;
    avgPhEl.textContent = avg.toFixed(2);

    // pH Range (updated via updatePHRangeLabel when chart updates)
    const values = appState.phReadings.map((r) => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    phRangeEl.textContent = `${min.toFixed(1)} - ${max.toFixed(1)}`;
  }

  // Pump counts
  const basicCount = appState.pumpLogs.filter(
    (log) => log.type === "basic"
  ).length;
  const acidicCount = appState.pumpLogs.filter(
    (log) => log.type === "acidic"
  ).length;

  basicCountEl.textContent = basicCount;
  acidicCountEl.textContent = acidicCount;
}

// ==========================================
// Start Monitoring (Simulation)
// ==========================================
function startMonitoring() {
  // Simulate pH readings
  setInterval(() => {
    // Get the latest pH value from the state's current pH display
    // instead of trying to guess from old readings
    const phValueElement = document.getElementById("phValue");
    let currentPH = phValueElement
      ? parseFloat(phValueElement.textContent)
      : 7.0;

    // Ensure we have a valid number
    if (isNaN(currentPH)) {
      currentPH = 7.0;
    }

    const change = (Math.random() - 0.5) * 0.2;
    currentPH = Math.max(4, Math.min(10, currentPH + change));

    // Add pH reading
    addPHReading(currentPH);

    // Check if pump should activate
    checkAndActivatePump(currentPH);
  }, 5000);
}

// ==========================================
// Add pH Reading
// ==========================================
async function addPHReading(pH) {
  const result = await phService.addReading(
    appState.user.uid,
    parseFloat(pH.toFixed(2))
  );

  if (!result.success) {
    console.error("Failed to add pH reading:", result.error);
  }
}

// ==========================================
// Log Pump Activity (Helper function)
// ==========================================
async function logPumpActivity(pumpType, concentration) {
  // Determine chemical based on pump type
  let chemical = "Unknown";
  if (pumpType === "basic") {
    chemical = "Potassium Bicarbonate";
  } else if (pumpType === "acidic") {
    chemical = "Fulvic + Citric acid";
  }

  // Log using pump service
  const result = await pumpService.logActivity(
    appState.user.uid,
    pumpType,
    chemical,
    concentration
  );

  if (!result.success) {
    console.error("Failed to log pump activity:", result.error);
  }
}

// ==========================================
// Check and Activate Pump
// ==========================================
async function checkAndActivatePump(pH) {
  const lastLog = appState.pumpLogs[appState.pumpLogs.length - 1];
  const timeSinceLastPump = lastLog
    ? Date.now() - new Date(lastLog.timestamp).getTime()
    : Infinity;

  // Avoid rapid consecutive pump activations
  if (timeSinceLastPump < 10000) return;

  if (pH < appState.optimalPHMin) {
    // Activate basic pump
    await pumpService.logActivity(
      appState.user.uid,
      "basic",
      "Potassium Bicarbonate",
      "1%"
    );
  } else if (pH > appState.optimalPHMax) {
    // Activate acidic pump
    await pumpService.logActivity(
      appState.user.uid,
      "acidic",
      "Fulvic + Citric acid",
      "1%"
    );
  }
}

// ==========================================
// Setup Event Listeners
// ==========================================
// ==========================================
// Arduino Web Serial Connection
// ==========================================
let currentPort = null;

async function connectArduino() {
  if (!("serial" in navigator)) {
    showNotification(
      "Web Serial API not supported. Use Chrome, Edge, or Opera.",
      "error"
    );
    return;
  }

  try {
    console.log("🔌 Requesting serial port...");
    const port = await navigator.serial.requestPort();

    if (!port) {
      console.log("User cancelled port selection.");
      return;
    }

    console.log("🔌 Opening port at 9600 baud...");
    await port.open({ baudRate: 9600 });
    console.log("✅ Port opened successfully.");
    currentPort = port;

    appState.systemStatus.arduinoConnected = true;
    updateArduinoStatus(true);
    showNotification("✅ Arduino connected! Reading live data...", "success");

    const textDecoder = new TextDecoder();
    const reader = port.readable.getReader();

    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Serial port closed.");
          break;
        }
        if (!value) continue;

        buffer += textDecoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop();

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          try {
            const obj = JSON.parse(line);

            // pH reading from Arduino
            if (obj.pH !== undefined) {
              const pH = parseFloat(obj.pH);
              if (!isNaN(pH)) {
                addPHReading(pH);
                console.log("🔌 Arduino pH reading:", pH);
              }
            }

            // Pump activity reported by Arduino
            if (obj.pump) {
              const pumpRaw = obj.pump.toLowerCase();
              let pumpType = null;

              if (pumpRaw.includes("basic")) pumpType = "basic";
              else if (pumpRaw.includes("acidic")) pumpType = "acidic";

              if (pumpType && pumpType !== "off") {
                logPumpActivity(pumpType, "1%");
                appState.systemStatus.pumpStatus = pumpType;
                console.log("🔌 Arduino pump:", pumpType);
              }
            }
          } catch (parseError) {
            console.log("Non-JSON from Arduino:", line);
          }
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {
        // Safe to ignore release lock errors
      }
    }

    // Close port and cleanup
    try {
      await port.close();
    } catch (e) {
      // Safe to ignore close errors
    }
    currentPort = null;
    appState.systemStatus.arduinoConnected = false;
    updateArduinoStatus(false);
    showNotification("⚠️ Arduino disconnected.", "warning");
  } catch (error) {
    console.error("Serial error:", error);
    const errorMsg = error.message || error.toString();

    if (!errorMsg.includes("cancelled")) {
      showNotification("Arduino connection failed: " + errorMsg, "error");
    }
    currentPort = null;
    appState.systemStatus.arduinoConnected = false;
    updateArduinoStatus(false);
  }
}

async function disconnectArduino() {
  if (currentPort) {
    try {
      await currentPort.close();
      currentPort = null;
      appState.systemStatus.arduinoConnected = false;
      updateArduinoStatus(false);
      showNotification("✅ Arduino disconnected.", "success");
    } catch (error) {
      console.error("Error closing port:", error);
    }
  }
}

function updateArduinoStatus(isConnected) {
  appState.systemStatus.arduinoConnected = isConnected;
  appState.systemStatus.lastUpdate = new Date();
  statusComponent.render(appState.systemStatus);

  // Re-attach button listener after re-rendering
  const connectBtn = document.getElementById("connectArduinoBtn");
  if (connectBtn) {
    connectBtn.onclick = () => {
      if (appState.systemStatus.arduinoConnected) {
        disconnectArduino();
      } else {
        connectArduino();
      }
    };
  }
}

// ==========================================
function setupEventListeners() {
  try {
    // Arduino Connect Button
    const connectBtn = document.getElementById("connectArduinoBtn");
    if (connectBtn) {
      connectBtn.addEventListener("click", () => {
        if (appState.systemStatus.arduinoConnected) {
          disconnectArduino();
        } else {
          connectArduino();
        }
      });
    }
  } catch (e) {
    console.error("❌ Arduino button setup error:", e.message);
  }

  try {
    // Hide time filter buttons (24h only)
    document.querySelectorAll(".time-filter-btn").forEach((btn) => {
      btn.style.display = "none";
    });
  } catch (e) {
    console.error("❌ Time filter buttons setup error:", e.message);
  }

  try {
    // Logout event
    window.addEventListener("logout", async () => {
      const result = await authService.signOut();
      if (result.success) {
        window.location.href = "../auth/signin.html";
      }
    });
  } catch (e) {
    console.error("❌ Logout event setup error:", e.message);
  }

  try {
    // Crop selection event
    window.addEventListener("cropSelected", async (e) => {
      const cropValue = e.detail.cropValue;
      const selectedCrop = CROPS_DATABASE.find((c) => c.value === cropValue);

      if (!selectedCrop) return;

      // Show confirmation modal
      const confirmed = await cropCardsComponent.showConfirmationModal(
        selectedCrop
      );

      if (confirmed) {
        // Update crop in database
        const result = await userService.saveCropSelection(appState.user.uid, {
          value: selectedCrop.value,
          minPH: selectedCrop.minPH,
          maxPH: selectedCrop.maxPH,
        });

        if (result.success) {
          appState.currentCrop = selectedCrop;
          appState.optimalPHMin = selectedCrop.minPH;
          appState.optimalPHMax = selectedCrop.maxPH;

          updateOptimalPHDisplay();
          cropCardsComponent.updateCurrentCrop(selectedCrop);

          // Show success message
          showNotification(`Crop changed to ${selectedCrop.label}`, "success");
        }
      }
    });
  } catch (e) {
    console.error("❌ Crop selection event setup error:", e.message);
  }
}

// ==========================================
// Notification System
// ==========================================
function showNotification(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `alert alert-${type}`;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.zIndex = "9999";
  toast.style.animation = "slideInUp var(--transition-base)";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideInUp var(--transition-base) reverse";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// Start Application
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});

// Export for debugging
window.appState = appState;
