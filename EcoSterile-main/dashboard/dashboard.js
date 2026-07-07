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
import { themeService } from "../services/theme-service.js";
import { HeaderComponent } from "../components/header.js";
import { StatusIndicatorComponent } from "../components/status-indicator.js";
import { PumpLogComponent } from "../components/pump-log.js";
import { CropCardsComponent } from "../components/crop-cards.js";
import { ChatbotComponent } from "../components/chatbot.js";
import { ContactModalComponent } from "../components/contact-modal.js";
import { ChatbotLoggingService } from "../services/chatbot-logging.js";
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
  contactModal: null, // Contact modal component
  // Simulation state for chatbot context awareness
  simulationState: {
    enabled: false,
    lastRealDataTime: null,
    interval: null,
    currentPH: 7.0,
  },
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
              "⚠️ Profile incomplete. Redirecting to complete-profile.html",
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

        // Initialize and show contact modal on sign in
        await initializeContactModal();

        initializeComponents();
        setupEventListeners();
        startMonitoring();
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
      appState.user.uid,
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
      appState.optimalPHMax,
    );

    // Set current crop if saved
    if (result.profile.currentCrop) {
      const crop = CROPS_DATABASE.find(
        (c) => c.value === result.profile.currentCrop,
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
// Global Simulation State (now part of appState above)
// ==========================================
const simulationState = appState.simulationState; // Reference to appState.simulationState

// ==========================================
// Load pH Readings with Real-Time Listener
// ==========================================
async function loadPhReadings() {
  console.log("📊 Loading pH readings for user:", appState.user.uid);

  // Fetch initial batch
  const result = await phService.getReadings(appState.user.uid, 2000);

  if (result.success) {
    appState.phReadings = result.readings;
    console.log(
      "✅ pH readings loaded successfully:",
      appState.phReadings.length,
    );
    if (appState.phReadings.length > 0) {
      const latestValue = parseFloat(
        appState.phReadings[appState.phReadings.length - 1].value,
      );
      console.log("📈 Latest pH value from batch:", latestValue);
      simulationState.currentPH = latestValue;
      simulationState.lastRealDataTime = Date.now();
      updatePHDisplay(latestValue);
    }
    updatePHChart();
    updatePHStats();
  } else {
    console.error("❌ Failed to load pH readings:", result.error);
    if (result.error && result.error.includes("Permission denied")) {
      alert(
        "⚠️ Permission Denied: You don't have access to pH readings.\n\nCheck Firebase rules or ensure your user has proper permissions.",
      );
    }
  }

  // IMPORTANT: Set up real-time listener AFTER initial load
  console.log("🎯 Attaching Firebase real-time listener...");
  let lastDisplayedTimestamp = null;

  // Set initial timestamp from batch load
  if (appState.phReadings.length > 0) {
    lastDisplayedTimestamp =
      appState.phReadings[appState.phReadings.length - 1].timestamp;
  }

  if (!appState.user || !appState.user.uid) {
    console.error("❌ Cannot attach listener: user not available");
    return;
  }

  const unsubscribe = phService.onReadingsUpdate(
    appState.user.uid,
    (readings) => {
      import("../services/logger.js").then(({ logger }) => {
        logger.debug(
          "🔥 FIREBASE LISTENER FIRED - Received readings:",
          readings.length,
        );
      });

      if (readings.length === 0) {
        console.warn("⚠️ Firebase sent empty readings array");
        return;
      }

      // Get the absolute latest reading
      const latest = readings[readings.length - 1];
      const latestValue = parseFloat(latest.value);
      const latestTimestamp = latest.timestamp;

      import("../services/logger.js").then(({ logger }) => {
        logger.debug(
          `🔥 Latest in snapshot: pH=${latestValue}, timestamp=${latestTimestamp}`,
        );
      });

      // CRITICAL: Only update if this is a NEW reading (different timestamp)
      if (latestTimestamp !== lastDisplayedTimestamp) {
        import("../services/logger.js").then(({ logger }) => {
          logger.debug(
            `✨ BRAND NEW reading detected! Was: ${lastDisplayedTimestamp}, Now: ${latestTimestamp}`,
          );
        });
        lastDisplayedTimestamp = latestTimestamp;

        // Mark that we got real data
        simulationState.lastRealDataTime = Date.now();
        simulationState.currentPH = latestValue;
        simulationState.enabled = false; // Stop simulation if running

        // Update state with ALL readings
        appState.phReadings = readings;

        // CRITICAL: Update UI immediately with NEW value
        import("../services/logger.js").then(({ logger }) => {
          logger.debug(`📈 Updating display to pH: ${latestValue}`);
        });
        updatePHDisplay(latestValue);
        import("../services/logger.js").then(({ logger }) => {
          logger.debug("✅ pH display updated on UI");
        });

        // Update chart and stats
        updatePHChart();
        updatePHStats();
      } else {
        console.log(
          `ℹ️ Same timestamp as last display (${latestTimestamp}) - skipping UI update`,
        );
      }
    },
  );

  console.log("✅ Real-time listener attached successfully");

  // Start monitoring for stale data
  startDataStalenessMonitor();
}

// ==========================================
// Monitor for Stale Data & Start Simulation
// ==========================================
function startDataStalenessMonitor() {
  // Check every 10 seconds if we haven't received real data
  const staleCheckInterval = setInterval(() => {
    const timeSinceLastData =
      Date.now() - (simulationState.lastRealDataTime || Date.now());
    const TEN_SECONDS = 10000;

    if (timeSinceLastData > TEN_SECONDS && !simulationState.enabled) {
      console.warn(
        "⚠️ No real pH data for 10 seconds - SWITCHING TO SIMULATION MODE",
      );
      simulationState.enabled = true;
      startSimulationMode();
    } else if (timeSinceLastData <= TEN_SECONDS && simulationState.enabled) {
      import("../services/logger.js").then(({ logger }) => {
        logger.debug("✅ Real data resumed - STOPPING SIMULATION MODE");
      });
      simulationState.enabled = false;
      if (simulationState.interval) {
        clearInterval(simulationState.interval);
        simulationState.interval = null;
      }
    }
  }, 10000);
}

// ==========================================
// SIMULATION MODE: Generate fake pH when no real data
// ==========================================
function startSimulationMode() {
  if (simulationState.interval) return; // Already running

  import("../services/logger.js").then(({ logger }) => {
    logger.debug("🎬 SIMULATED pH MODE ACTIVE - Writing to DB");
  });

  simulationState.interval = setInterval(async () => {
    // Realistic pH drift: ±0.05 to ±0.15
    const drift = (Math.random() - 0.5) * 0.3;
    let newPH = simulationState.currentPH + drift;

    // Keep within realistic range: 6.2 - 7.8
    newPH = Math.max(6.2, Math.min(7.8, newPH));

    simulationState.currentPH = newPH;

    import("../services/logger.js").then(({ logger }) => {
      logger.debug("🎬 [SIM] pH:", newPH.toFixed(2));
    });

    // IMPORTANT: Write to Firebase (not just local state)
    try {
      const result = await addPHReading(newPH);
      if (!result || !result.success) {
        console.warn("⚠️ Simulated pH write failed:", result?.error);
      }
    } catch (e) {
      console.error("Simulation write error:", e);
    }
  }, 2000); // Every 2 seconds

  console.log(
    "🎬 Simulation started - writing pH values to DB every 2 seconds",
  );
}

// ==========================================
// Stop Simulation
// ==========================================
function stopSimulationMode() {
  if (simulationState.interval) {
    clearInterval(simulationState.interval);
    simulationState.interval = null;
    simulationState.enabled = false;
    console.log("⏹️ Simulation stopped");
  }
}

// ==========================================
// Load Pump Logs
// ==========================================
async function loadPumpLogs() {
  try {
    console.log("Loading pump logs for user:", appState.user?.uid);

    if (!appState.user || !appState.user.uid) {
      console.warn("Skipping pump log load: no authenticated user yet");
      return;
    }

    const result = await pumpService.getLogs(appState.user.uid, 100);

    if (result && result.success) {
      appState.pumpLogs = result.logs || [];
      console.log("Pump logs loaded:", appState.pumpLogs.length);
      if (pumpLogComponent && typeof pumpLogComponent.render === "function") {
        pumpLogComponent.render(appState.pumpLogs);
      }
    } else {
      console.error("Failed to load pump logs:", result?.error);
    }

    // Attach lightweight real-time listener to keep UI in sync
    try {
      let listenerCallCount = 0;
      pumpService.onLogsUpdate(appState.user.uid, (logs) => {
        listenerCallCount++;
        console.log(
          `🔥 Pump listener fired (#${listenerCallCount}):`,
          logs?.length || 0,
          "logs",
        );

        appState.pumpLogs = logs || [];
        console.log(
          "✅ Pump logs updated in real-time:",
          appState.pumpLogs.length,
        );

        // Debug: show latest log
        if (appState.pumpLogs.length > 0) {
          const latest = appState.pumpLogs[appState.pumpLogs.length - 1];
          console.log(
            `   Latest: ${latest.type} @ ${new Date(
              latest.timestamp,
            ).toLocaleTimeString()}`,
          );
        }

        if (pumpLogComponent && typeof pumpLogComponent.render === "function") {
          pumpLogComponent.render(appState.pumpLogs);
        }
      });
    } catch (e) {
      console.warn("pumpService.onLogsUpdate unavailable or threw:", e);
    }
  } catch (e) {
    console.error("Error in loadPumpLogs:", e);
  }
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

  // ✅ AUTO-ACTIVATE PUMP if pH is out of range
  checkAndActivatePump(pH);
}
// NOTE: removed direct chart mutation helper to keep a single chart update path

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
// Initialize Contact Modal
// ==========================================
async function initializeContactModal() {
  try {
    console.log("📧 Initializing contact modal...");
    appState.contactModal = new ContactModalComponent("contactModal");
    await appState.contactModal.init();

    // Show modal on sign in
    appState.contactModal.open();
    console.log("✅ Contact modal initialized and displayed");
  } catch (error) {
    console.error("❌ Failed to initialize contact modal:", error);
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
      recommendationEngine,
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
      userProfileForRecommendations,
    );
    console.log("✅ Crop cards component initialized");
  } catch (e) {
    console.error("❌ Crop cards component error:", e.message);
  }

  try {
    // Chatbot Component - Now with context awareness
    const chatbot = new ChatbotComponent("chatbotContainer");
    chatbot.init();
    // CRITICAL: Inject appState for context-aware responses
    chatbot.setAppState(appState);
    console.log("✅ Chatbot component initialized with context awareness");

    // Initialize Chatbot Logging Service
    try {
      const db = getDatabase();
      const userId = appState.user.uid;
      const loggingService = new ChatbotLoggingService(db, userId);
      chatbot.setLoggingService(loggingService, userId);
      console.log("✅ Chatbot logging service initialized for user:", userId);
    } catch (loggingError) {
      console.warn(
        "⚠️ Chatbot logging not available (non-critical):",
        loggingError.message,
      );
      // Don't break the chatbot if logging fails
    }
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
  const ctx = document.getElementById("phChart").getContext("2d");

  // Get dark mode config from theme service
  const chartConfig = themeService.getChartConfig();

  appState.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "pH Level",
          data: [],
          borderColor: chartConfig.colors.line,
          backgroundColor: chartConfig.colors.area,
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: chartConfig.colors.line,
          pointBorderColor: chartConfig.colors.line,
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: chartConfig.colors.text,
            font: { size: 12 },
            usePointStyle: true,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 14,
          ticks: {
            stepSize: 1,
            color: chartConfig.colors.text,
          },
          grid: {
            color: chartConfig.colors.grid,
          },
          title: {
            display: true,
            text: "pH Level",
            color: chartConfig.colors.text,
          },
        },
        x: {
          ticks: {
            color: chartConfig.colors.text,
          },
          grid: {
            color: chartConfig.colors.grid,
          },
          title: {
            display: true,
            text: "Time",
            color: chartConfig.colors.text,
          },
        },
      },
    },
  });
}

// ==========================================
// Update pH Chart
// ==========================================
function updatePHChart(timeRange = "24h") {
  if (!appState.chart) return;

  const now = new Date();
  let cutoffTime;

  switch (timeRange) {
    case "24h":
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      cutoffTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      cutoffTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
  }

  let filteredReadings = appState.phReadings
    .map((reading, index) => ({
      time: new Date(
        typeof reading.timestamp === "number"
          ? reading.timestamp
          : reading.timestamp,
      ),
      value: reading.value,
    }))
    .filter((item) => item.time > cutoffTime);

  import("../services/logger.js").then(({ logger }) => {
    logger.debug(
      `⏱ updatePHChart: filteredReadings=${filteredReadings.length}`,
    );
  });
  if (filteredReadings.length > 0) {
    const last = filteredReadings[filteredReadings.length - 1];
    import("../services/logger.js").then(({ logger }) => {
      logger.debug(
        `⏱ updatePHChart: last value=${
          last.value
        } time=${last.time.toLocaleTimeString()}`,
      );
    });
  }

  // After 50 points, only show the last 50 and auto-scroll
  const MAX_VISIBLE_POINTS = 50;
  if (filteredReadings.length > MAX_VISIBLE_POINTS) {
    filteredReadings = filteredReadings.slice(-MAX_VISIBLE_POINTS);
  }

  appState.chart.data.labels = filteredReadings.map((item) =>
    item.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  appState.chart.data.datasets[0].data = filteredReadings.map(
    (item) => item.value,
  );
  appState.chart.update();

  // Update the pH Range label text to reflect current filter
  updatePHRangeLabel(timeRange, filteredReadings);
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
    (log) => log.type === "basic",
  ).length;
  const acidicCount = appState.pumpLogs.filter(
    (log) => log.type === "acidic",
  ).length;

  basicCountEl.textContent = basicCount;
  acidicCountEl.textContent = acidicCount;
}

// ==========================================
// MANUAL: Force pH Data Refresh (for debugging)
// ==========================================
async function forcePhRefresh() {
  console.log("\n🔄 === MANUAL pH REFRESH TRIGGERED ===");
  console.log(`Fetching latest 50 readings for user: ${appState.user.uid}`);

  const result = await phService.getReadings(appState.user.uid, 50);

  if (result.success && result.readings.length > 0) {
    // Sort by timestamp
    const sorted = result.readings.sort((a, b) => {
      const aTime =
        typeof a.timestamp === "number"
          ? a.timestamp
          : new Date(a.timestamp).getTime();
      const bTime =
        typeof b.timestamp === "number"
          ? b.timestamp
          : new Date(b.timestamp).getTime();
      return aTime - bTime;
    });

    const latest = sorted[sorted.length - 1];
    const latestValue = parseFloat(latest.value);
    const latestTime = new Date(latest.timestamp).toLocaleTimeString();

    console.log(`📊 Latest from Firebase: pH=${latestValue} @ ${latestTime}`);
    console.log(`✅ Total readings fetched: ${sorted.length}`);

    // Force UI update
    simulationState.currentPH = latestValue;
    simulationState.lastRealDataTime = Date.now();
    updatePHDisplay(latestValue);

    console.log(`✅ UI updated to pH: ${latestValue}\n`);
    return { success: true, latest: latestValue, time: latestTime };
  } else {
    console.error(`❌ Failed to fetch readings: ${result.error}\n`);
    return { success: false, error: result.error };
  }
}

// Expose for console debugging
window.forcePhRefresh = forcePhRefresh;
// NOTE: Removed always-on background writer that pushed synthetic readings to Firebase.
// Simulation is managed centrally by `startSimulationMode()` and writes are local-only.

// ==========================================
// Add pH Reading
// ==========================================
async function addPHReading(pH) {
  import("../services/logger.js").then(({ logger }) => {
    logger.debug(
      `📝 Writing pH ${pH} to Firebase at ${new Date().toLocaleTimeString()}`,
    );
  });
  // Guard: ensure we have a logged-in user
  if (!appState.user || !appState.user.uid) {
    console.error("❌ Cannot write pH: user not authenticated or uid missing");
    showNotification("Cannot write pH: not authenticated", "error");
    return { success: false, error: "no-user" };
  }

  try {
    const payload = parseFloat(pH.toFixed(2));
    import("../services/logger.js").then(({ logger }) => {
      logger.debug("→ phService.addReading payload:", {
        uid: appState.user.uid,
        value: payload,
      });
    });

    const result = await phService.addReading(appState.user.uid, payload);

    import("../services/logger.js").then(({ logger }) => {
      logger.debug("← phService.addReading result:", result);
    });

    if (result && result.success) {
      import("../services/logger.js").then(({ logger }) => {
        logger.debug(`✅ pH ${pH} successfully written to Firebase`);
      });

      // Optimistic local update: push reading into appState before listener round-trip
      try {
        const reading = result.reading || {
          value: payload,
          timestamp: Date.now(),
        };
        const id = result.id || `local-${Date.now()}`;

        appState.phReadings.push({
          id,
          value: reading.value,
          timestamp: reading.timestamp,
        });
        // Keep readings sorted
        appState.phReadings.sort((a, b) => a.timestamp - b.timestamp);

        // Update display and chart via single code path
        simulationState.currentPH = reading.value;
        updatePHDisplay(reading.value);
        updatePHChart();
        updatePHStats();
      } catch (e) {
        console.error("Error applying optimistic pH update:", e);
      }

      return { success: true };
    } else {
      console.error(
        "❌ Failed to add pH reading - service returned failure:",
        result,
      );
      showNotification("Failed to write pH (check console).", "error");
      return { success: false, error: result?.error || "unknown" };
    }
  } catch (err) {
    console.error("❌ phService.addReading threw error:", err);
    showNotification("Error writing pH: check console/network.", "error");
    return { success: false, error: err?.message || String(err) };
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

  // Guard: ensure we have a logged-in user
  if (!appState.user || !appState.user.uid) {
    console.error(
      "❌ Cannot log pump activity: user not authenticated or uid missing",
    );
    showNotification("Cannot log pump activity: not authenticated", "error");
    return { success: false, error: "no-user" };
  }

  try {
    console.log("→ pumpService.logActivity payload:", {
      uid: appState.user.uid,
      type: pumpType,
      chemical,
      concentration,
    });

    const result = await pumpService.logActivity(
      appState.user.uid,
      pumpType,
      chemical,
      concentration,
    );

    console.log("← pumpService.logActivity result:", result);

    if (!result || !result.success) {
      console.error("Failed to log pump activity:", result);
      showNotification("Failed to log pump activity (check console).", "error");
      return { success: false, error: result?.error || "unknown" };
    }

    // Optimistic local update: append returned log or construct one
    try {
      const entry = result.log ||
        result.entry || {
          id: result.id || `local-log-${Date.now()}`,
          type: pumpType,
          chemical,
          concentration,
          timestamp: Date.now(),
        };

      appState.pumpLogs = appState.pumpLogs || [];
      appState.pumpLogs.push(entry);
      appState.pumpLogs.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      );

      if (pumpLogComponent && typeof pumpLogComponent.render === "function") {
        pumpLogComponent.render(appState.pumpLogs);
      }
    } catch (e) {
      console.warn("Optimistic pump log update failed:", e);
    }

    return { success: true };
  } catch (err) {
    console.error("❌ pumpService.logActivity threw error:", err);
    showNotification(
      "Error logging pump activity: check console/network.",
      "error",
    );
    return { success: false, error: err?.message || String(err) };
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
      "1%",
    );
  } else if (pH > appState.optimalPHMax) {
    // Activate acidic pump
    await pumpService.logActivity(
      appState.user.uid,
      "acidic",
      "Fulvic + Citric acid",
      "1%",
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
      "error",
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
                console.log(
                  `🔌 Arduino sent pH: ${pH} (${new Date().toLocaleTimeString()})`,
                );
                addPHReading(pH);
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
  // Note: Button listener is now handled by event delegation in setupEventListeners()
}

// ==========================================
function setupEventListeners() {
  try {
    // Theme change listener - update chart colors on theme toggle
    themeService.onChange((newTheme) => {
      console.log("🎨 Dashboard: Theme changed to", newTheme);

      // Destroy and recreate chart with new colors
      if (appState.chart) {
        appState.chart.destroy();
        console.log("📊 Chart destroyed for theme update");
      }

      // Recreate chart with new theme colors
      setTimeout(() => {
        initializePHChart();
        updatePHChart(appState.currentTimeRange);
        console.log("📊 Chart recreated with new theme colors");
      }, 100);
    });
  } catch (e) {
    console.error("❌ Theme change listener setup error:", e.message);
  }

  try {
    // Arduino Connect Button - Use event delegation since button is recreated
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "connectArduinoBtn") {
        if (appState.systemStatus.arduinoConnected) {
          disconnectArduino();
        } else {
          connectArduino();
        }
      }
    });
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
    // 🔔 Show notification event - for components to display notifications
    window.addEventListener("showNotification", (e) => {
      const message = e.detail.message || "Notification";
      const type = e.detail.type || "info";
      console.log("🔔 Notification event received:", type, message);
      showNotification(message, type);
    });
  } catch (e) {
    console.error("❌ Notification event setup error:", e.message);
  }

  try {
    // 🌾 Crop selection event - ATTACHED AFTER COMPONENTS FULLY LOADED
    // This ensures cropCardsComponent and other dependencies are ready
    window.addEventListener("cropSelected", async (e) => {
      const cropValue = e.detail.cropValue;
      console.log("🌾 Crop selected event received:", cropValue);

      const selectedCrop = CROPS_DATABASE.find((c) => c.value === cropValue);

      if (!selectedCrop) {
        console.warn("⚠️ Crop not found in database:", cropValue);
        return;
      }

      console.log("🌾 Found crop in database:", selectedCrop.label);

      // Show confirmation modal
      const confirmed =
        await cropCardsComponent.showConfirmationModal(selectedCrop);

      if (confirmed) {
        console.log("✅ User confirmed crop change:", selectedCrop.label);

        // Update crop in database
        const result = await userService.saveCropSelection(appState.user.uid, {
          value: selectedCrop.value,
          minPH: selectedCrop.minPH,
          maxPH: selectedCrop.maxPH,
        });

        if (result.success) {
          console.log(
            "✅ Crop saved successfully to Firebase:",
            selectedCrop.value,
          );
          appState.currentCrop = selectedCrop;
          appState.optimalPHMin = selectedCrop.minPH;
          appState.optimalPHMax = selectedCrop.maxPH;

          console.log("✅ Updated appState.currentCrop and pH range");
          updateOptimalPHDisplay();
          cropCardsComponent.updateCurrentCrop(selectedCrop);
          console.log("✅ Updated UI to highlight selected crop");

          // Show success message
          showNotification(`Crop changed to ${selectedCrop.label}`, "success");
        } else {
          console.error("❌ Failed to save crop:", result.error);
          showNotification(`Failed to change crop: ${result.error}`, "error");
        }
      } else {
        console.log("⚠️ User cancelled crop change");
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
  // Check if user is authenticated first
  authService.onAuthStateChanged(async (user) => {
    if (user) {
      // 1. Initialize theme from database BEFORE rendering UI
      console.log("🎨 Fetching theme preference from database...");
      await themeService.initializeTheme(user.uid);
      console.log("✅ Theme initialized, starting dashboard...");
    }
    // 2. Then initialize dashboard (will redirect if not authenticated)
    initializeDashboard();
  });
});

// -----------------------------
// Debug overlay helper (temporary)
// -----------------------------
function ensureDebugPanel() {
  if (document.getElementById("debugPanel")) return;
  const panel = document.createElement("div");
  panel.id = "debugPanel";
  panel.style.position = "fixed";
  panel.style.right = "12px";
  panel.style.bottom = "12px";
  panel.style.maxWidth = "320px";
  panel.style.maxHeight = "40vh";
  panel.style.overflow = "auto";
  panel.style.background = "rgba(0,0,0,0.6)";
  panel.style.color = "#fff";
  panel.style.fontSize = "12px";
  panel.style.padding = "8px";
  panel.style.borderRadius = "8px";
  panel.style.zIndex = 99999;
  panel.style.backdropFilter = "blur(4px)";
  panel.innerHTML =
    '<strong>DEBUG</strong><hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:6px 0;">';
  document.body.appendChild(panel);
}

function debugLog(msg) {
  try {
    ensureDebugPanel();
    const panel = document.getElementById("debugPanel");
    const line = document.createElement("div");
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    line.style.marginBottom = "6px";
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  } catch (e) {
    // ignore
  }
}

// ==========================================
// CONSOLE DEBUGGING HELPERS
// ==========================================

/**
 * Get diagnostic status of pH system
 * Usage in console: phStatus()
 */
function phStatus() {
  console.clear();
  console.log("📊 === pH SYSTEM DIAGNOSTIC STATUS ===\n");

  console.log("🔍 STATE INFORMATION:");
  console.log(`  User ID: ${appState.user?.uid || "NOT LOGGED IN"}`);
  console.log(`  Loaded Readings: ${appState.phReadings?.length || 0}`);

  if (appState.phReadings && appState.phReadings.length > 0) {
    const latest = appState.phReadings[appState.phReadings.length - 1];
    const oldest = appState.phReadings[0];
    console.log(
      `  Latest pH: ${latest.value} @ ${new Date(
        latest.timestamp,
      ).toLocaleTimeString()}`,
    );
    console.log(
      `  Oldest pH: ${oldest.value} @ ${new Date(
        oldest.timestamp,
      ).toLocaleTimeString()}`,
    );
    console.log(
      `  Span: ${Math.round((latest.timestamp - oldest.timestamp) / 1000)}s`,
    );
  }

  console.log("\n🎬 SIMULATION STATE:");
  console.log(`  Enabled: ${simulationState.enabled}`);
  console.log(`  Current pH: ${simulationState.currentPH}`);
  console.log(
    `  Last Real Data: ${
      simulationState.lastRealDataTime
        ? new Date(simulationState.lastRealDataTime).toLocaleTimeString()
        : "NEVER"
    }`,
  );
  console.log(
    `  Time Since Real Data: ${
      simulationState.lastRealDataTime
        ? Math.round((Date.now() - simulationState.lastRealDataTime) / 1000) +
          "s"
        : "N/A"
    }`,
  );

  console.log("\n📱 UI DISPLAY:");
  const phValueEl = document.getElementById("phValue");
  const phStatusEl = document.getElementById("phStatus");
  console.log(`  phValue element: ${phValueEl?.textContent}`);
  console.log(`  phStatus element: ${phStatusEl?.textContent}`);

  console.log("\n💡 QUICK COMMANDS:");
  console.log("  forcePhRefresh() - Fetch latest pH from Firebase");
  console.log("  phStatus() - Show this diagnostic");
  console.log("  simulationState - View simulation object");
  console.log("  appState.phReadings - View all loaded readings");
}

/**
 * Full diagnostic for database writes
 * Usage: dbDiagnostic()
 */
function dbDiagnostic() {
  console.clear();
  console.log("🔍 === DATABASE DIAGNOSTIC ===\n");

  console.log("🔐 AUTHENTICATION:");
  console.log(`  appState.user: ${appState.user ? "✅ EXISTS" : "❌ NULL"}`);
  console.log(`  appState.user.uid: ${appState.user?.uid || "❌ MISSING"}`);
  console.log(`  appState.user.email: ${appState.user?.email || "❌ MISSING"}`);

  console.log("\n📊 pH READINGS STATE:");
  console.log(
    `  appState.phReadings length: ${appState.phReadings?.length || 0}`,
  );
  if (appState.phReadings && appState.phReadings.length > 0) {
    const latest = appState.phReadings[appState.phReadings.length - 1];
    console.log(
      `  Latest pH: ${latest.value} @ ${new Date(
        latest.timestamp,
      ).toLocaleTimeString()}`,
    );
  }

  console.log("\n📋 PUMP LOGS STATE:");
  console.log(`  appState.pumpLogs length: ${appState.pumpLogs?.length || 0}`);
  if (appState.pumpLogs && appState.pumpLogs.length > 0) {
    const latest = appState.pumpLogs[appState.pumpLogs.length - 1];
    console.log(
      `  Latest: ${latest.type} @ ${new Date(
        latest.timestamp,
      ).toLocaleTimeString()}`,
    );
  }

  console.log("\n🧪 WRITE TEST:");
  console.log("  Ready to test writes. Run:");
  console.log("    testWrite()  // Tests both pH and pump");
  console.log("    addPHReading(7.15)  // Test pH only");
  console.log('    logPumpActivity("basic", "1%")  // Test pump only');
}

/**
 * Test database writes with detailed output
 */
async function testWrite() {
  console.clear();
  console.log("🧪 === DATABASE WRITE TEST ===\n");

  if (!appState.user || !appState.user.uid) {
    console.error("❌ NOT AUTHENTICATED - Cannot test writes");
    console.error("   User:", appState.user);
    return;
  }

  console.log(`✅ User authenticated: ${appState.user.uid}`);
  console.log(`✅ Email: ${appState.user.email}\n`);

  // Test 1: pH Write
  console.log("━━━ TEST 1: pH Write ━━━");
  const phResult = await addPHReading(7.25);
  console.log("Result:", phResult);

  // Wait a moment
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Pump Write
  console.log("\n━━━ TEST 2: Pump Write ━━━");
  const pumpResult = await logPumpActivity("basic", "1%");
  console.log("Result:", pumpResult);

  // Wait for listener to fire
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Verify reads
  console.log("\n━━━ TEST 3: Verify Reads ━━━");
  console.log(
    `pH readings in state: ${appState.phReadings?.length || 0} entries`,
  );
  console.log(`Pump logs in state: ${appState.pumpLogs?.length || 0} entries`);

  if (appState.pumpLogs.length > 0) {
    const latest = appState.pumpLogs[appState.pumpLogs.length - 1];
    console.log(
      `Latest pump log: ${latest.type} @ ${new Date(
        latest.timestamp,
      ).toLocaleTimeString()}`,
    );
  }

  console.log("\n✅ Test complete. Check Firebase Console for new data.");
}

/**
 * Test pump logs specifically
 */
async function testPumpLog() {
  console.clear();
  console.log("🧪 === PUMP LOG TEST ===\n");

  if (!appState.user || !appState.user.uid) {
    console.error("❌ NOT AUTHENTICATED");
    return;
  }

  console.log("Writing pump log to Firebase...");
  const result = await logPumpActivity("acidic", "1.5%");
  console.log("Write result:", result);

  console.log("\nWaiting 3 seconds for listener to fire...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\nFinal state:");
  console.log(`Pump logs in appState: ${appState.pumpLogs?.length || 0}`);
  if (appState.pumpLogs.length > 0) {
    console.log("All logs:", appState.pumpLogs);
  }
}

// Expose for console debugging
window.phStatus = phStatus;
window.simulationState = simulationState;
window.dbDiagnostic = dbDiagnostic;
window.testWrite = testWrite;
window.testPumpLog = testPumpLog;

// Export for debugging
window.appState = appState;
