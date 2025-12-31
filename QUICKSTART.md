# ⚡ EcoSterile Pro - Quick Start Guide

## 30-Second Setup

1. **Open the app:**

   ```
   Double-click: index.html
   ```

2. **Create account:**

   ```
   Email: your@email.com
   Password: (at least 6 characters)
   ```

3. **Start monitoring:**
   - Select your crop
   - Watch real-time pH levels
   - See pump activity log

---

## Key Pages

| Page           | Purpose                   | Path                       |
| -------------- | ------------------------- | -------------------------- |
| Login          | Sign in to account        | `auth/login.html`          |
| Sign Up        | Create new account        | `auth/signup.html`         |
| Password Reset | Reset forgotten password  | `auth/reset-password.html` |
| Dashboard      | Main monitoring interface | `dashboard.html`           |

---

## Main Features at a Glance

### 🔐 Authentication

- **Sign up with email**
- **Sign in with Google**
- **Forgot password recovery**
- **Secure session management**

### 📊 Dashboard

- **Real-time pH display** with visual scale
- **Current status** (Acidic / Optimal / Basic)
- **Last pump activity** with details
- **Statistics** (avg pH, range, pump counts)
- **Crop selector** with optimal ranges
- **pH history chart** (24h, 7d, 30d views)
- **Activity log** of all pumps

### 🌾 Crop Management

Select from 60+ crops:

- Cereals (Rice, Wheat, Maize, etc.)
- Pulses (Chickpea, Lentil, etc.)
- Vegetables (Tomato, Potato, etc.)
- Fruits (Mango, Banana, etc.)

Each crop has optimal pH range (e.g., Rice 5.5-6.5)

### 📈 Real-Time Monitoring

- pH readings every 5 seconds
- Automatic pump activation based on pH
- Firebase real-time sync
- 30-day history retention

### 🔔 Notifications

No annoying popups!

- **Toast notifications** (success, error, warning, info)
- **Auto-dismiss** after 3-5 seconds
- **Manual dismiss** option
- **Professional styling**

---

## Theme & Design

### Dark Mode ✨

- **Eye-friendly** dark background
- **Soft green & cyan** accents
- **ChatGPT/Notion-inspired** look
- **Smooth animations** (subtle, not flashy)
- **Responsive design** (mobile to desktop)

### Color Highlights

- 🟢 **Green:** Optimal pH
- 🔴 **Red:** Acidic pH
- 🔵 **Blue:** Basic pH

---

## pH Scale Explained

```
0 ──────── 7 ──────── 14
↑          ↑          ↑
Acidic   Neutral    Basic
(lemon)  (water)  (bleach)
```

**Optimal for most crops:** 6.5 - 7.5

- Just slightly acidic (sweet spot)
- Where nutrients are most available

---

## Pump Control Logic

### Automatic Activation

```
If pH < Optimal Min  → Activate Basic Pump
                       (add Ammonium Hydroxide)

If pH > Optimal Max  → Activate Acidic Pump
                       (add Acetic Acid)

If pH in Range       → No action needed
```

### Safety Features

- **Hysteresis control** (prevents on/off oscillation)
- **Burst dosing** (1.2 seconds per cycle)
- **Minimum 10-second gap** between activations
- **One pump at a time** (no conflicts)

---

## Firebase Connection

**Same project as original EcoSterile:**

```
Project ID: eco-sterile
Region: asia-southeast1 (India)
Database: Realtime Database
Auth: Email + Google OAuth
```

### What Gets Synced

- ✅ pH readings
- ✅ Pump activations
- ✅ User crop preferences
- ✅ Timestamps

### Works Offline

- Local data is cached
- Syncs when back online
- 30-day history in browser

---

## Troubleshooting

### "Can't sign in"

- ✓ Check email spelling
- ✓ Make sure password is correct
- ✓ Try "Forgot password"
- ✓ Or create new account

### "No pH readings showing"

- ✓ Wait 5-10 seconds (demo generates data)
- ✓ Refresh page
- ✓ Check browser console (F12)

### "Chart not showing"

- ✓ Refresh page
- ✓ Clear browser cache
- ✓ Try different browser

### "Firebase error"

- ✓ Check internet connection
- ✓ Verify Firebase config is correct
- ✓ Check Firebase project is active

---

## Tips & Tricks

### 🎯 Best Practices

1. **Select correct crop first** (affects optimal pH range)
2. **Monitor regularly** (at least once daily)
3. **Check activity log** (ensure pumps are working)
4. **Watch the scale** (visual indicator is clearer)
5. **Use chart views** (identify trends)

### ⏱️ Recommended Schedule

- Morning check: Full system status
- Midday: Quick pH check
- Evening: Review activity log
- Weekly: Analyze trends with 7d view
- Monthly: Full report with 30d view

### 🔐 Security

- **Use strong password** (12+ chars, mix uppercase/numbers)
- **Don't share login** (personal account)
- **Sign out on shared devices**
- **Check activity log** (spot unauthorized changes)

---

## Data Privacy

### What We Store

- Email address
- Hashed password (Firebase)
- pH readings with timestamps
- Pump activity logs
- Crop selection

### What We DON'T Store

- Payment info
- Personal documents
- Location data
- Browsing history

### How It's Protected

- **HTTPS encryption** (Firebase standard)
- **Auth tokens** (secure session)
- **Database rules** (access control)
- **No third-party sharing**

---

## Keyboard Shortcuts

| Shortcut | Action               |
| -------- | -------------------- |
| Enter    | Submit form          |
| Escape   | Close dropdown menu  |
| Ctrl+L   | Focus address bar    |
| F12      | Open developer tools |

---

## Supported Crops (Sample)

### 🌾 Cereals (pH 5.5-7.5)

Rice, Wheat, Maize, Barley, Sorghum, Pearl Millet, Finger Millet

### 🫘 Pulses (pH 5.5-7.5)

Chickpea, Pigeon Pea, Black Gram, Green Gram, Lentil, Kidney Beans

### 🥬 Vegetables (pH 5.0-7.5)

Tomato, Potato, Onion, Brinjal, Cabbage, Cauliflower, Carrot, Spinach, Okra, Peas

### 🍎 Fruits (pH 4.5-7.5)

Mango, Banana, Guava, Apple, Grapes, Papaya, Watermelon, Pomegranate, Orange, Lemon

### 🌾 Cash Crops (pH 4.5-8.0)

Sugarcane, Cotton, Jute, Tobacco, Tea, Coffee, Rubber, Cocoa

### 🌶️ Spices (pH 5.5-8.0)

Cardamom, Black Pepper, Turmeric, Ginger, Coriander, Cumin, Fenugreek, Cinnamon, Clove

**Total:** 60+ crops!

---

## Getting More Help

1. **Read the full README.md** for detailed docs
2. **Check browser console** (F12 > Console tab) for errors
3. **Verify Firebase config** in `services/firebase-config.js`
4. **Test with different browser** (Chrome, Firefox, Safari)
5. **Clear cache** and reload (Ctrl+Shift+Delete)

---

## Version Info

- **App Name:** EcoSterile Pro
- **Version:** 1.0.0 (Professional Edition)
- **Status:** Production Ready ✨
- **Last Updated:** December 31, 2025
- **Built with:** Firebase, Chart.js, Vanilla JavaScript

---

## Quick Reference

### Optimal pH Ranges (Most Common)

| Crop     | Min | Max |
| -------- | --- | --- |
| Rice     | 5.5 | 6.5 |
| Wheat    | 6.0 | 7.5 |
| Tomato   | 5.5 | 6.8 |
| Potato   | 5.0 | 6.0 |
| Chickpea | 6.0 | 7.5 |
| Banana   | 5.5 | 7.0 |

**Pro Tip:** 6.5 is ideal for most crops!

---

Happy farming! 🌱 Let EcoSterile Pro monitor your pH while you focus on growing.
