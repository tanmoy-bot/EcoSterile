/**
 * Loading Skeleton & Spinner Components
 * Professional loading states
 */

/**
 * Create a skeleton loading card
 */
export function createSkeleton() {
  const div = document.createElement("div");
  div.className = "skeleton-card";
  div.innerHTML = `
    <div class="skeleton-header">
      <div class="skeleton skeleton-text-lg" style="width: 40%;"></div>
      <div class="skeleton skeleton-avatar"></div>
    </div>
    <div class="skeleton-content">
      <div class="skeleton skeleton-text" style="width: 100%;"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 90%;"></div>
    </div>
  `;
  return div;
}

/**
 * Create a full-page loading overlay
 */
export function createLoadingOverlay(message = "Loading...") {
  const overlay = document.createElement("div");
  overlay.className = "loading-overlay loading-overlay-visible";
  overlay.id = "global-loading-overlay";
  overlay.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
      <p class="spinner-text">${message}</p>
    </div>
  `;
  return overlay;
}

/**
 * Show global loading overlay
 */
export function showLoading(message = "Loading...") {
  let overlay = document.getElementById("global-loading-overlay");
  if (!overlay) {
    overlay = createLoadingOverlay(message);
    document.body.appendChild(overlay);
  }
  overlay.classList.add("loading-overlay-visible");
  overlay.querySelector(".spinner-text").textContent = message;
}

/**
 * Hide global loading overlay
 */
export function hideLoading() {
  const overlay = document.getElementById("global-loading-overlay");
  if (overlay) {
    overlay.classList.remove("loading-overlay-visible");
    // Don't remove from DOM - just hide
  }
}

/**
 * Show a loading state in a specific container
 */
export function showContainerLoading(container, itemCount = 3) {
  container.innerHTML = "";
  for (let i = 0; i < itemCount; i++) {
    container.appendChild(createSkeleton());
  }
}

/**
 * Clear container loading state
 */
export function hideContainerLoading(container) {
  container.innerHTML = "";
}
