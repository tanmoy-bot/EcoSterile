/**
 * Contact Modal Component
 * Displays a dismissible contact information modal on dashboard
 * Shows every time user signs in
 */

export class ContactModalComponent {
  constructor(containerId = "contactModal") {
    this.containerId = containerId;
    this.isOpen = false;
    this.emailAddress = "ar.tanmoy.2011@gmail.com";
  }

  /**
   * Initialize modal HTML and styles
   */
  async init() {
    // Create modal container if it doesn't exist
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      document.body.appendChild(container);
    }

    // Inject modal HTML
    this.render();

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Render modal HTML
   */
  render() {
    const container = document.getElementById(this.containerId);
    container.innerHTML = `
      <style>
        #contactModal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        #contactModal.open {
          display: flex;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .contact-modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
          position: relative;
        }

        .contact-modal-header {
          padding: 32px 24px 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 16px 16px 0 0;
          position: relative;
        }

        .contact-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.2s ease;
        }

        .contact-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .contact-modal-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .contact-modal-header p {
          margin: 0;
          opacity: 0.95;
          font-size: 14px;
        }

        .contact-modal-body {
          padding: 32px 24px;
        }

        .contact-section {
          margin-bottom: 24px;
        }

        .contact-section:last-child {
          margin-bottom: 0;
        }

        .contact-section h3 {
          color: #059669;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .contact-section p {
          margin: 0 0 8px 0;
          color: #4b5563;
          line-height: 1.6;
          font-size: 14px;
        }

        .contact-section p:last-child {
          margin-bottom: 0;
        }

        .contact-email-link {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .contact-email-link:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .contact-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 20px 0;
        }

        .contact-modal-footer {
          padding: 16px 24px 24px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }

        .contact-modal-footer button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .contact-modal-footer button:hover {
          background: #e5e7eb;
          border-color: #10b981;
          color: #10b981;
        }

        @media (max-width: 600px) {
          .contact-modal-content {
            width: 95%;
          }

          .contact-modal-header {
            padding: 24px 16px 16px;
          }

          .contact-modal-body {
            padding: 24px 16px;
          }

          .contact-modal-header h2 {
            font-size: 20px;
          }

          .contact-modal-close {
            width: 28px;
            height: 28px;
            font-size: 18px;
          }
        }
      </style>

      <div class="contact-modal-content" id="contactModalContent">
        <div class="contact-modal-header">
          <button class="contact-modal-close" id="contactModalClose" title="Close">×</button>
          <h2>📧 Need Help?</h2>
          <p>We're here to support you</p>
        </div>

        <div class="contact-modal-body">
          <div class="contact-section">
            <h3>🐛 Found a Bug?</h3>
            <p>Help us improve EcoSterile by reporting any issues you encounter. Your feedback is invaluable to us!</p>
            <p>Report at <a href="mailto:ar.tanmoy.2011@gmail.com?subject=Bug%20Report%20-%20EcoSterile&body=Please%20describe%20the%20bug%20you%20encountered%3A%0A%0A" style="color: #10b981; font-weight: 500;">ar.tanmoy.2011@gmail.com</a></p>
          </div>

          <div class="contact-divider"></div>

          <div class="contact-section">
            <h3>💬 Questions or Feedback?</h3>
            <p>Have suggestions to make EcoSterile better? We'd love to hear from you!</p>
            <p>Send feedback at <a href="mailto:ar.tanmoy.2011@gmail.com?subject=Feedback%20-%20EcoSterile&body=Please%20share%20your%20feedback%3A%0A%0A" style="color: #10b981; font-weight: 500;">ar.tanmoy.2011@gmail.com</a></p>
          </div>

          <div class="contact-divider"></div>

          <div class="contact-section">
            <h3>📋 Privacy & Legal</h3>
            <p>Learn about how we protect your data and our terms of service:</p>
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
              <a href="../auth/privacy-policy.html" target="_blank" class="contact-email-link" style="background: #3b82f6;">
                🔒 Privacy Policy
              </a>
              <a href="../auth/terms-conditions.html" target="_blank" class="contact-email-link" style="background: #f97316;">
                ⚖️ Terms & Conditions
              </a>
            </div>
          </div>

          <div class="contact-divider"></div>

          <div class="contact-section">
            <h3>📞 Direct Contact</h3>
            <p><strong>Email:</strong> <a href="mailto:ar.tanmoy.2011@gmail.com" style="color: #10b981; text-decoration: none; font-weight: 500;">ar.tanmoy.2011@gmail.com</a></p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
              ⏱️ We typically respond within 24 hours
            </p>
          </div>
        </div>

        <div class="contact-modal-footer">
          <button id="contactModalDismiss">Got it, thanks!</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to modal elements
   */
  attachEventListeners() {
    const closeBtn = document.getElementById("contactModalClose");
    const dismissBtn = document.getElementById("contactModalDismiss");
    const modal = document.getElementById(this.containerId);

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => this.close());
    }

    // Close modal when clicking outside of content
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }
  }

  /**
   * Open modal
   */
  open() {
    const modal = document.getElementById(this.containerId);
    if (modal) {
      modal.classList.add("open");
      this.isOpen = true;
      console.log("📧 Contact modal opened");
    }
  }

  /**
   * Close modal
   */
  close() {
    const modal = document.getElementById(this.containerId);
    if (modal) {
      modal.classList.remove("open");
      this.isOpen = false;
      console.log("📧 Contact modal closed");
    }
  }

  /**
   * Toggle modal visibility
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Show modal (alias for open)
   */
  show() {
    this.open();
  }

  /**
   * Hide modal (alias for close)
   */
  hide() {
    this.close();
  }
}
