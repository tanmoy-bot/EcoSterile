/**
 * Chatbot Logging Service
 * Handles storage of chatbot questions and answers in Firebase
 * Secure database structure with user isolation
 */

import {
  getDatabase,
  ref,
  set,
  push,
  query,
  orderByChild,
  limitToLast,
  onValue,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

export class ChatbotLoggingService {
  constructor(db, userId) {
    this.db = db;
    this.userId = userId;
  }

  /**
   * Log a chatbot interaction to Firebase
   * Stores both question and answer with timestamp
   *
   * @param {string} question - The user's question
   * @param {string} answer - The bot's response
   * @returns {Promise<string>} The log ID if successful
   */
  async logInteraction(question, answer) {
    try {
      // Validate inputs
      if (!question || question.trim().length === 0) {
        console.warn("Cannot log empty question");
        return null;
      }

      if (question.length > 2000) {
        console.warn("Question exceeds maximum length (2000 characters)");
        return null;
      }

      // Create log entry
      const logEntry = {
        question: question.trim(),
        answer: answer ? answer.trim() : "",
        timestamp: Date.now(),
        source: "assistant",
      };

      // Reference: chatbotLogs/{userId}/{logId}
      const logsRef = ref(this.db, `chatbotLogs/${this.userId}`);
      const newLogRef = push(logsRef);

      // Write to database
      await set(newLogRef, logEntry);

      console.log("✅ Chatbot interaction logged:", {
        logId: newLogRef.key,
        userId: this.userId,
        timestamp: new Date(logEntry.timestamp).toISOString(),
      });

      return newLogRef.key;
    } catch (error) {
      console.error("❌ Error logging chatbot interaction:", error);
      // Don't throw - silently fail to avoid disrupting chat experience
      return null;
    }
  }

  /**
   * Get user's chat history (last N interactions)
   *
   * @param {number} limit - Number of recent interactions to fetch
   * @returns {Promise<Array>} Array of chatbot logs
   */
  async getChatHistory(limit = 50) {
    try {
      const historyRef = query(
        ref(this.db, `chatbotLogs/${this.userId}`),
        orderByChild("timestamp"),
        limitToLast(limit),
      );

      return new Promise((resolve, reject) => {
        onValue(
          historyRef,
          (snapshot) => {
            const logs = [];
            snapshot.forEach((childSnapshot) => {
              logs.push({
                id: childSnapshot.key,
                ...childSnapshot.val(),
              });
            });
            resolve(logs.reverse()); // Most recent first
          },
          (error) => {
            console.error("Error fetching chat history:", error);
            reject(error);
          },
        );
      });
    } catch (error) {
      console.error("❌ Error retrieving chat history:", error);
      return [];
    }
  }

  /**
   * Delete a specific log entry
   * (For privacy - user can delete their own logs)
   *
   * @param {string} logId
   * @returns {Promise<boolean>}
   */
  async deleteLogEntry(logId) {
    try {
      const logRef = ref(this.db, `chatbotLogs/${this.userId}/${logId}`);
      await set(logRef, null); // Firebase delete

      console.log("✅ Log entry deleted:", logId);
      return true;
    } catch (error) {
      console.error("❌ Error deleting log entry:", error);
      return false;
    }
  }

  /**
   * Get statistics about user's questions
   * (For analytics - used by admin)
   *
   * @returns {Promise<Object>} Statistics object
   */
  async getInteractionStats() {
    try {
      const history = await this.getChatHistory(1000);

      const stats = {
        totalInteractions: history.length,
        firstQuestion: history.length > 0 ? history[0].timestamp : null,
        lastQuestion:
          history.length > 0 ? history[history.length - 1].timestamp : null,
        averageQuestionLength:
          history.length > 0
            ? history.reduce((sum, log) => sum + log.question.length, 0) /
              history.length
            : 0,
      };

      return stats;
    } catch (error) {
      console.error("❌ Error getting stats:", error);
      return null;
    }
  }

  /**
   * Clear all user's logs (for privacy/GDPR)
   * WARNING: This is irreversible
   *
   * @returns {Promise<boolean>}
   */
  async clearAllLogs() {
    try {
      const logsRef = ref(this.db, `chatbotLogs/${this.userId}`);
      await set(logsRef, null);

      console.log("✅ All logs cleared for user:", this.userId);
      return true;
    } catch (error) {
      console.error("❌ Error clearing logs:", error);
      return false;
    }
  }
}

/**
 * Admin version of logging service
 * Allows viewing all users' logs (admin-only)
 */
export class ChatbotAdminLoggingService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all chatbot logs across all users
   * ADMIN ONLY - requires authentication check
   *
   * @returns {Promise<Array>}
   */
  async getAllLogs(limit = 1000) {
    try {
      const allLogsRef = query(
        ref(this.db, "chatbotLogs"),
        orderByChild("timestamp"),
        limitToLast(limit),
      );

      return new Promise((resolve, reject) => {
        onValue(
          allLogsRef,
          (snapshot) => {
            const logs = [];
            snapshot.forEach((userSnapshot) => {
              userSnapshot.forEach((logSnapshot) => {
                logs.push({
                  userId: userSnapshot.key,
                  logId: logSnapshot.key,
                  ...logSnapshot.val(),
                });
              });
            });
            resolve(logs.reverse());
          },
          (error) => {
            console.error("Error fetching all logs:", error);
            reject(error);
          },
        );
      });
    } catch (error) {
      console.error("❌ Error retrieving all logs:", error);
      return [];
    }
  }

  /**
   * Get logs for a specific user (admin access)
   *
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserLogs(userId) {
    try {
      const userLogsRef = query(
        ref(this.db, `chatbotLogs/${userId}`),
        orderByChild("timestamp"),
        limitToLast(500),
      );

      return new Promise((resolve, reject) => {
        onValue(
          userLogsRef,
          (snapshot) => {
            const logs = [];
            snapshot.forEach((logSnapshot) => {
              logs.push({
                logId: logSnapshot.key,
                ...logSnapshot.val(),
              });
            });
            resolve(logs.reverse());
          },
          (error) => reject(error),
        );
      });
    } catch (error) {
      console.error("❌ Error retrieving user logs:", error);
      return [];
    }
  }

  /**
   * Get popular questions across all users
   * (For improvement analysis)
   *
   * @returns {Promise<Object>} Most common questions and their frequency
   */
  async getPopularQuestions(limit = 100) {
    try {
      const allLogs = await this.getAllLogs(limit);

      // Count question frequency
      const questionFrequency = {};
      allLogs.forEach((log) => {
        const q = log.question;
        questionFrequency[q] = (questionFrequency[q] || 0) + 1;
      });

      // Sort by frequency
      const sorted = Object.entries(questionFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20);

      return Object.fromEntries(sorted);
    } catch (error) {
      console.error("❌ Error getting popular questions:", error);
      return {};
    }
  }

  /**
   * Export logs as JSON (for analysis)
   *
   * @param {string} userId - Optional: specific user, null for all
   * @returns {Promise<string>} JSON string
   */
  async exportLogs(userId = null) {
    try {
      const logs = userId
        ? await this.getUserLogs(userId)
        : await this.getAllLogs();

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId || "all",
        totalLogs: logs.length,
        logs: logs,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("❌ Error exporting logs:", error);
      return null;
    }
  }
}
