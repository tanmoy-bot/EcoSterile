/**
 * Contact/Email Service
 * Handles user inquiries and contact submissions
 * Uses EmailJS to send emails to ar.tanmoy.2011@gmail.com
 */

// EmailJS Configuration
// Note: Initialize with your EmailJS public key
const CONTACT_EMAIL = "ar.tanmoy.2011@gmail.com";
const EMAILJS_SERVICE_ID = "service_ecosterile"; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = "template_contact"; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY"; // Replace with your public key

export class ContactService {
  /**
   * Initialize EmailJS
   * Call this once when the page loads
   */
  static async initializeEmailJS() {
    try {
      // Load EmailJS library dynamically
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
      document.head.appendChild(script);

      script.onload = () => {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        console.log("✅ EmailJS initialized successfully");
      };

      script.onerror = () => {
        console.error("❌ Failed to load EmailJS library");
      };
    } catch (error) {
      console.error("❌ EmailJS initialization error:", error);
    }
  }

  /**
   * Send a contact query via email
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} subject - Subject of the query
   * @param {string} message - The actual message/query
   * @param {string} userType - "user" or "visitor"
   * @returns {Promise<boolean>} True if sent successfully
   */
  static async sendContactQuery(
    name,
    email,
    subject,
    message,
    userType = "visitor",
  ) {
    try {
      // Validate inputs
      if (!name || !email || !subject || !message) {
        throw new Error("All fields are required");
      }

      if (!this.validateEmail(email)) {
        throw new Error("Invalid email address");
      }

      if (message.length > 2000) {
        throw new Error("Message too long (max 2000 characters)");
      }

      // Prepare email data
      const emailData = {
        from_name: name,
        from_email: email,
        to_email: CONTACT_EMAIL,
        subject: subject,
        message: message,
        user_type: userType,
        timestamp: new Date().toISOString(),
      };

      // Send via EmailJS
      const response = await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailData,
      );

      if (response.status === 200) {
        console.log("✅ Email sent successfully:", response);
        return true;
      } else {
        console.error("❌ Email sending failed:", response);
        return false;
      }
    } catch (error) {
      console.error("❌ Contact query error:", error.message);
      throw error;
    }
  }

  /**
   * Send a bug report via email
   * @param {string} bugDescription - Description of the bug
   * @param {string} userEmail - Reporter's email
   * @param {string} userName - Reporter's name (optional)
   * @param {Object} systemInfo - Optional system information
   * @returns {Promise<boolean>}
   */
  static async sendBugReport(
    bugDescription,
    userEmail,
    userName = "User",
    systemInfo = {},
  ) {
    try {
      const bugReport = `
BUG REPORT
═══════════════════════════════════════════════════
Reporter: ${userName}
Email: ${userEmail}
Date: ${new Date().toLocaleString()}

Description:
${bugDescription}

System Information:
- Browser: ${navigator.userAgent.split(" ").pop()}
- Platform: ${navigator.platform}
- URL: ${window.location.href}
- Additional Info: ${JSON.stringify(systemInfo)}
═══════════════════════════════════════════════════
      `;

      return await this.sendContactQuery(
        userName,
        userEmail,
        "[BUG REPORT] EcoSterile Issue",
        bugReport,
        "user",
      );
    } catch (error) {
      console.error("❌ Bug report sending error:", error);
      throw error;
    }
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Alternative method: Send via Firebase Cloud Functions
   * (if EmailJS is not available)
   * @param {Object} contactData
   * @returns {Promise<boolean>}
   */
  static async sendViaCloudFunction(contactData) {
    try {
      const response = await fetch(
        "https://us-central1-eco-sterile.cloudfunctions.net/sendContactEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...contactData,
            to: CONTACT_EMAIL,
            timestamp: Date.now(),
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Email sent via Cloud Function:", result);
        return true;
      } else {
        console.error("❌ Cloud Function error:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("❌ Cloud Function sending error:", error);
      throw error;
    }
  }
}

// Initialize when module loads
document.addEventListener("DOMContentLoaded", () => {
  ContactService.initializeEmailJS();
});
