# Custom Dropdown Component - Visual Guide & Usage

## Component Architecture

```
CustomDropdown Class
├── Constructor(dropdownElement, options = {})
├── DOM References
│   ├── trigger (button that opens/closes)
│   ├── panel (dropdown content container)
│   ├── searchInput (filter input)
│   └── optionsContainer (list of options)
├── State Management
│   ├── options (all available options)
│   ├── filteredOptions (search results)
│   ├── selectedValue (current selection)
│   ├── isOpen (dropdown open state)
│   └── onChange (callback function)
└── Public Methods
    ├── setOptions(array) - Set available options
    ├── filterOptions() - Filter by search term
    ├── selectOption(value) - Select an option
    ├── getValue() - Get selected value
    ├── setValue(value) - Set selected value
    ├── clear() - Clear selection
    ├── setDisabled(boolean) - Enable/disable dropdown
    ├── open() - Open dropdown
    └── close() - Close dropdown
```

## HTML Structure

### Required HTML for Each Dropdown

```html
<div class="custom-dropdown" id="stateDropdown">
  <button type="button" class="dropdown-trigger" disabled>
    <span class="dropdown-trigger-text">Select State</span>
    <svg class="dropdown-chevron" viewBox="0 0 20 20" fill="currentColor">
      <path
        fill-rule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      />
    </svg>
  </button>
  <div class="dropdown-panel">
    <div class="dropdown-search">
      <input
        type="text"
        placeholder="Search state…"
        class="dropdown-search-input"
      />
    </div>
    <div class="dropdown-options"></div>
  </div>
</div>
```

### CSS Layout Hierarchy

```
.custom-dropdown (position: relative)
├── .dropdown-trigger (button - flex layout)
│   ├── .dropdown-trigger-text (flex: 1)
│   └── .dropdown-chevron (width: 16px, rotates on open)
└── .dropdown-panel (absolute, display: flex, flex-direction: column)
    ├── .dropdown-search (flex-shrink: 0)
    │   └── input.dropdown-search-input
    └── .dropdown-options (flex: 1, overflow-y: auto)
        ├── .dropdown-option (on hover: light green bg)
        ├── .dropdown-option.selected (darker green)
        └── .dropdown-empty (if no results)
```

## Usage Example - Signup.html

### HTML Structure

```html
<div class="location-grid">
  <div class="location-select" id="stateSelectContainer">
    <div class="custom-dropdown" id="stateDropdown">
      <!-- Custom dropdown structure -->
    </div>
    <div class="loading-indicator"></div>
    <div class="location-error" id="stateError"></div>
  </div>
  <!-- Similar for district and taluka -->
</div>
```

### JavaScript Integration

```javascript
import { CustomDropdown } from "../components/CustomDropdown.js";

// Initialize
stateDropdown = new CustomDropdown(document.getElementById("stateDropdown"));

// Set options from data
stateDropdown.setOptions(["Maharashtra", "Karnataka", "Tamil Nadu"]);
stateDropdown.setDisabled(false);

// Handle selection changes
stateDropdown.onChange = (selectedValue) => {
  console.log("Selected:", selectedValue);
  // Load districts based on selected state
};

// Get selected value
const selected = stateDropdown.getValue(); // 'Maharashtra'

// Clear selection
stateDropdown.clear();

// Disable/enable
stateDropdown.setDisabled(true);
```

## Usage Example - Complete Profile.html

### State Management Object

```javascript
let selectedLocation = {
  state: null,
  district: null,
  taluka: null,
};

// Callbacks update the object
function onStateChange(selectedState) {
  selectedLocation.state = selectedState;
  // Load districts...
  districtDropdown.setOptions(districts);
  districtDropdown.setDisabled(false);
}

// Form uses the object
form.addEventListener("submit", (e) => {
  const state = selectedLocation.state;
  const district = selectedLocation.district;
  const taluka = selectedLocation.taluka;
  // Submit form with location data...
});
```

## CSS Classes Reference

### Trigger Button States

```css
.dropdown-trigger              /* Base state - 40px height, light gray bg */
.dropdown-trigger:hover        /* Hover - green border, white bg */
.dropdown-trigger:focus        /* Focus - green glow outline */
.dropdown-trigger:disabled     /* Disabled - 50% opacity, gray bg */
.dropdown-trigger.open         /* Open - chevron rotates 180deg */
```

### Panel States

```css
.dropdown-panel                /* Hidden by default (display: none) */
.dropdown-panel.open           /* Visible (display: flex) */
.dropdown-panel::after         /* Optional scroll behavior */
```

### Options States

```css
.dropdown-option/* Default - hover: light green bg */
.dropdown-option: hover /* Hover state - #F0FDF4 bg, #059669 text */
  .dropdown-option.selected /* Selected - #D1FAEAE bg, bold text */
  .dropdown-empty;
.dropdown-option/* No results - centered gray text */;
```

## Color Palette

| Element       | Color                 | Use                        |
| ------------- | --------------------- | -------------------------- |
| Background    | #F9FAFB               | Trigger & search input bg  |
| Border        | #E5E7EB               | Borders for inactive state |
| Border Hover  | #10B981               | Border on hover/focus      |
| Hover BG      | #F0FDF4               | Option hover background    |
| Hover Text    | #059669               | Option hover text          |
| Selected BG   | #D1FAEAE              | Selected option background |
| Selected Text | #047857               | Selected option text       |
| Text          | #111827               | Default text color         |
| Placeholder   | #9CA3AF               | Search input placeholder   |
| Focus Glow    | rgba(16,185,129,0.15) | Focus ring color           |

## Transitions

All transitions use **150ms ease** for smooth interactions:

- Hover effects
- Focus states
- Chevron rotation
- Border color changes
- Background color changes

## Accessibility Features

✅ **Keyboard Access**

- Tab to focus dropdown
- Space/Enter to open
- Click outside to close
- Search input takes focus

✅ **Visual Indicators**

- Green focus glow (high contrast)
- Chevron shows open/close state
- Disabled state is visually distinct
- Selected option has distinct background

✅ **Touch Friendly**

- 40px minimum touch targets
- Padding on options for easy tapping
- Smooth scrolling on long lists

✅ **Screen Reader Compatible**

- Semantic button element
- ARIA labels can be added
- Text content is descriptive

## Performance Considerations

1. **Search Filtering**: O(n) where n is number of options

   - Optimal for lists < 1000 items
   - Consider virtual scrolling for larger lists

2. **DOM Rendering**: Options are added dynamically

   - Efficient for filtering
   - No pre-rendering of hidden options

3. **Event Handling**: Single listener per dropdown
   - Document-level click handler for outside detection
   - Input event for filtering

## Extension Points

### Adding Keyboard Navigation

```javascript
// In CustomDropdown.init()
document.addEventListener("keydown", (e) => {
  if (!this.isOpen) return;
  switch (e.key) {
    case "ArrowDown":
      this.nextOption();
      break;
    case "ArrowUp":
      this.prevOption();
      break;
    case "Enter":
      this.selectCurrentOption();
      break;
    case "Escape":
      this.close();
      break;
  }
});
```

### Adding Dark Mode Support

```javascript
// In CustomDropdown constructor
this.isDarkMode = options.darkMode || false;

// In render()
if (this.isDarkMode) {
    this.optionsContainer.classList.add('dark-mode');
}

// In CSS
.dropdown-panel.dark-mode {
    background: #1F2937;
    border-color: #374151;
}
.dropdown-option.dark-mode {
    color: #F3F4F6;
}
.dropdown-option.dark-mode:hover {
    background: #374151;
    color: #10B981;
}
```

### Adding Custom Icons

```javascript
// Dropdown with icon
<div class="dropdown-option">
    <span class="option-icon">📍</span>
    <span class="option-text">Maharashtra</span>
</div>

// CSS
.dropdown-option {
    display: flex;
    align-items: center;
    gap: 8px;
}
.option-icon {
    flex-shrink: 0;
}
```

## Comparison: Native Select vs Custom Dropdown

| Feature       | Native Select          | Custom Dropdown          |
| ------------- | ---------------------- | ------------------------ |
| Styling       | Limited                | Full control             |
| Search        | ❌                     | ✅                       |
| Custom Icons  | ❌                     | ✅                       |
| Mobile UX     | Native picker          | Custom                   |
| Accessibility | Built-in               | Can add ARIA             |
| File Size     | 0KB                    | ~4KB minified            |
| API           | .value, .selectedIndex | .getValue(), .setValue() |
| Customization | ❌                     | ✅ Extensive             |

## Troubleshooting

### Dropdown not appearing

- Check z-index of `.dropdown-panel` (set to 1000)
- Verify `display: flex` on open state
- Check parent element overflow properties

### Search not filtering

- Ensure options array contains strings
- Check `.filterOptions()` method logic
- Verify input event listener is attached

### Disabled state not working

- Call `.setDisabled(true)` on CustomDropdown instance
- Check CSS for `.dropdown-trigger:disabled` styles
- Verify button disabled attribute is set

### Options not visible

- Check `.dropdown-options` max-height (280px)
- Verify overflow-y: auto is set
- Check padding/margins on options

### Focus/Tab issues

- Ensure button element is in focus order
- Check z-index conflicts
- Verify document click listener doesn't interfere
