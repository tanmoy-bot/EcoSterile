/**
 * Notification System - Toast/Banner notifications
 * No alert() popups - professional, smooth UI notifications
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.initContainer();
  }

  initContainer() {
    // Create notification container if it doesn't exist
    if (!document.getElementById("notification-container")) {
      const container = document.createElement("div");
      container.id = "notification-container";
      document.body.appendChild(container);
    }
    this.container = document.getElementById("notification-container");
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Auto-dismiss duration in ms (0 = manual dismiss)
   */
  show(message, type = "info", duration = 4000) {
    const notification = document.createElement("div");
    const id = `notif-${Date.now()}`;
    notification.id = id;
    notification.className = `notification notification-${type} notification-enter`;

    // Icon mapping
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icons[type]}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">&times;</button>
      </div>
    `;

    // Close button handler
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        this.dismiss(id);
      });

    this.container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.remove("notification-enter");
      notification.classList.add("notification-visible");
    });

    // Auto-dismiss
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);

      // Store for manual control
      notification.dataset.timeoutId = timeoutId;
    }

    this.notifications.push({ id, element: notification });
  }

  dismiss(id) {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) return;

    const element = notif.element;
    element.classList.remove("notification-visible");
    element.classList.add("notification-exit");

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.notifications = this.notifications.filter((n) => n.id !== id);
    }, 300);

    // Clear timeout if exists
    if (element.dataset.timeoutId) {
      clearTimeout(parseInt(element.dataset.timeoutId));
    }
  }

  // Convenience methods
  success(message, duration = 3000) {
    this.show(message, "success", duration);
  }

  error(message, duration = 5000) {
    this.show(message, "error", duration);
  }

  warning(message, duration = 4000) {
    this.show(message, "warning", duration);
  }

  info(message, duration = 3000) {
    this.show(message, "info", duration);
  }

  dismissAll() {
    const ids = [...this.notifications].map((n) => n.id);
    ids.forEach((id) => this.dismiss(id));
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
