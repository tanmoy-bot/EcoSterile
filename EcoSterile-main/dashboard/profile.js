import { authService, db } from "../services/firebase.js";
import { themeService } from "../services/theme-service.js";
import {
  ref,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { HeaderComponent } from "../components/header.js";

class ProfileManager {
  constructor() {
    this.user = null;
    this.profileData = null;
    this.isEditing = false;
  }

  async init() {
    console.log("📋 Initializing Profile...");

    authService.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("❌ Not authenticated, redirecting...");
        window.location.href = "../auth/signin.html";
        return;
      }

      this.user = user;
      console.log("✅ User authenticated:", user.uid);

      // Initialize theme from database on profile page load
      console.log("🎨 Initializing theme...");
      await themeService.initializeTheme(user.uid);

      // Initialize header
      this.initHeader();

      // Load profile data
      await this.loadProfileData();

      // Attach event listeners
      this.attachEventListeners();
    });
  }

  initHeader() {
    const header = new HeaderComponent("headerComponent");
    header.init({
      displayName: this.user?.displayName || "User",
      email: this.user?.email,
    });
  }

  async loadProfileData() {
    try {
      const snapshot = await get(ref(db, `users/${this.user.uid}/profile`));

      if (snapshot.exists()) {
        this.profileData = snapshot.val();
        console.log("✅ Profile loaded");
      } else {
        this.profileData = {
          displayName: this.user.displayName || "User",
          email: this.user.email,
          photoURL: null,
          createdAt: new Date().toISOString(),
        };
      }

      this.render();
    } catch (error) {
      console.error("❌ Error loading profile:", error);
    }
  }

  render() {
    // Hide skeleton, show content
    document.getElementById("skeletonLoader").style.display = "none";
    document.getElementById("profileContent").classList.remove("hidden");

    // Fill profile header
    const data = this.profileData;
    document.getElementById("displayName").textContent =
      data.displayName || "User";
    document.getElementById("userEmail").textContent = data.email || "";
    document.getElementById("roleBadge").textContent = this.user.isAdmin
      ? "Admin"
      : "User";
    document.getElementById("infoEmail").textContent = data.email || "";
    document.getElementById("infoRole").textContent = this.user.isAdmin
      ? "Administrator"
      : "Regular User";
    document.getElementById("infoCreated").textContent = this.formatDate(
      data.createdAt
    );
    document.getElementById("infoLastVisit").textContent = data.lastVisited
      ? this.formatDate(data.lastVisited)
      : "Just now";

    // Set avatar
    const avatarImg = document.getElementById("avatarImg");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    if (data.photoURL) {
      avatarImg.src = data.photoURL;
      avatarImg.style.display = "block";
      avatarPlaceholder.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarPlaceholder.style.display = "block";
    }
  }

  attachEventListeners() {
    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "./dashboard.html";
    });

    document.getElementById("editBtn").addEventListener("click", () => {
      this.toggleEdit(true);
    });

    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.toggleEdit(false);
    });

    document.getElementById("saveBtn").addEventListener("click", () => {
      this.saveProfile();
    });
  }

  toggleEdit(enable) {
    this.isEditing = enable;
    const form = document.getElementById("editForm");
    const editBtn = document.getElementById("editBtn");

    if (enable) {
      form.classList.add("show");
      document.getElementById("nameInput").value =
        this.profileData.displayName || "";
      document.getElementById("photoInput").value =
        this.profileData.photoURL || "";
      editBtn.disabled = true;
      editBtn.style.opacity = "0.5";
    } else {
      form.classList.remove("show");
      editBtn.disabled = false;
      editBtn.style.opacity = "1";
    }
  }

  async saveProfile() {
    const name = document.getElementById("nameInput").value.trim();
    const photoURL = document.getElementById("photoInput").value.trim();

    if (!name) {
      console.error("❌ Name cannot be empty");
      return;
    }

    if (photoURL && !this.isValidURL(photoURL)) {
      console.error("❌ Invalid URL");
      return;
    }

    try {
      const saveBtn = document.getElementById("saveBtn");
      const saveBtnText = document.getElementById("saveBtnText");
      const saveBtnSpinner = document.getElementById("saveBtnSpinner");

      saveBtn.disabled = true;
      saveBtnText.style.display = "none";
      saveBtnSpinner.style.display = "inline-block";

      await update(ref(db, `users/${this.user.uid}/profile`), {
        displayName: name,
        photoURL: photoURL || null,
      });

      console.log("✅ Profile saved");
      this.profileData.displayName = name;
      this.profileData.photoURL = photoURL || null;

      this.render();
      this.toggleEdit(false);

      saveBtn.disabled = false;
      saveBtnText.style.display = "inline";
      saveBtnSpinner.style.display = "none";
    } catch (error) {
      console.error("❌ Error saving:", error);
    }
  }

  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const profile = new ProfileManager();
  profile.init();
});
