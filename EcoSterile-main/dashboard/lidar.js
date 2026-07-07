/**
 * Lidar Field Mapping - Main Page
 * 3D field visualization and soil pH analysis
 *
 * Firebase Storage Structure:
 * /lidarFields/{userUid}/{fieldId}/{fileType}/{timestamp-filename}
 *
 * Firebase Database Structure:
 * /lidarFields/{fieldId}/{ownerUid, meshUrl, scanUrl, mode, createdAt}
 */

import { authService, userService } from "../services/firebase.js";
import { HeaderComponent } from "../components/header.js";
import { themeService } from "../services/theme-service.js";
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import {
  getDatabase,
  ref as dbRef,
  set,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ==========================================
// Firebase Storage Configuration
// ==========================================
const STORAGE_CONFIG = {
  basePath: "lidarFields",
  maxFileSize: 300 * 1024 * 1024, // 300MB
  validExtensions: {
    mesh: ["obj", "ply", "glb", "gltf"],
    scan: ["txt", "png", "jpg", "jpeg"],
  },
  mimeTypes: {
    mesh: [
      "application/octet-stream",
      "model/gltf-binary",
      "model/gltf+json",
      "text/plain",
    ],
    scan: ["text/plain", "image/png", "image/jpeg"],
  },
};

// ==========================================
// Page State
// ==========================================
const pageState = {
  user: null,
  currentView: "mesh",
  uploadedFiles: {
    mesh: null, // { name, file, url, storageRef }
    scan: null, // { name, file, url, storageRef }
  },
  fieldId: null,
  uploadProgress: {
    mesh: 0,
    scan: 0,
  },
};

// ==========================================
// Initialize Page
// ==========================================
function initPage() {
  try {
    console.log("🗺️ Initializing Lidar Field Mapping page...");

    // Use onAuthStateChanged to properly wait for auth state
    authService.onAuthStateChanged(async (user) => {
      if (!user) {
        console.warn("❌ User not authenticated, redirecting to signin");
        window.location.href = "../auth/signin.html";
        return;
      }

      // 1. Initialize theme from database FIRST (before rendering UI)
      console.log("🎨 Fetching theme preference from database...");
      await themeService.initializeTheme(user.uid);
      console.log("✅ Theme initialized");

      pageState.user = user;
      console.log("✅ User authenticated:", user.email);

      // Initialize header
      initHeader(user);

      // Setup event listeners
      setupEventListeners();

      // Load user profile data if available
      await loadUserProfile(user.uid);

      console.log("✅ Lidar page fully initialized");
    });
  } catch (error) {
    console.error("❌ Initialization error:", error);
    showNotification("Failed to initialize page", "error");
  }
}

// ==========================================
// Header Initialization
// ==========================================
function initHeader(user) {
  const headerComponent = new HeaderComponent("headerComponent");
  headerComponent.init(user);

  // Listen for logout event
  window.addEventListener("logout", async () => {
    await handleLogout();
  });
}

// ==========================================
// Load User Profile
// ==========================================
async function loadUserProfile(uid) {
  try {
    const profile = await userService.getUserProfile(uid);
    if (profile) {
      console.log("✅ User profile loaded:", profile.displayName);
    }
  } catch (error) {
    console.warn("⚠️ Could not load user profile:", error.message);
  }
}

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
  // Theme change listener
  try {
    themeService.onChange((newTheme) => {
      console.log("🎨 Lidar: Theme changed to", newTheme);
      // Theme is automatically applied by themeService
    });
  } catch (e) {
    console.warn("⚠️ Theme change listener setup error:", e.message);
  }

  // View mode tabs
  const viewTabButtons = document.querySelectorAll(".view-tab-btn");
  viewTabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      handleViewModeChange(e);
    });
  });

  // Create Lidar Field button
  const createBtn = document.getElementById("createLidarBtn");
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      handleCreateField();
    });
    // Initialize button state
    updateCreateFieldButton();
  }

  // File upload drag and drop
  setupUploadHandlers();
}

// ==========================================
// Handle View Mode Change
// ==========================================
function handleViewModeChange(event) {
  const button = event.currentTarget;
  const viewMode = button.dataset.view;

  // Update active tab
  document.querySelectorAll(".view-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");

  pageState.currentView = viewMode;
  console.log("📍 View mode changed to:", viewMode);

  // Log action for future Three.js integration
  updateViewerPlaceholder(viewMode);
}

// ==========================================
// Update Viewer Placeholder
// ==========================================
function updateViewerPlaceholder(viewMode) {
  const placeholder = document.querySelector(".placeholder-text");

  const messages = {
    mesh: "3D Mesh View",
    scan: "Lidar Scan View",
    heatmap: "pH Heatmap View",
  };

  if (placeholder) {
    placeholder.textContent =
      messages[viewMode] || "3D Viewer will render here";
  }
}

// ==========================================
// Setup Upload Handlers
// ==========================================
function setupUploadHandlers() {
  const uploadCards = document.querySelectorAll(".upload-card");

  uploadCards.forEach((card) => {
    const isFirst = card === uploadCards[0]; // First is mesh, second is scan
    const fileType = isFirst ? "mesh" : "scan";

    // Create hidden file input for each card
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.hidden = true;
    fileInput.id = `fileInput-${fileType}`;

    // Set accepted file types
    if (fileType === "mesh") {
      fileInput.accept = ".obj,.ply,.glb,.gltf";
    } else {
      fileInput.accept = ".txt,.png,.jpg,.jpeg";
    }

    document.body.appendChild(fileInput);

    // Click card to open file input
    card.addEventListener("click", () => {
      fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        handleFileSelected(file, fileType, card);
      }
    });

    // Drag and drop
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove("drag-over");

      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileSelected(file, fileType, card);
      }
    });
  });
}

// ==========================================
// Firebase Storage Utilities
// ==========================================

/**
 * Generate a unique field ID
 */
function generateFieldId() {
  return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build storage path for lidar field files
 * Structure: lidarFields/{userUid}/{fieldId}/
 */
function getStoragePath(userUid, fieldId, fileType) {
  return `${STORAGE_CONFIG.basePath}/${userUid}/${fieldId}/${fileType}`;
}

/**
 * Validate file before upload
 */
function validateFile(file, fileType) {
  const errors = [];

  // Check extension
  const fileExtension = file.name.split(".").pop().toLowerCase();
  if (!STORAGE_CONFIG.validExtensions[fileType].includes(fileExtension)) {
    errors.push(
      `Invalid file type. Expected: ${STORAGE_CONFIG.validExtensions[fileType].join(", ")}`,
    );
  }

  // Check file size
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    errors.push(
      `File too large. Maximum size: 300MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );
  }

  // Check file size minimum
  if (file.size === 0) {
    errors.push("File is empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Update upload progress UI
 */
function updateUploadProgress(fileType, progress) {
  pageState.uploadProgress[fileType] = progress;
  const uploadNote = document.querySelector(".upload-note");

  if (uploadNote) {
    const meshProgress = pageState.uploadProgress.mesh;
    const scanProgress = pageState.uploadProgress.scan;

    if (meshProgress > 0 && meshProgress < 100) {
      uploadNote.textContent = `⏳ Mesh upload: ${meshProgress}%`;
    } else if (scanProgress > 0 && scanProgress < 100) {
      uploadNote.textContent = `⏳ Scan upload: ${scanProgress}%`;
    }
  }
}

// ==========================================
// Handle File Selected
// ==========================================
async function handleFileSelected(file, fileType, cardElement) {
  console.log(
    `📤 File selected for ${fileType}:`,
    file.name,
    `(${(file.size / 1024 / 1024).toFixed(2)}MB)`,
  );

  // Validate file
  const validation = validateFile(file, fileType);
  if (!validation.isValid) {
    const errorMsg = validation.errors.join(" | ");
    console.error("❌ File validation failed:", errorMsg);
    showNotification(`❌ ${errorMsg}`, "error");
    return;
  }

  // Show loading state
  showNotification(`⏳ Uploading ${file.name}...`, "info");
  updateUploadProgress(fileType, 10);

  try {
    // Generate field ID if not exists
    if (!pageState.fieldId) {
      pageState.fieldId = generateFieldId();
      console.log("📍 Generated field ID:", pageState.fieldId);
    }

    // Get storage and build path
    const storage = getStorage();
    const userId = pageState.user.uid;
    const fieldId = pageState.fieldId;
    const basePath = getStoragePath(userId, fieldId, fileType);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${basePath}/${fileName}`;

    console.log("📂 Storage path:", filePath);

    const fileRef = ref(storage, filePath);

    // Upload file with progress tracking
    console.log("🔄 Starting upload...");
    updateUploadProgress(fileType, 10);

    // Use resumable upload for better progress tracking
    const uploadTask = uploadBytesResumable(fileRef, file);

    // Wrap upload task in promise for better error handling
    const uploadPromise = new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(2)}%`);
          updateUploadProgress(fileType, Math.min(90, progress)); // Cap at 90% until download URL is fetched
        },
        (error) => {
          console.error("❌ Upload progress error:", error);
          reject(error);
        },
        () => {
          // Upload completed successfully
          console.log("✅ File uploaded successfully");
          resolve(uploadTask.snapshot);
        },
      );
    });

    // Wait for upload to complete
    const snapshot = await uploadPromise;

    console.log("✅ File uploaded, getting download URL...");
    updateUploadProgress(fileType, 95);

    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("✅ Download URL obtained");
    updateUploadProgress(fileType, 100);

    // Store file info in pageState
    pageState.uploadedFiles[fileType] = {
      name: file.name,
      file: file,
      url: downloadURL,
      size: file.size,
      timestamp: timestamp,
      storageRef: filePath,
      fieldId: fieldId,
    };

    console.log(`✅ ${fileType.toUpperCase()} file stored in state:`, {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      url: downloadURL.substring(0, 50) + "...",
    });

    // Update card UI to show upload success
    updateCardWithUploadedFile(cardElement, fileType, file.name);

    // Enable Create Field button if both files are uploaded
    updateCreateFieldButton();

    showNotification(
      `✅ ${fileType.toUpperCase()} uploaded successfully!`,
      "success",
    );

    // Reset progress
    setTimeout(() => {
      updateUploadProgress(fileType, 0);
    }, 2000);
  } catch (error) {
    console.error("❌ Upload failed:", error);

    // Handle specific Firebase errors
    let errorMsg = error.message;
    if (error.code === "storage/unauthorized") {
      errorMsg = "Not authorized to upload. Check Firebase Storage rules.";
    } else if (error.code === "storage/canceled") {
      errorMsg = "Upload was cancelled.";
    } else if (error.code === "storage/unknown") {
      errorMsg = "Unknown storage error. Check network connection.";
    }

    showNotification(`❌ Upload failed: ${errorMsg}`, "error");
    updateUploadProgress(fileType, 0);

    // Clear field ID on first upload failure
    if (!pageState.uploadedFiles.mesh && !pageState.uploadedFiles.scan) {
      pageState.fieldId = null;
    }
  }
}

// ==========================================
// Update Card UI With Uploaded File
// ==========================================
function updateCardWithUploadedFile(cardElement, fileType, fileName) {
  const placeholder = cardElement.querySelector(".upload-placeholder");
  if (placeholder) {
    placeholder.innerHTML = `
      <div style="color: var(--success-color); font-weight: 600;">✅ File Uploaded</div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px; word-break: break-all;">
        ${fileName}
      </div>
      <button class="btn-remove-file" data-filetype="${fileType}" style="margin-top: 8px; padding: 4px 8px; font-size: 0.8rem; background-color: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
        Remove File
      </button>
    `;

    // Add remove file listener
    const removeBtn = placeholder.querySelector(".btn-remove-file");
    if (removeBtn) {
      removeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await removeUploadedFile(fileType, cardElement);
      });
    }
  }
}

/**
 * Remove uploaded file from storage and state
 */
async function removeUploadedFile(fileType, cardElement) {
  if (!pageState.uploadedFiles[fileType]) {
    showNotification("No file to remove", "info");
    return;
  }

  const fileName = pageState.uploadedFiles[fileType].name;
  console.log(`🗑️ Removing ${fileType} file:`, fileName);
  showNotification(`⏳ Removing ${fileName}...`, "info");

  try {
    const storageRef = pageState.uploadedFiles[fileType].storageRef;

    if (storageRef) {
      const storage = getStorage();
      const fileRef = ref(storage, storageRef);
      await deleteObject(fileRef);
      console.log("✅ File deleted from Firebase Storage:", storageRef);
    }

    // Remove from state
    pageState.uploadedFiles[fileType] = null;

    // Reset card UI
    const placeholder = cardElement.querySelector(".upload-placeholder");
    if (placeholder) {
      const icon = fileType === "mesh" ? "📦" : "📸";
      const desc =
        fileType === "mesh"
          ? "Upload 3D Mesh Model"
          : "Upload Lidar Scan / Screenshot";
      placeholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p>Click to upload or drag and drop</p>
      `;
    }

    // Update button state
    updateCreateFieldButton();

    // If both files removed, clear field ID
    if (!pageState.uploadedFiles.mesh && !pageState.uploadedFiles.scan) {
      pageState.fieldId = null;
      console.log("📍 Field ID cleared");
    }

    showNotification(
      `✅ ${fileType.toUpperCase()} removed successfully`,
      "success",
    );
  } catch (error) {
    console.error("❌ Failed to remove file:", error);
    let errorMsg = error.message;

    if (error.code === "storage/object-not-found") {
      errorMsg = "File not found in storage (may have been deleted already)";
    } else if (error.code === "storage/unauthorized") {
      errorMsg = "Not authorized to delete file.";
    }

    showNotification(`❌ Remove failed: ${errorMsg}`, "error");
  }
}

// ==========================================
// Update Create Field Button State
// ==========================================
function updateCreateFieldButton() {
  const createBtn = document.getElementById("createLidarBtn");
  if (!createBtn) return;

  const hasMesh = pageState.uploadedFiles.mesh !== null;
  const hasScan = pageState.uploadedFiles.scan !== null;
  const bothUploaded = hasMesh && hasScan;

  createBtn.disabled = !bothUploaded;

  if (bothUploaded) {
    createBtn.textContent = "✨ Create Lidar Field";
    createBtn.style.cursor = "pointer";
  } else {
    const missing = [];
    if (!hasMesh) missing.push("Mesh");
    if (!hasScan) missing.push("Scan");
    createBtn.textContent = `⏳ Waiting for: ${missing.join(" & ")}`;
    createBtn.style.cursor = "not-allowed";
  }
}

// ==========================================
// Handle Create Field Button
// ==========================================
async function handleCreateField() {
  // Check if both files are uploaded
  if (!pageState.uploadedFiles.mesh || !pageState.uploadedFiles.scan) {
    showNotification("❌ Please upload both files first", "error");
    return;
  }

  console.log("📍 Creating Lidar field...");
  showNotification("⏳ Creating field in database...", "info");

  try {
    // Use existing fieldId from upload, or generate new one
    const fieldId = pageState.fieldId || generateFieldId();
    const ownerUid = pageState.user.uid;
    const createdAt = Date.now();

    // Prepare field data for Firebase Realtime Database
    const fieldData = {
      ownerUid: ownerUid,
      meshUrl: pageState.uploadedFiles.mesh.url,
      scanUrl: pageState.uploadedFiles.scan.url,
      mode: "simulated",
      createdAt: createdAt,
    };

    console.log("📝 Preparing field data:", {
      fieldId,
      ownerUid,
      meshUrl: fieldData.meshUrl.substring(0, 50) + "...",
      scanUrl: fieldData.scanUrl.substring(0, 50) + "...",
      mode: fieldData.mode,
      createdAt: new Date(createdAt).toISOString(),
    });

    // Write to Firebase Realtime Database
    // Path: lidarFields/{fieldId}
    const db = getDatabase();
    const fieldRef = dbRef(db, `lidarFields/${fieldId}`);

    console.log("🔄 Writing to Firebase Database...");
    await set(fieldRef, fieldData);

    console.log("✅ Field created in database:", fieldId);

    // Update pageState
    pageState.fieldId = fieldId;

    // Update UI to show field was created
    updateFieldInformationPanel(fieldData, fieldId, createdAt);

    // Update button to show success state
    const createBtn = document.getElementById("createLidarBtn");
    if (createBtn) {
      createBtn.textContent = "✅ Field Created!";
      createBtn.style.backgroundColor = "var(--success-color)";
      createBtn.disabled = true;

      // Reset after 3 seconds
      setTimeout(() => {
        createBtn.textContent = "✨ Create Another Field";
        createBtn.style.backgroundColor = "";
        createBtn.disabled = true;

        // Allow user to reset and start over
        createBtn.addEventListener(
          "click",
          () => {
            resetLidarFields();
          },
          { once: true },
        );
      }, 2000);
    }

    showNotification(
      `✅ Lidar field created successfully! (ID: ${fieldId.substring(0, 20)}...)`,
      "success",
    );
  } catch (error) {
    console.error("❌ Failed to create field:", error);

    // Handle Firebase-specific errors
    let errorMsg = error.message;
    if (error.code === "PERMISSION_DENIED") {
      errorMsg = "Permission denied. Check Firebase Database rules.";
    } else if (error.code === "NETWORK_ERROR") {
      errorMsg = "Network error. Check your connection.";
    }

    showNotification(`❌ Failed to create field: ${errorMsg}`, "error");
  }
}

// ==========================================
// Update Field Information Panel
// ==========================================
function updateFieldInformationPanel(fieldData, fieldId, createdAt) {
  // Update the field info cards with actual data
  const infoCards = document.querySelectorAll(".info-card");

  if (infoCards.length >= 4) {
    // Field Area
    const areaMesh = pageState.uploadedFiles.mesh;
    const areaValue = areaMesh
      ? `${(areaMesh.size / 1024 / 1024).toFixed(2)}MB`
      : "--";
    infoCards[0].querySelector(".info-value").textContent = areaValue;

    // Average pH (will be calculated later)
    infoCards[1].querySelector(".info-value").textContent = "--";

    // Data Points (2 files: mesh + scan)
    infoCards[2].querySelector(".info-value").textContent = "2 files";

    // Last Updated
    const lastUpdated = new Date(createdAt).toLocaleDateString();
    infoCards[3].querySelector(".info-value").textContent = lastUpdated;
  }
}

/**
 * Reset Lidar fields for creating a new field
 */
function resetLidarFields() {
  console.log("🔄 Resetting Lidar fields...");

  // Clear state
  pageState.uploadedFiles.mesh = null;
  pageState.uploadedFiles.scan = null;
  pageState.fieldId = null;
  pageState.uploadProgress.mesh = 0;
  pageState.uploadProgress.scan = 0;

  // Reset card UIs
  const uploadCards = document.querySelectorAll(".upload-card");
  uploadCards.forEach((card) => {
    const placeholder = card.querySelector(".upload-placeholder");
    if (placeholder) {
      const isFirst = card === uploadCards[0];
      const icon = isFirst ? "📦" : "📸";
      placeholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p>Click to upload or drag and drop</p>
      `;
    }
  });

  // Reset button
  const createBtn = document.getElementById("createLidarBtn");
  if (createBtn) {
    createBtn.textContent = "✨ Create Lidar Field";
    createBtn.style.backgroundColor = "";
    createBtn.disabled = true;
    createBtn.style.cursor = "not-allowed";

    // Re-attach the original click handler
    createBtn.replaceWith(createBtn.cloneNode(true));
    const newBtn = document.getElementById("createLidarBtn");
    newBtn.addEventListener("click", () => {
      handleCreateField();
    });
  }

  // Reset info panel
  const infoCards = document.querySelectorAll(".info-card");
  if (infoCards.length >= 4) {
    infoCards[0].querySelector(".info-value").textContent = "--";
    infoCards[1].querySelector(".info-value").textContent = "--";
    infoCards[2].querySelector(".info-value").textContent = "--";
    infoCards[3].querySelector(".info-value").textContent = "--";
  }

  showNotification("✅ Ready to create a new field", "success");
  console.log("✅ Fields reset");
}

// ==========================================
// Logout Handler
// ==========================================
async function handleLogout() {
  try {
    await authService.logout();
    console.log("✅ User logged out");
    window.location.href = "../auth/signin.html";
  } catch (error) {
    console.error("❌ Logout error:", error);
    showNotification("Failed to logout", "error");
  }
}

// ==========================================
// Notification Helper
// ==========================================
function showNotification(message, type = "info") {
  // Create temporary notification
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background-color: ${
      type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "#3b82f6"
    };
    color: white;
    z-index: 1000;
    animation: slideInUp 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutDown 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==========================================
// Page Load
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initPage();
});
