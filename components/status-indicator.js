/**
 * Status Indicator Component
 * Shows Arduino connection, system status, and real-time indicators
 */

export class StatusIndicatorComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(status = {}) {
    const {
      arduinoConnected = false,
      systemOnline = true,
      lastUpdate = new Date(),
      pumpStatus = "idle",
    } = status;

    const pumpEmoji =
      pumpStatus === "basic" ? "💧" : pumpStatus === "acidic" ? "⚗️" : "🔵";
    const pumpText =
      pumpStatus === "basic"
        ? "Basic Pump"
        : pumpStatus === "acidic"
        ? "Acidic Pump"
        : "Idle";

    this.container.innerHTML = `
      <div class="status-grid">
        <!-- Arduino Status -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">Arduino</span>
            <span class="status-badge ${
              arduinoConnected ? "badge-success" : "badge-danger"
            }">
              ${arduinoConnected ? "🟢 Connected" : "🔴 Demo Mode"}
            </span>
          </div>
          <div class="status-info">
            <p class="text-secondary">${
              arduinoConnected ? "Live data stream" : "Using simulation data"
            }</p>
            <button id="connectArduinoBtn" class="btn btn-arduino ${
              arduinoConnected
                ? "btn-arduino-connected"
                : "btn-arduino-disconnected"
            }" style="margin-top: var(--space-2); width: 100%; font-size: 0.9rem; font-weight: 600;">
              <span class="arduino-icon">${arduinoConnected ? "✓" : "⚡"}</span>
              ${arduinoConnected ? "Disconnect Arduino" : "Connect Arduino"}
            </button>
          </div>
        </div>

        <!-- System Status -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">System</span>
            <span class="status-badge ${
              systemOnline ? "badge-success" : "badge-danger"
            }">
              ${systemOnline ? "🟢 Online" : "🔴 Offline"}
            </span>
          </div>
          <div class="status-info">
            <p class="text-secondary">Last update: ${this.formatTime(
              lastUpdate
            )}</p>
          </div>
        </div>

        <!-- Pump Status -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">Pump Status</span>
            <span class="status-badge">
              ${pumpEmoji} ${pumpText}
            </span>
          </div>
          <div class="status-info">
            <p class="text-secondary">${
              pumpStatus === "idle" ? "Standby mode" : "Active"
            }</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format timestamp
   */
  formatTime(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  /**
   * Update status indicator
   */
  update(status) {
    this.render(status);
  }
}
