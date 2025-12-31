# Firebase Configuration & Troubleshooting Guide

## Current Firebase Setup

Your app is configured with:

- **Project**: `eco-sterile`
- **Database URL**: `https://eco-sterile-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Location**: Asia Southeast (Singapore)

---

## ✅ Database Structure

Your Firebase Realtime Database should have this structure:

```
eco-sterile/
├── users/
│   └── {userId}/
│       ├── profile/
│       │   ├── email
│       │   ├── displayName
│       │   ├── farmName
│       │   ├── location
│       │   └── createdAt
│       │
│       ├── phReadings/
│       │   └── {readingId}/
│       │       ├── value (number: 0-14)
│       │       ├── timestamp (ISO string)
│       │       └── uid
│       │
│       └── pumpLogs/
│           └── {logId}/
│               ├── type (basic | acidic)
│               ├── solution (string)
│               ├── concentration (percentage)
│               ├── timestamp (ISO string)
│               └── uid
```

---

## 🔒 Firebase Security Rules

**IMPORTANT**: Set these rules in Firebase Console → Realtime Database → Rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid",
        "profile": {
          ".validate": "newData.hasChildren(['email', 'displayName'])"
        },
        "phReadings": {
          "$readingId": {
            ".validate": "newData.hasChildren(['value', 'timestamp'])",
            "value": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 14"
            }
          }
        },
        "pumpLogs": {
          "$logId": {
            ".validate": "newData.hasChildren(['type', 'timestamp'])"
          }
        }
      }
    }
  }
}
```

---

## 🔍 Troubleshooting: No Data Showing

### Step 1: Check Browser Console

Open DevTools (F12) → Console tab and look for messages like:

```
Loading pH readings for user: abc123...
pH readings loaded successfully: 0
```

If it says `0`, there's no data in Firebase yet.

### Step 2: Verify Firebase Connection

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project: **eco-sterile**
3. Go to: **Realtime Database**
4. Check if you see your user data under `users/{userId}`

### Step 3: Check Data Structure

Make sure your data looks like this:

**pH Readings Example:**

```json
{
  "phReadings": {
    "-NmXaBc123": {
      "value": 6.8,
      "timestamp": "2025-12-31T07:08:14.000Z",
      "uid": "user123"
    }
  }
}
```

**Pump Logs Example:**

```json
{
  "pumpLogs": {
    "-NmXaBd456": {
      "type": "basic",
      "solution": "Ammonium Hydroxide (NH4OH)",
      "concentration": "1%",
      "timestamp": "2025-12-31T07:08:14.000Z",
      "uid": "user123"
    }
  }
}
```

### Step 4: Generate Test Data

If you have no data, use simulation mode to generate it:

1. Dashboard automatically starts generating pH readings (every 5 seconds)
2. Wait 1-2 minutes for data to accumulate
3. Refresh the page
4. Data should now appear in graphs and pump logs

### Step 5: Check Security Rules

If you see errors in the console like:

```
"Permission denied" or "PERMISSION_DENIED"
```

Then your Firebase security rules are too restrictive. Use the rules above.

---

## 🚀 Quick Start - Creating Test Data

### Manual Method (Firebase Console):

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **eco-sterile** project
3. Go to **Realtime Database**
4. Click **+** next to your user folder
5. Create test data with this structure:

```
users
  └── YOUR_USER_ID
      ├── profile
      │   ├── displayName: "Test User"
      │   ├── email: "test@example.com"
      │   └── createdAt: "2025-12-31T00:00:00Z"
      ├── phReadings
      │   └── reading1
      │       ├── value: 6.8
      │       ├── timestamp: "2025-12-31T07:00:00Z"
      │       └── uid: "YOUR_USER_ID"
      └── pumpLogs
          └── log1
              ├── type: "basic"
              ├── solution: "Ammonium Hydroxide"
              ├── concentration: "1%"
              ├── timestamp: "2025-12-31T07:05:00Z"
              └── uid: "YOUR_USER_ID"
```

### Automatic Method (Simulation):

1. Sign in to the app
2. The dashboard automatically generates pH readings
3. Wait 1-2 minutes
4. Refresh page to see data in graphs

---

## 🔧 Finding Your User ID

Your User ID is shown in the browser console when you sign in:

1. Open DevTools (F12)
2. Go to Console tab
3. Sign in to your account
4. Look for: `Loading pH readings for user: ABC123XYZ...`
5. That `ABC123XYZ` is your User ID

Or in Firebase Console:

1. Go to Authentication → Users
2. Copy the UID from your user row

---

## 📱 Testing Commands (Browser Console)

Paste these in DevTools Console (F12) to test:

**Check current app state:**

```javascript
console.log(window.appState);
```

**Check user ID:**

```javascript
console.log(window.appState.user.uid);
```

**Check pH readings loaded:**

```javascript
console.log(window.appState.phReadings.length + " pH readings");
```

**Check pump logs loaded:**

```javascript
console.log(window.appState.pumpLogs.length + " pump logs");
```

**Manually add a test reading:**

```javascript
import { phService } from "./services/firebase.js";
phService.addReading(window.appState.user.uid, 6.9);
```

---

## ❌ Common Issues

### Issue: "Error: Cannot read property 'uid' of null"

**Solution**: You're not signed in. Sign in first before accessing the dashboard.

### Issue: No data appears but no errors

**Solution**:

1. Check your user ID in Firebase Console
2. Make sure data exists in the correct path
3. Verify security rules allow read access
4. Check console for messages about data loading

### Issue: "Permission denied" errors

**Solution**: Update your Firebase Realtime Database security rules (see above).

### Issue: Readings not updating in real-time

**Solution**:

1. Check Firebase connection (look for console errors)
2. Verify the listener is active (should see "updated in real-time" messages)
3. Check if your rule `.read` permission includes the user

---

## 📊 Expected Console Output (Working Setup)

When everything works, you should see:

```
Loading pH readings for user: abc123xyz
pH readings loaded successfully: 15
pH readings updated in real-time: 15
Loading pump logs for user: abc123xyz
Pump logs loaded successfully: 3
Pump logs updated in real-time: 3
```

---

## 🎯 Next Steps

1. **Verify your Firebase project exists**: https://console.firebase.google.com
2. **Check Realtime Database tab** to see your data structure
3. **Update security rules** with rules provided above
4. **Generate test data** using simulation or manual method
5. **Check browser console** (F12) for any error messages
6. **Refresh dashboard** to reload data

---

## 💡 Need Help?

Check:

- Browser Console (F12) for error messages
- Firebase Console → Realtime Database for data structure
- Firebase Console → Rules for permission issues
- Network tab to verify API calls are succeeding

All logs are printed to console with `console.log()` calls for debugging!
