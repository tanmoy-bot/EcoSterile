# 🌿 EcoSterile

**Professional-Grade pH Regulator Dashboard for Agricultural Monitoring**

A production-ready web application for real-time pH monitoring and automated pump control in agricultural systems. Built with modern web technologies and Firebase, featuring a professional dark-mode-first interface.

## ✨ Key Features

### 🔐 Professional Authentication

- **Email/Password Sign-Up** with form validation
- **Google Sign-In** for quick access
- **Password Reset** with email verification
- **Secure Session Management**

### 📊 Real-time Monitoring

- **Live pH Display** with visual gauge indicator
- **24/7 Historical Data** with Firebase persistence
- **Interactive pH Trend Graphs** (24h, 7d, 30d views)
- **Statistical Analytics** (average, min/max ranges)

### ⚙️ Smart Pump Control

- **Automatic Activation** based on pH thresholds
- **Real-time Activity Timeline** with timestamps
- **Solution Tracking** (Basic/Acidic pumps)
- **Concentration Monitoring**

### 🌾 Crop Management

- **50+ Crop Types** with optimal pH ranges
- **Easy Crop Selection** with cards UI
- **Confirmation Modals** to prevent accidental changes
- **Dynamic pH Thresholds** based on selected crop

### 🎨 Professional UI/UX

- **Dark Mode by Default** inspired by ChatGPT/Notion
- **Light Mode Option** with smooth transitions
- **Industrial Monitoring Aesthetic**
- **Fully Responsive Design** (desktop, tablet, mobile)
- **Smooth Animations & Transitions**

### 🔧 System Status

- **Arduino Connection Indicator** (Connected/Demo mode)
- **Real-time System Health** monitoring
- **Pump Status Display**
- **Last Update Timestamps**

## 📁 Project Structure

```
EcoSterile/
├── auth/
│   ├── signin.html          # Professional sign-in page
│   ├── signup.html          # Account creation page
│   └── reset-password.html  # Password recovery
├── dashboard/
│   ├── dashboard.html       # Main dashboard layout
│   └── dashboard.js         # Application logic
├── components/
│   ├── header.js            # Top navigation component
│   ├── status-indicator.js  # System status display
│   ├── pump-log.js          # Activity timeline
│   └── crop-cards.js        # Crop selector
├── services/
│   └── firebase.js          # Firebase SDK & services
├── styles/
│   ├── theme.css            # Design system & tokens
│   ├── dashboard.css        # Dashboard-specific styles
│   └── animations.css       # Transitions & keyframes
└── images/
    └── (crop images)
```

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Firebase account with Realtime Database
- Internet connection

### Installation

1. **Open the project folder**

   ```
   C:\Users\MY\OneDrive\Desktop\EcoSterile
   ```

2. **Start with Sign-In page**
   - Open `auth/signin.html` in your browser
   - Or navigate to the file directly

3. **Create an Account**
   - Click "Create one now" on the sign-in page
   - Fill in your details
   - You'll be redirected to the dashboard

### First Use

1. **Select Your Crop**
   - Scroll to the "Crop Type Selection" section
   - Choose your crop from the grid
   - The optimal pH range will update automatically

2. **Monitor pH Levels**
   - View real-time pH reading in the gauge
   - Watch the trend graph for patterns
   - Pump activity appears in the timeline

3. **View Statistics**
   - Check average pH and range
   - Monitor pump usage counts
   - Filter graphs by time period

## 🔧 Configuration

### Firebase Setup

The dashboard uses Firebase Realtime Database. Configuration is in `services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

**Database Structure:**

```
users/
├── {userId}/
│   ├── profile/          # User information
│   ├── phReadings/       # pH sensor data
│   ├── pumpLogs/         # Pump activity
│   └── settings/         # User preferences
```

### Arduino Integration

To connect a real Arduino:

1. Update Arduino sketch with your WiFi credentials
2. Ensure Arduino sends JSON format:
   ```json
   { "pH": 7.45, "voltage": 2.441, "pump": "basic" }
   ```
3. Use Web Serial API (Chrome/Edge required)

### Crop Database

Add custom crops in `dashboard/dashboard.js`:

```javascript
const CROPS_DATABASE = [
  {
    value: "rice",
    label: "Rice",
    minPH: 5.5,
    maxPH: 6.5,
  },
  // ... more crops
];
```

## 🎨 Theming

### Dark Mode (Default)

```css
--primary-color: #10b981; /* Eco Green */
--bg-primary: #0f172a; /* Very Dark Blue */
--text-primary: #f1f5f9; /* Light Text */
```

### Light Mode

Enable via the theme toggle button in the header.

### Color Palette

- **Primary (Eco Green)**: #10b981 → #059669
- **Accent (Cyan/Teal)**: #06b6d4, #14b8a6
- **Status**: Green (#10b981), Red (#ef4444), Blue (#3b82f6)
- **Neutrals**: Full gray scale from #111827 to #f9fafb

## 📊 pH Monitoring Logic

### Status Calculation

```javascript
if (pH < optimalPHMin)     → 🔴 "Too Acidic"  (red)
if (pH > optimalPHMax)     → 🔵 "Too Basic"   (blue)
if (pH in range)           → 🟢 "Optimal"     (green)
```

### Pump Activation

- **Basic Pump**: Activated when pH < minThreshold
- **Acidic Pump**: Activated when pH > maxThreshold
- **Cooldown**: Minimum 10 seconds between activations

### Data Retention

- Reads every 5 seconds
- 30-day rolling window
- Automatic cleanup of old data

## 🔐 Security Features

- **Firebase Authentication**: Email/password & OAuth
- **Secure Session Management**: Auto-logout on tab close
- **User Isolation**: Each user sees only their data
- **Password Reset**: Email-based recovery
- **Input Validation**: All forms validated client & server

## 📱 Responsive Design

- **Desktop (1200px+)**: Full layout with side-by-side panels
- **Tablet (768px-1199px)**: Adapted grid and spacing
- **Mobile (<768px)**: Single-column, touch-optimized

## 🎯 Browser Support

| Browser         | Version | Support |
| --------------- | ------- | ------- |
| Chrome          | Latest  | ✅ Full |
| Firefox         | Latest  | ✅ Full |
| Edge            | Latest  | ✅ Full |
| Safari          | Latest  | ✅ Full |
| Mobile Browsers | Latest  | ✅ Full |

## 📖 API Reference

### Firebase Services

#### Authentication

```javascript
// Sign up
authService.signUp(email, password, userData);

// Sign in
authService.signIn(email, password);

// Sign out
authService.signOut();

// Password reset
authService.resetPassword(email);
```

#### pH Readings

```javascript
// Add reading
phService.addReading(userId, phValue);

// Get readings
phService.getReadings(userId, limit);

// Listen to updates
phService.onReadingsUpdate(userId, callback);
```

#### Pump Logs

```javascript
// Log activity
pumpService.logActivity(userId, type, solution, concentration);

// Get logs
pumpService.getLogs(userId, limit);

// Listen to updates
pumpService.onLogsUpdate(userId, callback);
```

## 🔍 Troubleshooting

### Dashboard Not Loading

- Clear browser cache
- Check Firebase connection
- Verify email/password

### No pH Data Appearing

- Ensure Arduino is connected (or simulation is running)
- Check Firebase database permissions
- Verify user is authenticated

### Pump Not Responding

- Check Arduino serial connection
- Verify pin configuration
- Test with simulation mode first

### Styling Issues

- Hard refresh browser (Ctrl+Shift+R)
- Check CSS files are loading
- Verify theme CSS is applied

## 🤝 Contributing

To modify the system:

1. **Update UI**: Edit `dashboard/dashboard.html`
2. **Add Logic**: Modify `dashboard/dashboard.js`
3. **Change Styles**: Update CSS files in `styles/`
4. **Add Components**: Create new `.js` files in `components/`

## 📄 License

This project is part of EcoSterile agricultural monitoring system.

## 🆘 Support

For issues or questions:

1. Check the documentation index
2. Review Firebase console logs
3. Test with simulation mode
4. Verify network connectivity

## 🚀 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics & ML predictions
- [ ] Multi-site management
- [ ] SMS/Email alerts
- [ ] CSV data export
- [ ] API for 3rd-party integration
- [ ] Dark theme customization
- [ ] Greenhouse simulation mode

---

**Last Updated**: December 31, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
