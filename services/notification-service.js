/**
 * Notification Service
 * Simple client-side notification manager using localStorage
 * Allows adding alerts, retrieving unread count, and marking as read.
 * Notifications are not push-based; they're stored in localStorage for demo purposes.
 */

export class NotificationService {
  constructor() {
    this.STORAGE_KEY = "ecoNotifications";
  }

  /**
   * Return entire notification list (most recent first)
   */
  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("❌ Failed to parse notifications from storage", e);
      return [];
    }
  }

  /**
   * Add a new notification object ({title, body, timestamp})
   */
  add(notification) {
    const list = this.getAll();
    const now = Date.now();
    const n = {
      id: notification.id || now,
      title: notification.title || "Notification",
      body: notification.body || "",
      timestamp: notification.timestamp || now,
      read: notification.read || false,
    };
    list.unshift(n); // newest at front
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  /**
   * Return number of unread notifications
   */
  getUnreadCount() {
    return this.getAll().filter((n) => !n.read).length;
  }

  /**
   * Mark a single notification as read
   */
  markRead(id) {
    const list = this.getAll();
    const updated = list.map((n) => {
      if (n.id === id) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Mark all notifications as read
   */
  markAllRead() {
    const list = this.getAll().map((n) => ({ ...n, read: true }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }
}

// singleton export
export const notificationService = new NotificationService();
