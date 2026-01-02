# Dashboard & Authenticated Pages - Dark Mode Implementation Plan

## Overview

This document outlines the planned approach for implementing light/dark mode on authenticated pages (Dashboard, Analytics, Logs, Settings) while keeping auth pages in light mode only.

---

## Key Design Decisions

### 1. **Authentication Pages: Light Mode Only** ✅

- Sign In, Sign Up, Complete Profile
- Never respects system dark mode
- Always renders in light theme
- **Status:** COMPLETE

### 2. **Authenticated Pages: Light/Dark Mode Toggle** ⏳ PENDING

- Dashboard, Analytics, Logs, Settings, etc.
- Respects system theme preference by default
- Optional manual theme toggle (user preference)
- Uses CSS variables for theme tokens

---

## Technical Architecture

### CSS Variable Structure

#### Light Mode Tokens (Root):

```css
:root {
  /* Light Mode - Default */
  --bg-primary: #f9fafb;
  --bg-secondary: #f3f4f6;
  --bg-card: #ffffff;
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-tertiary: #9ca3af;
  --border-color: #e5e7eb;

  /* All other tokens remain same... */
}
```

#### Dark Mode Tokens (html.dark-mode):

```css
html.dark-mode {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --border-color: #334155;

  /* Charts, tables, etc. adapt automatically */
}
```

#### Auth Pages Force Light Mode:

```css
.auth-container,
.auth-container * {
  color-scheme: light;
  /* Explicitly use light mode variables */
}
```

---

## Implementation Steps

### Phase 1: CSS Variables for Dark Mode ⏳

**File:** `styles/theme.css`

1. Keep existing `:root` for light mode (already optimized)
2. Add `html.dark-mode` selector with dark tokens:

   - Background colors (darker shades)
   - Text colors (lighter for contrast)
   - Border colors (lighter grays)
   - Shadow colors (adjusted for dark)
   - Component-specific tokens

3. Add special handling for charts:

   - Dark mode canvas backgrounds
   - Light grid lines
   - Adjusted chart colors

4. Add special handling for tables:
   - Dark alternating rows
   - Light borders
   - Hover states

### Phase 2: Dashboard Dark Mode Styling ⏳

**File:** `styles/dashboard.css`

1. Update component colors:

   - Crop cards background
   - pH monitoring panel
   - Weather widget
   - Status indicators
   - Chat bubble (already has styling)

2. Adjust shadows for dark mode:

   - Use semi-transparent white for dark
   - Reduce shadow opacity

3. Update form elements:
   - Input backgrounds
   - Focus states
   - Dropdown styling

### Phase 3: Theme Detection & Toggle ⏳

**File:** `dashboard/dashboard.js` (or new file `services/theme-manager.js`)

1. **Detect System Preference:**

   ```javascript
   const prefersDark = window.matchMedia(
     "(prefers-color-scheme: dark)"
   ).matches;
   ```

2. **Load User Preference:**

   ```javascript
   const userTheme = localStorage.getItem("theme-preference");
   // 'light' | 'dark' | 'system'
   ```

3. **Apply Theme:**

   ```javascript
   if (theme === "dark" || (theme === "system" && prefersDark)) {
     document.documentElement.classList.add("dark-mode");
   }
   ```

4. **Listen to System Changes:**
   ```javascript
   window
     .matchMedia("(prefers-color-scheme: dark)")
     .addEventListener("change", applyTheme);
   ```

### Phase 4: Theme Switcher UI ⏳

**Location:** Dashboard header or settings

1. **Toggle Button:** Three states (Light, Dark, Auto)
2. **Persistence:** Save to localStorage
3. **Real-time Update:** Instant visual feedback
4. **Settings Page:** Theme preference option

### Phase 5: Chart.js Dark Mode Support ⏳

**File:** `services/chart-utils.js` or similar

```javascript
function getChartOptions(isDarkMode) {
  return {
    scales: {
      ticks: {
        color: isDarkMode ? "#cbd5e1" : "#4b5563",
      },
      grid: {
        color: isDarkMode ? "#334155" : "#e5e7eb",
      },
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? "#f1f5f9" : "#111827",
        },
      },
    },
  };
}
```

---

## CSS Variables Reference

### Colors

**Light Mode:**

- Primary: #10b981
- Primary Dark: #059669
- Background Primary: #f9fafb
- Background Secondary: #f3f4f6
- Background Card: #ffffff
- Text Primary: #111827
- Text Secondary: #4b5563
- Text Tertiary: #9ca3af

**Dark Mode:**

- Primary: #10b981 (unchanged)
- Primary Dark: #059669 (unchanged)
- Background Primary: #0f172a
- Background Secondary: #1e293b
- Background Card: #1e293b
- Text Primary: #f1f5f9
- Text Secondary: #cbd5e1
- Text Tertiary: #94a3b8

### Shadow Tokens (may need adjustment)

**Light Mode:**

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
```

**Dark Mode:**

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
```

---

## Component-Specific Styles

### Crop Cards

```css
/* Light Mode */
.crop-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

/* Dark Mode */
html.dark-mode .crop-card {
  /* Uses --bg-card which is already #1e293b */
  box-shadow: adjusted shadow;
}
```

### pH Monitor

```css
.ph-monitor {
  background: var(--bg-card);
  --chart-bg: var(--bg-secondary);
  --chart-text: var(--text-primary);
}
```

### Status Indicators

```css
.status-indicator {
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}
```

### Input Fields (in Dark Mode)

```css
html.dark-mode input,
html.dark-mode textarea,
html.dark-mode select {
  background-color: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

html.dark-mode input::placeholder {
  color: #64748b;
}

html.dark-mode input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
```

---

## Files to Modify

1. **styles/theme.css** (existing)

   - Add `html.dark-mode` selector
   - Add dark mode color tokens (~50 lines)
   - Add dark mode component styles (~100 lines)

2. **styles/dashboard.css** (existing)

   - Add dark mode specific overrides (~100 lines)
   - Adjust shadows for dark mode
   - Update component backgrounds

3. **dashboard/dashboard.js** (existing)

   - Add theme detection on page load
   - Add localStorage persistence
   - Add system preference listener

4. **services/theme-manager.js** (NEW)

   - Centralized theme management
   - ~80 lines of code
   - Helper functions for theme switching

5. **components/theme-switcher.js** (NEW)
   - UI component for theme toggle
   - Three state button (Light/Dark/Auto)
   - ~100 lines of code

---

## User Preferences Flow

```
User Visits Dashboard
    ↓
Check localStorage for theme preference
    ↓
If found: Apply saved theme
If not found: Check system preference
    ↓
Set html.dark-mode class accordingly
    ↓
Render with appropriate colors
    ↓
User can click theme toggle to override
    ↓
Save preference to localStorage
    ↓
Apply new theme immediately
    ↓
Preference persists across sessions
```

---

## Accessibility Considerations

1. **Color Contrast:**

   - Light Mode: Dark text on light background ✓
   - Dark Mode: Light text on dark background ✓
   - Both meet WCAG AA standards

2. **System Preference Respect:**

   - Default to system preference
   - Allow user override
   - Save preference

3. **No Flash:**

   - Apply theme on page load
   - No visible theme switching
   - Smooth transitions between modes

4. **Keyboard Navigation:**
   - Theme switcher fully keyboard accessible
   - Tab order maintained
   - Focus indicators visible

---

## Testing Checklist

### Light Mode:

- [ ] All components visible and readable
- [ ] Colors match design spec
- [ ] Focus states clear
- [ ] Shadows appropriate
- [ ] Charts display correctly
- [ ] Tables readable

### Dark Mode:

- [ ] All components visible and readable
- [ ] Sufficient contrast for all text
- [ ] Focus states clear
- [ ] Shadows adjusted for dark
- [ ] Charts display correctly
- [ ] Tables readable
- [ ] Alternating row colors distinct

### Theme Toggle:

- [ ] Button changes theme on click
- [ ] Theme persists on page reload
- [ ] System preference respected initially
- [ ] User preference overrides system
- [ ] Smooth transition between themes
- [ ] No layout shift

### Charts/Analytics:

- [ ] Grid lines visible in both modes
- [ ] Legend readable in both modes
- [ ] Tooltips display correctly
- [ ] Legend colors appropriate
- [ ] No color conflicts

### Mobile:

- [ ] Theme switcher accessible on mobile
- [ ] Touch targets adequate (44px+)
- [ ] Layout maintained in both modes
- [ ] No horizontal scroll
- [ ] Performance acceptable

---

## Performance Considerations

1. **CSS Variable Switching:**

   - Single class toggle on html element
   - All child elements auto-update
   - No JavaScript rendering needed
   - O(1) complexity

2. **Storage:**

   - localStorage for persistence
   - ~50 bytes for preference
   - Checked on every page load

3. **System Listener:**

   - Single media query listener
   - Low overhead
   - Respects user preference

4. **No Flash of Wrong Theme:**
   - Theme applied before rendering
   - Inline script in head
   - Prevents FOUC (Flash of Unstyled Content)

---

## Future Enhancements

1. **Custom Theme Editor:**

   - Allow users to customize colors
   - Save custom themes

2. **Time-Based Switching:**

   - Auto-switch based on time of day
   - Morning: Light mode
   - Evening: Dark mode

3. **Accessibility Presets:**

   - High contrast mode
   - Reduced motion mode

4. **Animated Transitions:**
   - Smooth color transitions on switch
   - Optional animation toggle

---

## Migration Path

1. **Week 1:** Add CSS variables to theme.css
2. **Week 2:** Update dashboard.css with dark mode styles
3. **Week 3:** Add theme detection and toggle functionality
4. **Week 4:** Testing and refinement
5. **Week 5:** Deployment and monitoring

---

## Dependencies

- ✅ CSS Variables support (all modern browsers)
- ✅ localStorage API (all modern browsers)
- ✅ matchMedia API (for system preference detection)
- ✅ Chart.js (already in use, needs option updates)

---

## Rollback Plan

If issues arise:

1. Remove `html.dark-mode` class application
2. Delete dark mode CSS variables
3. All components return to light mode
4. No breaking changes to existing code

---

**Status:** Planning Phase ⏳
**Next Step:** Await user instruction to proceed with implementation
**Estimated Effort:** 3-4 hours of development
**Risk Level:** Low (CSS-only changes, no breaking changes)
