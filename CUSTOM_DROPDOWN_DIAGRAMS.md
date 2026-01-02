# Custom Dropdown - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Environment                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │  signup.html     │      │ complete-prof... │             │
│  │  (Auth Page)     │      │   (Auth Page)    │             │
│  └────────┬─────────┘      └────────┬─────────┘             │
│           │                         │                      │
│           └────────────────┬────────┘                      │
│                            │                               │
│           ┌────────────────▼────────────────┐              │
│           │  CustomDropdown Component        │              │
│           │  (components/CustomDropdown.js) │              │
│           │                                  │              │
│           │  - Event Handling               │              │
│           │  - Search Filtering             │              │
│           │  - State Management             │              │
│           │  - DOM Rendering                │              │
│           └────────────────┬────────────────┘              │
│                            │                               │
│           ┌────────────────▼────────────────┐              │
│           │   indiaLocations.json           │              │
│           │   (Static Data)                 │              │
│           └─────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Initialization Flow

```
User Visits Page (signup.html / complete-profile.html)
    │
    ├─ DOM Loads
    │  │
    │  └─ 3 Custom Dropdowns Rendered:
    │     ├─ State Dropdown (#stateDropdown)
    │     ├─ District Dropdown (#districtDropdown)
    │     └─ Taluka Dropdown (#talukaDropdown)
    │
    ├─ JavaScript Executes
    │  │
    │  ├─ Import CustomDropdown Class
    │  │
    │  └─ Initialize 3 Instances:
    │     ├─ stateDropdown = new CustomDropdown(...)
    │     ├─ districtDropdown = new CustomDropdown(...)
    │     └─ talukaDropdown = new CustomDropdown(...)
    │
    ├─ Load Location Data
    │  │
    │  ├─ Fetch indiaLocations.json
    │  │
    │  └─ stateDropdown.setOptions(statesList)
    │     └─ stateDropdown.setDisabled(false)
    │
    └─ Ready for User Interaction
```

## User Interaction Flow

```
╔════════════════════════════════════════════════════════════╗
║               User Opens State Dropdown                     ║
╚════════════════════════════════════════════════════════════╝
        │
        ├─ Click Handler Triggered
        │
        ├─ dropdown-trigger.classList.add('open')
        │
        ├─ dropdown-panel.classList.add('open')
        │
        ├─ Search input receives focus
        │
        └─ Dropdown Panel Visible
           ├─ Search input visible
           └─ All states displayed

        ┌──────────────────────────────┐
        │    User Types Search Term    │
        └──────────────────────────────┘
                   │
                   ├─ Input event fires
                   │
                   ├─ filterOptions() called
                   │
                   ├─ Compare search term to each option
                   │
                   ├─ filteredOptions = matches only
                   │
                   └─ render() updates DOM
                      └─ Display filtered results

        ┌──────────────────────────────┐
        │    User Clicks Option        │
        └──────────────────────────────┘
                   │
                   ├─ selectOption(value) called
                   │
                   ├─ selectedValue = value
                   │
                   ├─ Update trigger text
                   │
                   ├─ dropdown.close()
                   │
                   ├─ onChange callback triggered
                   │
                   └─ Parent code executes
                      └─ Load next dropdown (e.g., districts)
```

## Data Cascade Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     User Selects State                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               stateDropdown.onChange called                  │
│                    onStateChange() fires                     │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Clear district   │  │ Load districts   │
        │ dropdown         │  │ from selected    │
        │                  │  │ state            │
        │ districtDropdown │  │                  │
        │ .clear()         │  │ populateDistricts│
        └──────────────────┘  └────────┬─────────┘
                                       │
                                       ▼
                         ┌──────────────────────────┐
                         │ districtDropdown.        │
                         │ setOptions(districtList) │
                         └────────┬─────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │   District Dropdown Enabled  │
                    │   User can select district   │
                    └──────────────────────────────┘
                                  │
                                  │ User Selects District
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │  districtDropdown.onChange   │
                    │     onDistrictChange()       │
                    └──────────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ▼                            ▼
        ┌──────────────────────┐    ┌───────────────────────┐
        │ Clear taluka dropdown│    │ Load talukas          │
        │ talukaDropdown.clear()    │ from selected district│
        └──────────────────────┘    │ populateTalukas()     │
                                    └──────────┬────────────┘
                                               │
                                               ▼
                                  ┌───────────────────────┐
                                  │ talukaDropdown.       │
                                  │ setOptions(talukaList)│
                                  └──────────┬────────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │  Taluka Dropdown Enabled │
                              │ User can select taluka   │
                              └──────────────────────────┘
```

## Component Lifecycle

```
┌─ CREATION
│  ├─ new CustomDropdown(element)
│  ├─ Store DOM references
│  ├─ Initialize state variables
│  └─ Attach event listeners
│
├─ CONFIGURATION
│  ├─ setOptions(array)
│  ├─ setDisabled(boolean)
│  ├─ onChange = callback
│  └─ render() DOM
│
├─ INTERACTION
│  ├─ User clicks trigger
│  ├─ toggle() called
│  ├─ open() or close()
│  ├─ Panel visibility updated
│  ├─ Search input focused
│  └─ User types/selects
│
├─ FILTERING
│  ├─ Input event fires
│  ├─ filterOptions() runs
│  ├─ filteredOptions updated
│  └─ render() with results
│
├─ SELECTION
│  ├─ selectOption(value)
│  ├─ selectedValue updated
│  ├─ Trigger text updated
│  ├─ close() called
│  └─ onChange callback fires
│
└─ CLEANUP
   ├─ clear() called
   ├─ selectedValue reset
   ├─ Trigger text reset
   └─ Panel closed
```

## DOM Structure Hierarchy

```
.custom-dropdown (position: relative)
│
├─ .dropdown-trigger (button element)
│  │  └─ type="button"
│  │  └─ disabled state controllable
│  │
│  ├─ .dropdown-trigger-text
│  │  └─ Displays: "Select State" or selected value
│  │
│  └─ .dropdown-chevron (SVG)
│     └─ Rotates 180° when open
│
└─ .dropdown-panel (absolute, display: flex)
   │  └─ position: absolute
   │  └─ top: 100%
   │  └─ z-index: 1000
   │  └─ max-height: 280px
   │  └─ display: none (initially)
   │  └─ display: flex (when .open)
   │
   ├─ .dropdown-search (sticky section)
   │  └─ padding: 10px 12px
   │  └─ border-bottom: 1px
   │  │
   │  └─ input.dropdown-search-input
   │     └─ type="text"
   │     └─ placeholder="Search..."
   │
   └─ .dropdown-options (scrollable section)
      │  └─ overflow-y: auto
      │  └─ flex: 1
      │
      ├─ .dropdown-option (each option)
      │  └─ padding: 10px 12px
      │  └─ hover: light green bg
      │  └─ .selected: darker green
      │
      └─ .dropdown-empty (if no results)
         └─ text-align: center
         └─ display: block (only if 0 results)
```

## Event Flow Diagram

```
┌─────────────────────────────────┐
│  Document Click Event           │
└─────────────────────────────────┘
            │
            ├─ Event bubbles up
            │
            ▼
┌─────────────────────────────────────────┐
│  Document click listener                 │
│  (in CustomDropdown.init())              │
└─────────────────────────────────────────┘
            │
            ├─ Check: is target in dropdown?
            │
            ├─ YES → Ignore (inside dropdown)
            │        event.stopPropagation()
            │
            └─ NO → Call close()
                    └─ Remove .open class
                    └─ Hide panel
                    └─ Clear search
```

## State Machine

```
        ┌──────────────────────────────┐
        │      Initial State           │
        │  - isOpen = false            │
        │  - Panel hidden              │
        │  - Search empty              │
        └──────────┬───────────────────┘
                   │
          Click on trigger
                   │
                   ▼
        ┌──────────────────────────────┐
        │      Opening State           │
        │  - toggle() called           │
        │  - open() called             │
        │  - isOpen = true             │
        │  - Panel visible             │
        │  - Search focused            │
        └──────────┬───────────────────┘
                   │
     User types or scrolls
                   │
                   ▼
        ┌──────────────────────────────┐
        │      Filtering State         │
        │  - filterOptions() running   │
        │  - filteredOptions updated   │
        │  - DOM re-rendered           │
        │  - Panel still visible       │
        └──────────┬───────────────────┘
                   │
  User clicks option or outside
                   │
                   ▼
        ┌──────────────────────────────┐
        │      Closing State           │
        │  - selectOption() or close() │
        │  - selectedValue updated     │
        │  - onChange fired            │
        │  - isOpen = false            │
        │  - Panel hidden              │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │      Final State             │
        │  - Selection complete        │
        │  - Ready for next action     │
        │  - Can click again           │
        └──────────────────────────────┘
```

## CSS Transitions

```
All transitions use: transition: all 150ms ease

┌─ Border Color
│  #E5E7EB (inactive) ──150ms──► #10B981 (hover/focus)

├─ Background Color
│  #F9FAFB (inactive) ──150ms──► #FFFFFF (hover/focus)
│  (default) ──────────150ms──► #F0FDF4 (option hover)

├─ Box Shadow
│  none ────150ms──► 0 0 0 3px rgba(16,185,129,0.15)

├─ Chevron Rotation
│  0deg ────150ms──► 180deg (when .open)

├─ Text Color
│  #111827 ──150ms──► #059669 (option hover)

└─ Opacity
  0.5 (disabled) ───150ms───► 0.5 (no change)
```

---

**All diagrams show the current implementation state as of January 2, 2026**
