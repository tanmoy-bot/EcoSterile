/**
 * Chatbot Component - INTELLIGENT WEBSITE-AWARE ASSISTANT
 *
 * Enhanced chatbot that understands dashboard state, system behavior, and provides
 * contextual answers beyond simple keyword matching.
 *
 * Architecture:
 * 1. Intent Detection: Categorizes user questions into specific intents
 * 2. Context Analysis: Pulls relevant state from appState (pH, crop, pumps, etc.)
 * 3. Response Generation: Generates context-aware, specific answers
 * 4. Fallback Handling: Gracefully handles unknown questions
 * 5. Topic Validation: Ensures answers are EcoSterile-related only
 */

export class ChatbotComponent {
  constructor(containerId = "chatbotContainer") {
    this.containerId = containerId;
    this.isOpen = false;
    this.messages = [];
    this.container = null;
    this.appState = null; // Will be injected by dashboard
    this.loggingService = null; // Will be injected with Firebase logging
    this.userId = null; // Will be set when user is authenticated

    // Intent patterns for intelligent routing
    this.intentPatterns = {
      // pH-related intents
      pH_FLUCTUATION: {
        keywords: [
          "fluctuat",
          "fluctuate",
          "variab",
          "unstable",
          "swing",
          "jump",
          "erratic",
          "inconsistent",
        ],
        context: ["pH", "level"],
      },
      pH_OUT_OF_RANGE: {
        keywords: [
          "out of range",
          "too acidic",
          "too basic",
          "high",
          "low",
          "critical",
        ],
        context: ["pH", "danger"],
      },
      pH_EXPLANATION: {
        keywords: ["why", "reason", "cause", "happen", "explain", "understand"],
        context: ["pH"],
      },

      // Pump-related intents
      PUMP_ACTIVATION: {
        keywords: [
          "pump",
          "activated",
          "running",
          "trigger",
          "why",
          "automatic",
        ],
        context: ["pump", "basic", "acidic"],
      },
      PUMP_LOG_VIEW: {
        keywords: ["pump", "log", "history", "activity", "timeline", "usage"],
        context: ["log"],
      },

      // Arduino/Hardware intents
      ARDUINO_CONNECTION: {
        keywords: [
          "arduino",
          "connect",
          "serial",
          "device",
          "data",
          "not",
          "connected",
        ],
        context: ["arduino", "device"],
      },
      DATA_ISSUE: {
        keywords: [
          "data",
          "nahi",
          "not",
          "coming",
          "receiving",
          "lag",
          "delay",
          "firebase",
        ],
        context: ["data", "issue"],
      },

      // Chart/UI intents
      CHART_DISPLAY: {
        keywords: [
          "chart",
          "graph",
          "display",
          "point",
          "show",
          "see",
          "kyu",
          "why",
        ],
        context: ["chart", "data"],
      },

      // Crop-related intents
      CROP_CHANGE_EFFECT: {
        keywords: [
          "crop",
          "change",
          "ph",
          "range",
          "effect",
          "impact",
          "affect",
        ],
        context: ["crop"],
      },
      CROP_SELECTION: {
        keywords: ["crop", "select", "choose", "change", "grow", "recommend"],
        context: ["crop"],
      },

      // System status intents
      SYSTEM_OFFLINE: {
        keywords: [
          "offline",
          "online",
          "system",
          "status",
          "internet",
          "connection",
        ],
        context: ["system", "status"],
      },
      SIMULATION_MODE: {
        keywords: ["simulat", "mode", "when", "activate", "fake", "real"],
        context: ["simulation", "data"],
      },

      // Weather/Location intents
      WEATHER: {
        keywords: [
          "weather",
          "temperature",
          "humidity",
          "wind",
          "forecast",
          "rainfall",
        ],
        context: ["weather"],
      },
      LOCATION: {
        keywords: ["location", "farm", "region", "place", "where"],
        context: ["location"],
      },

      // Settings intents
      SETTINGS_PROFILE: {
        keywords: ["profile", "setting", "name", "farm", "update", "change"],
        context: ["settings"],
      },

      // General help
      HELP_REQUEST: {
        keywords: ["help", "guide", "how", "where", "find", "tutorial"],
        context: ["help"],
      },

      // Classifier / image model
      CLASSIFIER: {
        keywords: ["classifier", "image", "classify", "edgeimpulse", "camera"],
        context: ["classifier"],
      },

      // Disease-specific queries
      DISEASE_QUERY: {
        keywords: ["angular", "leaf spot", "bean rust", "rust", "disease", "infected"],
        context: ["disease"],
      },

      // Troubleshooting
      TROUBLESHOOTING: {
        keywords: [
          "error",
          "problem",
          "issue",
          "broken",
          "fix",
          "wrong",
          "incorrect",
        ],
        context: ["troubleshoot"],
      },
    };

    // Predefined responses for common questions
    this.responses = {
      greetings: [
        "Hello! 👋 I'm your EcoSterile assistant. How can I help you today?",
        "Hi there! 🌾 Need help with crop selection, pH management, or farming tips?",
        "Welcome! 🚜 Ask me about crops, pH levels, watering, or how to use any dashboard features!",
      ],
      crop_selection: [
        "To select a crop, go to the 'Crop Type Selection' section and browse through the categories. You can filter by Cereals, Pulses, Vegetables, Fruits, Cash Crops, or Spices. Look at the recommended crops at the top - they're perfect for your region and season!",
        "The recommended crops section shows the best crops for your location and current season. If you want to explore more options, use the category tabs or search bar.",
        "To change your crop: 1) Go to 'Crop Type Selection' 2) Click on a crop card 3) Confirm the change in the modal 4) The system will update your optimal pH range automatically!",
      ],
      ph_management: [
        "pH management is crucial! The optimal range for most crops is 6.5-7.5. You can monitor real-time pH levels on your dashboard and use the pump system to maintain the ideal balance.",
        "If your pH is too high (alkaline), use the acidic pump. If it's too low (acidic), use the basic pump. The dashboard shows your pH trend in the graph below the monitoring panel.",
        "To view pH levels: Look at the 'Real-time pH Monitoring' section on your dashboard. You'll see your current pH value, status (🟢 Optimal/🟡 Caution/🔴 Critical), and a 24-hour trend graph.",
      ],
      watering: [
        "Different crops need different water amounts. The recommended crops section suggests crops suitable for your region's rainfall patterns. Always check the weather forecast on your dashboard!",
        "Regular monitoring helps you understand your crop's water needs. The pH levels can indicate water stress in some crops.",
      ],
      profile_settings: [
        "To update your profile: 1) Click on your profile icon in the header 2) Go to 'Settings' 3) Update your farm name, location, or other details 4) Save changes. Your recommendations will automatically adjust based on your location!",
        "To change your farm name: Go to Settings → Profile and edit the farm name field. This helps personalize your dashboard experience.",
        "To set your farm location: In Settings, update 'Farm Location'. This is important because it helps us recommend crops that grow best in your region!",
      ],
      weather: [
        "Your current weather is displayed at the top of the dashboard. You'll see temperature, humidity, wind speed, and your farm location. This helps you plan irrigation and crop activities!",
        "To check weather: Look at the Weather Card section which shows ☀️ current conditions, 🌡️ temperature, 💨 wind speed, and 💧 humidity.",
      ],
      pump_logs: [
        "The Pump Activity Timeline shows when your pumps have been used. You can see: ⏱️ timestamps, 🔧 which pump was used (basic or acidic), and 📊 the effect on pH. Scroll down to see the full history!",
        "To understand pump logs: Each entry shows when the pump ran and how much it adjusted your pH. This helps you track your farm's management history.",
      ],
      dashboard_navigation: [
        "Your dashboard has several sections: 1) Weather Card - shows current conditions 2) Real-time pH Monitoring - tracks pH levels 3) Pump Activity Timeline - shows pump usage 4) Crop Type Selection - choose your crops. Scroll down to see all!",
        "At the top you'll see the header with your farm info and settings. The main content area shows all your farm metrics in real-time. Use the scroll to explore all sections!",
      ],
      status_indicators: [
        "The Status Indicators show your system health: 🟢 Arduino Connected, System Status (Online/Offline), and Last Update time. This tells you if your monitoring system is working properly.",
        "Check status indicators to ensure your Arduino device is connected and your system is online. This is important for real-time monitoring!",
      ],
      account: [
        "To sign out: Click on your profile icon in the header and select 'Sign Out'. You'll be logged out of your EcoSterile account.",
        "To access account settings: Click on your profile name in the header to see options for settings, profile, and sign out.",
      ],
      general_help: [
        "I can help you with: 🌾 Crop selection, 📊 pH monitoring, 💧 Watering tips, 📱 Dashboard navigation, ⚙️ Settings, 📈 Reading charts, and more!",
        "The dashboard tracks your farm's health in real-time. You can monitor pH, track pump usage, and get crop recommendations all in one place!",
        "Not sure where to find something? Just ask me! I can guide you through any feature on the dashboard.",
      ],
    };
  }

  /**
   * Open the EdgeImpulse classifier in a new tab (with apiKey if present)
   */
  openClassifier() {
    const url = 'https://smartphone.edgeimpulse.com/classifier.html?apiKey=ei_c19a64056146e76a860ed8f13b222f25a68474dd111149e36822b8f99062cd0a';
    window.open(url, '_blank', 'noopener');
  }

  /**
   * Show the disease modal if present on the page (dashboard or index)
   */
  showDiseaseModal() {
    const m1 = document.getElementById('diseaseModal');
    const m2 = document.getElementById('diseaseModalDashboard');
    if (m2) { m2.style.display = 'flex'; window.scrollTo({top:0, behavior:'smooth'}); }
    else if (m1) { m1.style.display = 'flex'; window.scrollTo({top:0, behavior:'smooth'}); }
    else { this.addBotMessage('Disease modal not available on this page.'); }
  }

  /**
   * Initialize and render the chatbot
   */
  init() {
    // Create container if it doesn't exist
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      document.body.appendChild(container);
    }

    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render chatbot UI
   */
  render() {
    this.container.innerHTML = `
      <div class="chatbot-wrapper">
        <!-- Floating Chat Button -->
        <button class="chatbot-button" id="chatbotToggle" title="Open Assistant">
          💬
        </button>

        <!-- Chat Window -->
        <div class="chatbot-window ${
          this.isOpen ? "open" : ""
        }" id="chatbotWindow">
          <div class="chatbot-header">
            <h3>🤖 EcoSterile Assistant</h3>
            <button class="chatbot-close" id="chatbotClose">✕</button>
          </div>

          <div class="chatbot-messages" id="chatbotMessages">
            <!-- Messages will be rendered here -->
          </div>

          <div class="chatbot-input-area">
            <input 
              type="text" 
              id="chatbotInput" 
              class="chatbot-input" 
              placeholder="Ask me anything..."
              autocomplete="off"
            >
            <button class="chatbot-send" id="chatbotSend">Send</button>
          </div>
          <div style="display:flex; gap:8px; justify-content:center; padding:10px;">
            <button id="chatbotOpenClassifier" class="btn btn-secondary" title="Open image classifier">🔬 Open Classifier</button>
            <button id="chatbotOpenDisease" class="btn btn-secondary" title="Show disease advice">🌱 Disease Advice</button>
          </div>
        </div>
      </div>
    `;

    this.renderMessages();
  }

  /**
   * Render all messages in the chat
   */
  renderMessages() {
    const messagesContainer = document.getElementById("chatbotMessages");
    if (!messagesContainer) return;

    const messagesHTML = this.messages
      .map(
        (msg) => `
      <div class="chatbot-message ${msg.sender}">
        <div class="chatbot-message-content">
          ${this.escapeHtml(msg.text)}
        </div>
        <div class="chatbot-message-time">${msg.time}</div>
      </div>
    `,
      )
      .join("");

    messagesContainer.innerHTML = messagesHTML;

    // Auto-scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle chat window
    const toggleBtn = document.getElementById("chatbotToggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleChat());
    }

    // Close chat window
    const closeBtn = document.getElementById("chatbotClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeChat());
    }

    // Send message
    const sendBtn = document.getElementById("chatbotSend");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.sendMessage());
    }

    // Send on Enter key
    const input = document.getElementById("chatbotInput");
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage();
        }
      });
    }

    // Quick action buttons
    const openCls = document.getElementById('chatbotOpenClassifier');
    if(openCls) openCls.addEventListener('click', ()=> this.openClassifier());
    const openDis = document.getElementById('chatbotOpenDisease');
    if(openDis) openDis.addEventListener('click', ()=> this.showDiseaseModal());

    // Close chat when clicking outside
    document.addEventListener("click", (e) => {
      const chatbot = document.querySelector(".chatbot-wrapper");
      if (chatbot && !chatbot.contains(e.target) && this.isOpen) {
        this.closeChat();
      }
    });
  }

  /**
   * Toggle chat window open/closed
   */
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  /**
   * Open chat window
   */
  openChat() {
    this.isOpen = true;
    const window = document.getElementById("chatbotWindow");
    if (window) {
      window.classList.add("open");
    }

    // Show greeting if no messages
    if (this.messages.length === 0) {
      this.addBotMessage(this.getRandomResponse("greetings"));
    }

    // Focus input
    setTimeout(() => {
      const input = document.getElementById("chatbotInput");
      if (input) input.focus();
    }, 100);
  }

  /**
   * Close chat window
   */
  closeChat() {
    this.isOpen = false;
    const window = document.getElementById("chatbotWindow");
    if (window) {
      window.classList.remove("open");
    }
  }

  /**
   * Send user message
   */
  sendMessage() {
    const input = document.getElementById("chatbotInput");
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    this.addUserMessage(message);
    input.value = "";

    // Get bot response
    setTimeout(() => {
      const response = this.getBotResponse(message);
      this.addBotMessage(response);

      // Log interaction to Firebase (if logging service is available)
      if (this.loggingService && this.userId) {
        this.loggingService.logInteraction(message, response).catch((err) => {
          console.warn(
            "Failed to log chatbot interaction (non-critical):",
            err,
          );
        });
      }
    }, 500);
  }

  /**
   * Add user message to chat
   */
  addUserMessage(text) {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.messages.push({
      sender: "user",
      text: text,
      time: time,
    });

    this.renderMessages();
  }

  /**
   * Add bot message to chat
   */
  addBotMessage(text) {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.messages.push({
      sender: "bot",
      text: text,
      time: time,
    });

    this.renderMessages();
  }

  /**
   * INTELLIGENT INTENT DETECTION & CONTEXT-AWARE RESPONSE GENERATION
   *
   * This method analyzes user input at multiple levels:
   * 1. Detects specific intent from patterns and keywords
   * 2. Pulls context from appState (current dashboard state)
   * 3. Generates contextual, specific answers
   * 4. Falls back gracefully for unknown questions
   */
  getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Step 1: Detect user intent and extract context
    const detectedIntent = this.detectIntent(message);

    // Step 2: Generate context-aware response based on detected intent
    const response = this.generateContextualResponse(detectedIntent, message);

    // Normalize: ensure response is a concise, to-the-point string
    if (typeof response === 'string') {
      // Trim to first sentence for concise answers when long
      const firstSentence = response.split(/\n\n|\.\s/)[0];
      return firstSentence + (response.length > firstSentence.length ? ' — ask for more for details.' : '');
    }

    return response;
  }

  /**
   * INTENT DETECTION ENGINE
   * Analyzes message to determine user's actual question
   */
  detectIntent(message) {
    // Check for greetings first
    if (message.match(/^(hello|hi|hey|thanks|thank you|greetings|salaam)/i)) {
      return { type: "GREETING", confidence: 1.0 };
    }

    // Direct creator/author question -> always respond with project authors
    if (
      message.match(/who (created|made|built) (you|this|the bot)|who (is|are) (your )?creator|who built (you|this)/i)
    ) {
      return { type: "CREATORS", confidence: 1.0 };
    }

    // Try to match against defined intent patterns
    for (const [intentType, pattern] of Object.entries(this.intentPatterns)) {
      const keywordMatches = pattern.keywords.filter((kw) =>
        message.includes(kw.toLowerCase()),
      );

      if (keywordMatches.length > 0) {
        // Calculate confidence based on keyword matches
        const confidence = Math.min(keywordMatches.length * 0.3, 0.9);
        return {
          type: intentType,
          confidence: confidence,
          keywords: keywordMatches,
        };
      }
    }

    // If no specific intent matched, try generic categorization
    if (message.match(/(help|guide|how|where|find|tutorial|navigate)/i)) {
      return { type: "HELP_REQUEST", confidence: 0.5 };
    }

    return { type: "UNKNOWN", confidence: 0.0 };
  }

  /**
   * CONTEXTUAL RESPONSE GENERATOR
   * Generates specific answers based on intent and current system state
   */
  generateContextualResponse(intent, userMessage) {
    const message = userMessage.toLowerCase();

    switch (intent.type) {
      case "GREETING":
        return this.getRandomResponse("greetings");

      case "pH_FLUCTUATION":
        return this.handlePHFluctuation();

      case "pH_OUT_OF_RANGE":
        return this.handlePHOutOfRange();

      case "pH_EXPLANATION":
        return this.handlePHExplanation();

      case "PUMP_ACTIVATION":
        return this.handlePumpActivation();

      case "PUMP_LOG_VIEW":
        return this.handlePumpLogView();

      case "ARDUINO_CONNECTION":
        return this.handleArduinoConnection();

      case "DATA_ISSUE":
        return this.handleDataIssue();

      case "CHART_DISPLAY":
        return this.handleChartDisplay();

      case "CROP_CHANGE_EFFECT":
        return this.handleCropChangeEffect();

      case "CROP_SELECTION":
        return this.getRandomResponse("crop_selection");

      case "SYSTEM_OFFLINE":
        return this.handleSystemStatus();

      case "SIMULATION_MODE":
        return this.handleSimulationMode();

      case "WEATHER":
        return this.getRandomResponse("weather");

      case "LOCATION":
        return this.handleLocationInfo();

      case "SETTINGS_PROFILE":
        return this.getRandomResponse("profile_settings");

      case "TROUBLESHOOTING":
        return this.handleTroubleshooting(message);

      case "HELP_REQUEST":
        return this.handleHelpRequest(message);

      case "CLASSIFIER":
        return "Open the EdgeImpulse image classifier (it uses your camera or file upload). Click 'Open Classifier' in the assistant or dashboard to start.";

      case "DISEASE_QUERY":
        // Detect specific disease keywords
        if (message.includes('angular') || message.includes('leaf spot')) {
          return this.getDiseaseSummary('angular');
        }
        if (message.includes('bean') && message.includes('rust')) {
          return this.getDiseaseSummary('beanrust');
        }
        return "Tell me which disease you see (Angular Leaf Spot, Bean Rust, or Healthy) and I'll give prevention and treatment advice.";

      case "CREATORS":
        return "Tanmoy Kanoo, Angshswarup Biswas, Ayushman Choudhury";

      case "UNKNOWN":
      default:
        return this.handleUnknownQuestion();
    }
  }

  /**
   * CONTEXTUAL HANDLER: pH Fluctuation
   * Explains why pH might be fluctuating based on current state
   */
  handlePHFluctuation() {
    if (!this.appState) {
      return "pH fluctuation can happen due to several reasons:\n\n1. Frequent pH additions (basic or acidic pump runs)\n2. Water quality variations\n3. Plant nutrient absorption\n4. Temperature changes affecting pH\n5. Sensor calibration drift\n\nCheck your Pump Activity Timeline to see recent pump runs that may have caused the changes.";
    }

    const { phReadings, pumpLogs, currentCrop } = this.appState;
    let response = "Your pH is fluctuating. Here are the likely reasons:\n\n";

    // Analyze pump activity
    if (pumpLogs && pumpLogs.length > 0) {
      const recentLogs = pumpLogs.slice(-5);
      const basicCount = recentLogs.filter((l) => l.type === "basic").length;
      const acidicCount = recentLogs.filter((l) => l.type === "acidic").length;

      if (basicCount > 0 || acidicCount > 0) {
        response += `📌 Recent pump activity detected:\n   - Basic pump used ${basicCount} times\n   - Acidic pump used ${acidicCount} times\n\n`;
        response +=
          "This is normal! Pumps adjust pH up/down, which can cause fluctuation.\n\n";
      }
    }

    // Analyze pH volatility
    if (phReadings && phReadings.length > 2) {
      const recent = phReadings.slice(-10).map((r) => parseFloat(r.value));
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const minVal = Math.min(...recent);
      const maxVal = Math.max(...recent);
      const range = maxVal - minVal;

      if (range > 0.5) {
        response += `📊 pH Range in last readings: ${minVal.toFixed(
          1,
        )} - ${maxVal.toFixed(1)} (variation: ${range.toFixed(2)})\n\n`;
      }
    }

    response += "✅ What you can do:\n";
    response +=
      "1. Check Pump Activity Timeline - see if pumps are running too frequently\n";
    response += "2. Wait 2-3 hours for readings to stabilize\n";
    response += "3. Verify pH sensor is calibrated correctly\n";
    response +=
      "4. If fluctuation persists, it might indicate the sensor needs maintenance\n";

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: pH Out of Range
   * Explains what action is needed based on current state
   */
  handlePHOutOfRange() {
    if (!this.appState) {
      return "Your pH appears to be out of the optimal range. Here's what you can do:\n\n1. If pH is too acidic (below range): Use the Basic pump to increase pH\n2. If pH is too basic (above range): Use the acidic pump to decrease pH\n3. Recheck pH after 10-15 minutes\n4. If issue persists, verify your crop's pH requirements";
    }

    const { phReadings, optimalPHMin, optimalPHMax, currentCrop } =
      this.appState;
    let response = "Your pH is outside the optimal range. ";

    if (phReadings && phReadings.length > 0) {
      const currentPH = parseFloat(phReadings[phReadings.length - 1].value);
      const min = optimalPHMin || 6.5;
      const max = optimalPHMax || 7.5;

      response += `Current: ${currentPH.toFixed(
        1,
      )}, Optimal: ${min} - ${max}\n\n`;

      if (currentPH < min) {
        response += `🔴 TOO ACIDIC:\n`;
        response += `- pH ${currentPH.toFixed(
          1,
        )} is below your crop's optimal range\n`;
        response += `- Activate the Basic pump to increase pH\n`;
        response += `- Target: increase pH to ${min}\n`;
      } else if (currentPH > max) {
        response += `🔵 TOO BASIC:\n`;
        response += `- pH ${currentPH.toFixed(
          1,
        )} is above your crop's optimal range\n`;
        response += `- Activate the Acidic pump to decrease pH\n`;
        response += `- Target: decrease pH to ${max}\n`;
      }

      if (currentCrop) {
        response += `\n📌 Current crop: ${currentCrop.label}\n`;
        response += `- Optimal range for this crop: ${currentCrop.minPH} - ${currentCrop.maxPH}\n`;
      }

      response += `\n✅ Steps:\n1. Activate appropriate pump\n2. Wait 10-15 minutes\n3. Check pH again\n4. If still out of range, run pump again`;
    }

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: pH Explanation
   * Explains why pH is at current level
   */
  handlePHExplanation() {
    if (!this.appState) {
      return "pH (potential of Hydrogen) measures how acidic or basic your soil/water is, on a scale of 0-14:\n\n- 0-6.9: Acidic (sour)\n- 7.0: Neutral\n- 7.1-14: Basic/Alkaline (sweet)\n\nMost crops prefer slightly acidic to neutral soil (6.0-7.5).\n\nYour system monitors pH constantly and uses:\n- Basic pump: Increases pH (makes less acidic)\n- Acidic pump: Decreases pH (makes more acidic)";
    }

    const { phReadings, currentCrop, optimalPHMin, optimalPHMax } =
      this.appState;
    let response = "Here's what's happening with your pH:\n\n";

    if (phReadings && phReadings.length > 0) {
      const current = parseFloat(phReadings[phReadings.length - 1].value);
      const avg =
        phReadings
          .slice(-24) // Last 24 readings
          .reduce((sum, r) => sum + parseFloat(r.value), 0) /
        Math.min(24, phReadings.length);

      response += `📊 Current Status:\n`;
      response += `- Current pH: ${current.toFixed(1)}\n`;
      response += `- 24-reading average: ${avg.toFixed(1)}\n`;

      if (currentCrop) {
        response += `- Crop: ${currentCrop.label} (optimal: ${currentCrop.minPH}-${currentCrop.maxPH})\n`;
        response += `- Your crop needs slightly acidic to neutral pH\n`;
      }

      response += `\n🔍 Understanding the scale:\n`;
      response += `- Below 6.0: Very acidic (nutrients can lock up)\n`;
      response += `- 6.0-7.0: Slightly acidic (ideal for most crops)\n`;
      response += `- 7.0-8.0: Neutral to basic (good for some crops)\n`;
      response += `- Above 8.0: Very basic (some nutrients become unavailable)\n`;

      response += `\n✅ Your system automatically monitors and adjusts pH to keep it in the optimal range for your crop.`;
    }

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Pump Activation
   * Explains why pump activated automatically
   */
  handlePumpActivation() {
    if (!this.appState) {
      return "Pumps activate automatically when pH goes out of range:\n\n- Basic pump: Activates when pH is too acidic (below optimal range)\n- Acidic pump: Activates when pH is too basic (above optimal range)\n\nThis is normal behavior! The system is protecting your crop.";
    }

    const { phReadings, pumpLogs, optimalPHMin, optimalPHMax, currentCrop } =
      this.appState;
    let response = "Your pump activated automatically because:\n\n";

    if (pumpLogs && pumpLogs.length > 0) {
      const latest = pumpLogs[pumpLogs.length - 1];
      const time = new Date(latest.timestamp).toLocaleTimeString();

      response += `📌 Latest pump activation: ${time}\n`;
      response += `- Type: ${
        latest.type === "basic" ? "Basic" : "Acidic"
      } pump\n`;
      response += `- pH before: ${latest.phBefore?.toFixed(1) || "Unknown"}\n`;
      response += `- pH after: ${latest.phAfter?.toFixed(1) || "Unknown"}\n\n`;

      if (latest.type === "basic") {
        response += `The pH was too low (acidic). Basic pump added alkaline solution to raise pH.\n`;
      } else {
        response += `The pH was too high (basic). Acidic pump added acidic solution to lower pH.\n`;
      }
    }

    response += `\n✅ This is the system working correctly!\n`;
    response += `- Your crop needs pH between ${optimalPHMin} - ${optimalPHMax}\n`;
    if (currentCrop) {
      response += `- Current crop (${currentCrop.label}) thrives at this pH range\n`;
    }
    response += `- Pumps activate automatically to maintain optimal conditions\n`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Pump Log View
   * Guides user to view pump history and explains it
   */
  handlePumpLogView() {
    if (!this.appState) {
      return "Pump logs show the history of all pump activations:\n\n📊 To view pump logs:\n1. Scroll down on your dashboard\n2. Find 'Pump Activity Timeline' section\n3. You'll see timestamps, pump type (basic/acidic), and pH changes\n\nEach entry shows when the pump ran and how it affected your pH.";
    }

    const { pumpLogs } = this.appState;
    let response = "Pump Activity Timeline shows your pump history:\n\n";

    if (pumpLogs && pumpLogs.length > 0) {
      response += `📊 You have ${pumpLogs.length} pump activations recorded.\n\n`;

      const recent = pumpLogs.slice(-5);
      response += `Recent pump activity:\n`;
      recent.forEach((log, idx) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const type = log.type === "basic" ? "Basic" : "Acidic";
        response += `${idx + 1}. ${time} - ${type} pump\n`;
      });

      response += `\n✅ What each column means:\n`;
      response += `- Time: When the pump activated\n`;
      response += `- Pump: Type (Basic or Acidic)\n`;
      response += `- Before/After: pH values before and after pump run\n`;
      response += `- Effect: How much pH changed\n`;
    } else {
      response += `No pump activity yet! This could mean:\n`;
      response += `- Your pH is stable in the optimal range\n`;
      response += `- System just started\n`;
      response += `- Arduino is not connected\n`;
    }

    response += `\n📍 Location: Scroll down to "Pump Activity Timeline" section`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Arduino Connection Issues
   * Helps troubleshoot Arduino/serial connection problems
   */
  handleArduinoConnection() {
    if (!this.appState) {
      return "Arduino Connection Troubleshooting:\n\n✅ Steps to check:\n1. Verify Arduino is powered on\n2. Check USB cable is connected properly\n3. Ensure USB drivers are installed\n4. Check the Status Indicators section (top of dashboard)\n5. If still not connected, restart Arduino\n\n📌 Status should show: 🟢 Arduino Connected";
    }

    const { systemStatus } = this.appState;
    let response = "Arduino Connection Status:\n\n";

    if (systemStatus && systemStatus.arduinoConnected) {
      response += `🟢 ✅ Arduino is CONNECTED\n\n`;
      response += `Your Arduino is communicating with the system properly.\n`;
      response += `pH readings should be updating in real-time.\n`;
    } else {
      response += `🔴 ⚠️ Arduino is NOT CONNECTED\n\n`;
      response += `Troubleshooting steps:\n`;
      response += `1. Check if Arduino board is powered on\n`;
      response += `2. Verify USB cable is firmly connected\n`;
      response += `3. Check if cable is not damaged\n`;
      response += `4. Try unplugging and replugging the USB cable\n`;
      response += `5. If using different computer, verify USB drivers are installed\n`;
      response += `6. Restart the Arduino board\n`;
      response += `7. Check if another application is using the serial port\n`;
      response += `\n📍 When connected, green indicator (🟢) will appear in Status Indicators`;
    }

    response += `\n\n📌 Status Indicators are at the top of your dashboard`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Data/Firebase Issues
   * Explains why data might be delayed
   */
  handleDataIssue() {
    if (!this.appState) {
      return "Data synchronization troubleshooting:\n\n✅ Common reasons for delays:\n1. Internet connection is slow\n2. Firebase is experiencing latency\n3. Arduino is not sending readings\n4. System is in simulation mode (when no real data)\n\nTips:\n- Check your internet connection speed\n- Wait 10-15 seconds for data to sync\n- Verify Arduino is connected and sending data";
    }

    const { systemStatus } = this.appState;
    const simulationState = this.appState.simulationState || {};
    let response = "Data Synchronization Status:\n\n";

    // Check if in simulation mode
    if (simulationState && simulationState.enabled) {
      response += `📌 SIMULATION MODE ACTIVE\n`;
      response += `- Real Arduino data hasn't been received for a while\n`;
      response += `- System is generating simulated pH readings\n`;
      response += `- This happens when Arduino is offline or not sending data\n\n`;
      response += `✅ To get back to real data:\n`;
      response += `1. Ensure Arduino is connected\n`;
      response += `2. Verify USB cable is plugged in\n`;
      response += `3. Check Arduino status in Status Indicators\n`;
      response += `4. Once Arduino sends data, simulation will stop automatically\n`;
    } else {
      response += `✅ System is running with REAL DATA\n`;
      response += `- Arduino is actively sending readings\n`;
      response += `- Data is being synced to Firebase\n`;
      response += `- pH values are from your actual sensors\n\n`;
    }

    if (!systemStatus.systemOnline) {
      response += `⚠️ System Status: OFFLINE\n`;
      response += `- Check your internet connection\n`;
      response += `- Firebase may be temporarily unreachable\n`;
    } else {
      response += `🟢 System Status: ONLINE\n`;
      response += `- Connection to Firebase is stable\n`;
    }

    response += `\nLast update: ${
      systemStatus.lastUpdate
        ? new Date(systemStatus.lastUpdate).toLocaleTimeString()
        : "Unknown"
    }`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Chart Display Issues
   * Explains why chart might show limited data
   */
  handleChartDisplay() {
    if (!this.appState) {
      return "pH Trend Graph Help:\n\n📊 The graph shows your pH history:\n- X-axis: Time\n- Y-axis: pH value\n\nIf you see only last few points:\n1. More data points will appear as readings accumulate\n2. Use time filters (24h, 7d, 30d) to view different ranges\n3. System needs at least 2 readings to show a trend";
    }

    const { phReadings, currentTimeRange } = this.appState;
    let response = "Chart Display Explanation:\n\n";

    if (phReadings && phReadings.length > 0) {
      response += `📊 You have ${phReadings.length} pH readings recorded\n`;
      response += `- Current time range: ${currentTimeRange || "24h"}\n`;
      response += `- Green line shows your pH trend\n`;
      response += `- Dots are individual readings\n\n`;

      if (phReadings.length < 5) {
        response += `⏳ LIMITED DATA:\n`;
        response += `- You have ${phReadings.length} readings\n`;
        response += `- More data points will appear as the system collects readings\n`;
        response += `- Chart needs at least 2 points to show a trend\n`;
        response += `- Check back after 1-2 hours for better visualization\n`;
      }
    } else {
      response += `No pH readings yet!\n`;
      response += `- Ensure Arduino is connected\n`;
      response += `- System needs time to collect readings\n`;
      response += `- Check Status Indicators to verify Arduino connection\n`;
    }

    response += `\n✅ The chart automatically updates as new readings come in.`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Crop Change Effects
   * Explains how changing crop affects pH range
   */
  handleCropChangeEffect() {
    if (!this.appState) {
      return "Crop Change Effects on pH:\n\nWhen you change crops:\n1. Optimal pH range updates automatically\n2. Status indicator updates to match new crop's needs\n3. System adjusts pump activation thresholds\n4. Your new crop's pH range appears in the pH display\n\nEach crop has different pH requirements!";
    }

    const { currentCrop, optimalPHMin, optimalPHMax } = this.appState;
    let response = "How Crop Changes Affect pH:\n\n";

    if (currentCrop) {
      response += `📌 Current Crop: ${currentCrop.label}\n`;
      response += `- Optimal pH range: ${currentCrop.minPH} - ${currentCrop.maxPH}\n\n`;
    }

    response += `✅ What happens when you change crops:\n`;
    response += `1. Optimal pH range updates (shown in pH display)\n`;
    response += `2. Pump activation thresholds automatically adjust\n`;
    response += `3. System recalibrates to new crop's requirements\n`;
    response += `4. Status display shows new pH target range\n`;
    response += `5. Pumps activate if pH is now out of the NEW range\n\n`;

    response += `📊 pH Range Examples:\n`;
    response += `- Tomato: 5.5 - 6.8 (acidic)\n`;
    response += `- Wheat: 6.0 - 7.5 (neutral to slightly acidic)\n`;
    response += `- Rice: 5.5 - 6.5 (more acidic)\n`;
    response += `- Aloe Vera: 6.5 - 7.5 (neutral to basic)\n\n`;

    response += `⚠️ Important: If your current pH is now outside the new crop's range, pumps may activate automatically to adjust it.`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: System Status
   * Explains system online/offline status
   */
  handleSystemStatus() {
    if (!this.appState) {
      return "System Status Explanation:\n\n🟢 ONLINE: System is connected to Firebase and receiving data\n🔴 OFFLINE: System cannot reach Firebase (check internet)\n\nIf offline but internet is working:\n1. Check Firebase connection\n2. Try refreshing the page\n3. Verify browser isn't blocking the connection";
    }

    const { systemStatus } = this.appState;
    let response = "System Status:\n\n";

    if (systemStatus.systemOnline) {
      response += `🟢 ONLINE ✅\n`;
      response += `- Connection to Firebase is active\n`;
      response += `- Data syncing is working\n`;
      response += `- Real-time updates enabled\n`;
    } else {
      response += `🔴 OFFLINE ⚠️\n`;
      response += `- Cannot reach Firebase servers\n`;
      response += `- Check your internet connection\n`;
      response += `- Verify you have WiFi/Ethernet connected\n`;
      response += `\n✅ Quick fixes:\n`;
      response += `1. Check internet connection speed\n`;
      response += `2. Refresh the browser (F5 or Ctrl+R)\n`;
      response += `3. Wait a few seconds and refresh again\n`;
      response += `4. Check if other apps can access internet\n`;
    }

    response += `\n\n📌 Status Indicators are at the top of your dashboard\n`;
    response += `Last update: ${
      systemStatus.lastUpdate
        ? new Date(systemStatus.lastUpdate).toLocaleTimeString()
        : "Unknown"
    }`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Simulation Mode
   * Explains when and why simulation mode activates
   */
  handleSimulationMode() {
    if (!this.appState) {
      return "Simulation Mode Explanation:\n\nSimulation Mode activates when:\n1. Arduino is not sending real pH data\n2. No reading received for ~10 seconds\n3. System needs to show continuous monitoring\n\nSimulated data:\n- Looks realistic but not from actual sensor\n- Drifts gradually (+/- 0.05 to 0.15 per reading)\n- Saved to Firebase like real data\n\nWhen real data resumes, simulation stops automatically.";
    }

    const simulationState = this.appState.simulationState || {};
    let response = "Simulation Mode Explanation:\n\n";

    if (simulationState && simulationState.enabled) {
      response += `🎬 SIMULATION MODE CURRENTLY ACTIVE\n\n`;
      response += `Why it activated:\n`;
      response += `- No real Arduino data received for ~10 seconds\n`;
      response += `- Arduino may be offline or not sending readings\n`;
      response += `- System is generating realistic pH simulations\n\n`;
      response += `What's happening:\n`;
      response += `- Fake pH values are being created\n`;
      response += `- They drift gradually to look realistic\n`;
      response += `- Values are saved to Firebase as test data\n`;
      response += `- Charts and logs show these simulated readings\n\n`;
      response += `✅ How to exit simulation mode:\n`;
      response += `1. Connect Arduino to send real data\n`;
      response += `2. Ensure Arduino is powered on\n`;
      response += `3. Check USB connection\n`;
      response += `4. Once real data arrives, simulation stops automatically\n`;
    } else {
      response += `✅ SIMULATION MODE NOT ACTIVE\n\n`;
      response += `- System is using real Arduino data\n`;
      response += `- All pH readings are from actual sensors\n`;
      response += `- Simulation will activate if Arduino goes offline\n`;
    }

    return response;
  }

  /**
   * Return concise disease summary (one-line + short action list)
   */
  getDiseaseSummary(key) {
    if (key === 'angular') {
      return "Angular leaf spot: bacterial disease on cucurbits causing angular water-soaked spots that become necrotic. Prevention: use disease-free seed, rotate crops 2–3 years, improve airflow, avoid overhead watering. Organic: neem, baking-soda or garlic sprays; Chemical: copper-based sprays if needed. Remove infected tissue and disinfect tools.";
    }
    if (key === 'beanrust') {
      return "Bean rust: fungal disease producing pustules on bean leaves leading to defoliation. Prevention: rotate crops, space plants for airflow, use drip irrigation, plant resistant varieties. Organic: neem or Bacillus-based biofungicides; Chemical: strobilurin or copper fungicides as a last resort. Remove infected parts and clean debris.";
    }
    return "Plant appears healthy: continue good cultural practices — proper spacing, morning watering, and monitor pH (6.0–7.0).";
  }

  /**
   * CONTEXTUAL HANDLER: Location/Farm Info
   * Shows current farm location
   */
  handleLocationInfo() {
    if (!this.appState) {
      return "To view or change your farm location:\n\n1. Click your profile name in the top header\n2. Go to Settings\n3. Update 'Farm Location'\n4. Save changes\n\nYour location affects:\n- Crop recommendations\n- Weather forecasts\n- Seasonal crop suggestions";
    }

    const { profile } = this.appState;
    let response = "Your Farm Location:\n\n";

    if (profile && profile.farmLocation) {
      response += `📍 Current Location: ${profile.farmLocation}\n\n`;
    } else {
      response += `📍 Location: Not set yet\n\n`;
    }

    response += `✅ How location helps:\n`;
    response += `1. Weather forecasts are specific to your region\n`;
    response += `2. Crop recommendations match your climate\n`;
    response += `3. Seasonal suggestions for planting\n\n`;

    response += `To update location:\n`;
    response += `1. Click your profile name (top right)\n`;
    response += `2. Go to Settings\n`;
    response += `3. Update Farm Location\n`;
    response += `4. Click Save\n`;

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Troubleshooting
   * Handles general troubleshooting questions
   */
  handleTroubleshooting(message) {
    let response = "Troubleshooting Guide:\n\n";

    if (message.includes("error")) {
      response += `⚠️ Error Troubleshooting:\n`;
      response += `1. Check Status Indicators at the top\n`;
      response += `2. Verify Arduino is connected (🟢 indicator)\n`;
      response += `3. Check internet connection\n`;
      response += `4. Try refreshing the page (F5)\n`;
      response += `5. Clear browser cache if errors persist\n`;
    } else if (message.includes("broken") || message.includes("not working")) {
      response += `🔧 General Troubleshooting:\n`;
      response += `1. Refresh the page\n`;
      response += `2. Restart your browser\n`;
      response += `3. Check internet connection\n`;
      response += `4. Verify Arduino is connected\n`;
      response += `5. Check browser console for error messages (F12)\n`;
    } else {
      response += `🔧 Common Issues & Solutions:\n\n`;
      response += `No pH readings showing?\n`;
      response += `- Check Arduino connection (🟢 indicator)\n`;
      response += `- Ensure Arduino is powered on\n\n`;
      response += `Pump not activating?\n`;
      response += `- Verify pH is actually out of range\n`;
      response += `- Check pump connections\n\n`;
      response += `Chart showing few points?\n`;
      response += `- System needs time to collect readings\n`;
      response += `- Check back after 1-2 hours\n\n`;
      response += `Still having issues? Contact support with:\n`;
      response += `- Exact error message\n`;
      response += `- Your device type\n`;
      response += `- When the issue started\n`;
    }

    return response;
  }

  /**
   * CONTEXTUAL HANDLER: Help Request
   * Guides users through dashboard features
   */
  handleHelpRequest(message) {
    let response = "Dashboard Guide:\n\n";

    if (message.includes("where") || message.includes("find")) {
      response += `📍 Finding dashboard sections:\n`;
      response += `- Top: Header with profile and settings\n`;
      response += `- Below header: Status Indicators\n`;
      response += `- Weather info: Shows current conditions and farm location\n`;
      response += `- pH section: Real-time pH monitoring and chart\n`;
      response += `- Bottom: Pump Activity Timeline\n`;
      response += `- Bottom: Crop Type Selection\n`;
    } else if (message.includes("how")) {
      response += `🎯 How to use EcoSterile:\n\n`;
      response += `Step 1: Set your farm location\n`;
      response += `- Profile → Settings → Update Farm Location\n\n`;
      response += `Step 2: Select your crop\n`;
      response += `- Scroll to Crop Type Selection\n`;
      response += `- Click on a crop card\n\n`;
      response += `Step 3: Monitor pH\n`;
      response += `- Check Real-time pH Monitoring section\n`;
      response += `- Watch the trend graph\n\n`;
      response += `Step 4: Track pump activity\n`;
      response += `- Scroll to Pump Activity Timeline\n`;
      response += `- See when pumps activated\n`;
    } else {
      response += `🌾 EcoSterile Dashboard Overview:\n\n`;
      response += `I can help you with:\n`;
      response += `✅ Crop selection and recommendations\n`;
      response += `✅ pH monitoring and management\n`;
      response += `✅ Pump activity and automation\n`;
      response += `✅ Arduino and sensor troubleshooting\n`;
      response += `✅ Data sync and Firebase issues\n`;
      response += `✅ Settings and profile management\n`;
      response += `✅ Weather and location info\n`;
      response += `✅ Chart and data visualization\n\n`;
      response += `Just ask me any question about your farm or dashboard!`;
    }

    return response;
  }

  /**
   * UNKNOWN QUESTION HANDLER
   * Gracefully handles questions outside EcoSterile scope
   */
  handleUnknownQuestion() {
    const responses = [
      "That's an interesting question, but it's outside my expertise! I'm specifically trained to help with EcoSterile features. Ask me about pH management, crops, pumps, or dashboard navigation.",
      "I'm not sure about that, but I can help with EcoSterile-related questions! Try asking about: crop selection, pH monitoring, system status, or how to use the dashboard.",
      "That question is beyond my knowledge, but I'm here to help with farming and EcoSterile features! What can I help you with?",
      "I don't have information about that. But I can definitely help with: crop recommendations, pH management, pump activity, Arduino troubleshooting, or any dashboard feature!",
      "That's outside my scope, but I'm an expert on EcoSterile! Ask me about your farm, crops, pH levels, or system status and I'll help you out.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Inject appState from dashboard for contextual awareness
   * Call this from dashboard.js after initializing the chatbot
   */
  setAppState(appState) {
    this.appState = appState;
    console.log("✅ Chatbot now has context awareness - connected to appState");
  }

  /**
   * Set up Firebase logging service
   * Call this after user authentication
   */
  setLoggingService(loggingService, userId) {
    this.loggingService = loggingService;
    this.userId = userId;
    console.log("✅ Chatbot logging service initialized for user:", userId);
  }

  /**
   * Get random response from category
   */
  getRandomResponse(category) {
    const responses = this.responses[category] || this.responses.general_help;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear chat history
   */
  clearMessages() {
    this.messages = [];
    this.renderMessages();
  }
}
