/**
 * Pump Activity Log Component
 * Displays real-time pump activity in a timeline format
 */

export class PumpLogComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.logs = [];
  }

  /**
   * Render pump logs as timeline
   */
  render(logs = []) {
    this.logs = logs;

    if (logs.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>🔍 No pump activity yet</p>
          <p class="text-tertiary">Pump activity will appear here when your system needs to adjust pH</p>
        </div>
      `;
      return;
    }

    // Show only last 10 entries (already in descending order from Firebase)
    const recentLogs = logs.slice(0, 10);

    const logHTML = recentLogs
      .map((log, index) => {
        const timestamp = new Date(log.timestamp);
        const timeAgo = this.getTimeAgo(timestamp);
        const pumpEmoji = log.type === "basic" ? "💧" : "⚗️";
        const pumpLabel = log.type === "basic" ? "Basic Pump" : "Acidic Pump";
        const pumpColor =
          log.type === "basic" ? "var(--info-color)" : "var(--danger-color)";

        return `
        <div class="log-item">
          <div class="log-timeline">
            <div class="log-dot" style="background-color: ${pumpColor};">
              ${pumpEmoji}
            </div>
            ${
              index < recentLogs.length - 1
                ? '<div class="log-line"></div>'
                : ""
            }
          </div>
          <div class="log-content">
            <div class="log-header">
              <h4 class="log-title">${pumpLabel}</h4>
              <span class="log-time">${timeAgo}</span>
            </div>
            <div class="log-meta">
              <span>Solution: ${log.solution || "Standard"}</span>
              <span>Concentration: ${log.concentration || "1%"}</span>
            </div>
            <p class="log-timestamp">${timestamp.toLocaleString()}</p>
          </div>
        </div>
      `;
      })
      .join("");

    this.container.innerHTML = `
      <div class="log-timeline-container">
        ${logHTML}
      </div>
    `;
  }

  /**
   * Calculate time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  /**
   * Add new log entry
   */
  addLog(logEntry) {
    this.logs.push(logEntry);
    this.render(this.logs);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.render([]);
  }
}
