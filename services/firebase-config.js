/**
 * Firebase Configuration & Initialization
 * Keeps SAME project and database as original EcoSterile
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// SAME Firebase config as original project (eco-sterile)
const firebaseConfig = {
  apiKey: "AIzaSyA6G8DgCBqA9lFMlKfGIC_JCEaZU-GuPxs",
  authDomain: "eco-sterile.firebaseapp.com",
  databaseURL:
    "https://eco-sterile-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eco-sterile",
  storageBucket: "eco-sterile.firebasestorage.app",
  messagingSenderId: "429228597840",
  appId: "1:429228597840:web:45c0f163c578480fc2a755",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
