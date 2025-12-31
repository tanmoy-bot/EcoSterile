/**
 * Authentication Service
 * Firebase Auth with Google Sign-In
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import { auth } from "../services/firebase-config.js";
import { notificationManager } from "../components/notifications.js";

// Setup Google Auth Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Create account with email and password
 */
export async function createAccount(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    notificationManager.success("Account created successfully!");
    return { success: true, user: result.user };
  } catch (error) {
    const message = getAuthErrorMessage(error.code);
    notificationManager.error(message);
    return { success: false, error: message };
  }
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    notificationManager.success("Signed in successfully!");
    return { success: true, user: result.user };
  } catch (error) {
    const message = getAuthErrorMessage(error.code);
    notificationManager.error(message);
    return { success: false, error: message };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    notificationManager.success("Signed in with Google!");
    return { success: true, user: result.user };
  } catch (error) {
    const message = getAuthErrorMessage(error.code);
    notificationManager.error(message);
    return { success: false, error: message };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    notificationManager.success("Password reset email sent. Check your inbox.");
    return { success: true };
  } catch (error) {
    const message = getAuthErrorMessage(error.code);
    notificationManager.error(message);
    return { success: false, error: message };
  }
}

/**
 * Sign out
 */
export async function logout() {
  try {
    await signOut(auth);
    notificationManager.success("Signed out successfully");
    return { success: true };
  } catch (error) {
    notificationManager.error("Failed to sign out");
    return { success: false };
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // User signed in
      callback({
        isAuthenticated: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      });
    } else {
      // User signed out
      callback({
        isAuthenticated: false,
        user: null,
      });
    }
  });
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(code) {
  const messages = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/operation-not-allowed": "This operation is not allowed.",
    "auth/too-many-requests": "Too many failed attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked": "Sign-in popup was blocked by your browser.",
  };

  return messages[code] || "An error occurred. Please try again.";
}
