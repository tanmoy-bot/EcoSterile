/**
 * Dashboard Controller
 * Main dashboard logic and data management
 */

import { onAuthChange, logout } from "../auth/auth.js";
import { notificationManager } from "../components/notifications.js";
import { showLoading, hideLoading } from "../components/loader.js";
import * as phService from "../services/ph-service.js";
import * as dbService from "../services/database.js";
import {
  fetchWeatherData,
  getUserLocation,
} from "../services/weather-service.js";

// State
let currentUser = null;
let phChart = null;
let currentTimeRange = "24h";

// DOM Elements
const phValue = document.getElementById("ph-value");
const phStatus = document.getElementById("ph-status");
const scaleIndicator = document.getElementById("scale-indicator");
const optimalRange = document.getElementById("optimal-range");
const pumpContent = document.getElementById("pump-content");
const avgPh = document.getElementById("avg-ph");
const phRange = document.getElementById("ph-range");
const basicCount = document.getElementById("basic-count");
const acidicCount = document.getElementById("acidic-count");
const cropSelect = document.getElementById("crop-select");
const cropInfo = document.getElementById("crop-info");
const logList = document.getElementById("log-list");
const userAvatar = document.getElementById("user-avatar");
const userDropdown = document.getElementById("user-dropdown");
const logoutBtn = document.getElementById("logout-btn");
const timeButtons = document.querySelectorAll(".time-btn");
const chartContainer = document.getElementById("ph-chart");

// Initialize
async function init() {
  // Check authentication
  onAuthChange((authState) => {
    if (authState.isAuthenticated) {
      currentUser = authState.user;
      setupUI();
      startDashboard();
    } else {
      // Redirect to login if not authenticated
      window.location.href = "index.html";
    }
  });
}

/**
 * Setup UI with user info
 */
function setupUI() {
  if (currentUser) {
    const initial = (currentUser.displayName || currentUser.email || "U")
      .charAt(0)
      .toUpperCase();
    document.getElementById("avatar-initial").textContent = initial;
  }

  // User menu toggle
  userAvatar.addEventListener("click", () => {
    userDropdown.classList.toggle("open");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
      userDropdown.classList.remove("open");
    }
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    showLoading("Signing out...");
    await logout();
    hideLoading();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  });
}

/**
 * Start dashboard data collection
 */
function startDashboard() {
  // Initialize chart
  initializeChart();

  // Load saved data
  phService.loadPHData();
  updateAllUI();

  // Listen for real-time updates from Firebase
  setupRealtimeListeners();

  // Crop selector
  setupCropSelector();

  // Time range buttons
  setupTimeRangeButtons();

  // Start simulation/demo if no real Arduino
  startDemoData();

  // Update every 5 seconds
  setInterval(updateAllUI, 5000);
}

/**
 * Setup real-time Firebase listeners
 */
function setupRealtimeListeners() {
  // Listen for pH readings
  dbService.onPHReadingsUpdate((readings) => {
    readings.forEach((reading) => {
      if (reading.value !== undefined && reading.timestamp) {
        phService.addPHReading(reading.value);
      }
    });
    updateAllUI();
  });

  // Listen for pump activities
  dbService.onPumpActivityUpdate((activities) => {
    // Load pump activities
    // Note: This is a simplified approach - in production, sync better with local data
  });
}

/**
 * Initialize Chart.js
 */
function initializeChart() {
  const ctx = chartContainer.getContext("2d");
  phChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "pH Level",
          data: [],
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "rgb(16, 185, 129)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 5,
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
            color: "rgb(241, 245, 249)",
            font: { size: 12 },
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 14,
          ticks: {
            color: "rgb(148, 163, 184)",
            stepSize: 2,
          },
          grid: {
            color: "rgba(51, 65, 85, 0.5)",
          },
        },
        x: {
          ticks: {
            color: "rgb(148, 163, 184)",
          },
          grid: {
            color: "rgba(51, 65, 85, 0.5)",
          },
        },
      },
    },
  });
}

/**
 * Update all UI elements
 */
function updateAllUI() {
  updatePHDisplay();
  updatePumpInfo();
  updateStats();
  updateChart();
  updateLog();
}

/**
 * Update pH display
 */
function updatePHDisplay() {
  // Get latest pH reading from local storage or demo
  const history = phService.getPHHistory();
  if (history.values.length === 0) {
    phValue.textContent = "--";
    phStatus.textContent = "No data";
    return;
  }

  const latestPH = history.values[history.values.length - 1];
  const status = phService.getPHStatus(latestPH);

  phValue.textContent = latestPH.toFixed(1);
  phStatus.textContent = status.label;
  phStatus.style.color = status.color;

  // Update scale indicator
  const percentage = (latestPH / 14) * 100;
  scaleIndicator.style.left = percentage + "%";
}

/**
 * Update pump info
 */
function updatePumpInfo() {
  const lastPump = phService.getLastPump();

  if (!lastPump) {
    pumpContent.innerHTML =
      '<div class="empty-state">No pump activity yet</div>';
    return;
  }

  const pumpClass = lastPump.type === "basic" ? "pump-basic" : "pump-acidic";
  const pumpLabel =
    lastPump.type === "basic" ? "💧 Basic Pump" : "⚗️ Acidic Pump";
  const timeAgo = phService.getTimeAgo(lastPump.timestamp);

  pumpContent.innerHTML = `
        <div class="pump-item ${pumpClass}">
            <div class="pump-name">${pumpLabel}</div>
            <div class="pump-details">
                <div class="detail-row">
                    <span>Time Used:</span>
                    <span>${timeAgo}</span>
                </div>
                <div class="detail-row">
                    <span>Solution:</span>
                    <span>${lastPump.solution}</span>
                </div>
                <div class="detail-row">
                    <span>Concentration:</span>
                    <span>${lastPump.concentration}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update statistics
 */
function updateStats() {
  const stats = phService.calculateStats();

  avgPh.textContent = stats.average !== null ? stats.average.toFixed(2) : "--";
  phRange.textContent =
    stats.min !== null ? `${stats.min} - ${stats.max}` : "-- - --";
  basicCount.textContent = stats.basicPumpCount;
  acidicCount.textContent = stats.acidicPumpCount;
}

/**
 * Update chart
 */
function updateChart() {
  const history = phService.getPHHistory();
  const range = dbService.getFilteredReadings(
    history.timestamps.map((ts, i) => ({
      timestamp: ts,
      value: history.values[i],
    })),
    currentTimeRange
  );

  const labels = range.map((r) => {
    const date = new Date(r.timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const data = range.map((r) => r.value);

  if (phChart) {
    phChart.data.labels = labels;
    phChart.data.datasets[0].data = data;
    phChart.update();
  }
}

/**
 * Update activity log
 */
function updateLog() {
  const pumpLog = phService.getPumpLog();

  if (pumpLog.length === 0) {
    logList.innerHTML =
      '<div class="empty-state">No pump activity recorded</div>';
    return;
  }

  const recentLogs = pumpLog.slice(-10).reverse();
  logList.innerHTML = recentLogs
    .map((log) => {
      const logClass = log.type === "basic" ? "pump-basic" : "pump-acidic";
      const pumpLabel = log.type === "basic" ? "💧 Basic" : "⚗️ Acidic";
      const timestamp = new Date(log.timestamp).toLocaleString();

      return `
            <div class="log-entry ${logClass}">
                <div class="log-content">
                    <div class="log-pump">${pumpLabel}</div>
                    <div class="log-details">
                        ${log.solution} - ${log.concentration}
                    </div>
                </div>
                <div class="log-time">${timestamp}</div>
            </div>
        `;
    })
    .join("");
}

/**
 * Setup crop selector
 */
function setupCropSelector() {
  const option = cropSelect.options[cropSelect.selectedIndex];
  updateCropDisplay(option);

  cropSelect.addEventListener("change", (e) => {
    const option = e.target.options[e.target.selectedIndex];
    updateCropDisplay(option);

    const minPH = parseFloat(option.dataset.min);
    const maxPH = parseFloat(option.dataset.max);
    phService.setOptimalPHRange(minPH, maxPH);

    notificationManager.success(`Crop changed to ${option.text}`);
  });
}

function updateCropDisplay(option) {
  const minPH = option.dataset.min;
  const maxPH = option.dataset.max;

  optimalRange.textContent = `${minPH} - ${maxPH}`;
  cropInfo.innerHTML = `
        <div>Selected Crop: <strong>${option.text}</strong></div>
        <div class="crop-range">Optimal pH: <strong>${minPH} - ${maxPH}</strong></div>
    `;

  phService.setOptimalPHRange(minPH, maxPH);
}

/**
 * Setup time range buttons
 */
function setupTimeRangeButtons() {
  timeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      timeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTimeRange = btn.dataset.range;
      updateChart();
    });
  });
}

/**
 * Start demo data generation
 */
function startDemoData() {
  let currentPH = 7.0;

  setInterval(() => {
    // Generate random pH fluctuation
    const change = (Math.random() - 0.5) * 0.3;
    currentPH = Math.max(4, Math.min(10, currentPH + change));

    // Add reading
    phService.addPHReading(currentPH);

    // Simulate pump action
    const pumpAction = phService.calculatePumpAction(currentPH);
    if (pumpAction && Math.random() > 0.95) {
      // 5% chance each update
      phService.logPumpActivity(pumpAction);

      // Also write to Firebase
      dbService.writePumpActivity(pumpAction, "1%");
    }

    // Write to Firebase
    dbService.writePHReading(currentPH);

    updateAllUI();
  }, 5000); // Update every 5 seconds
}

// Start the application
init();
