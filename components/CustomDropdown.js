/**
 * CustomDropdown Component
 * Reusable searchable dropdown with light mode styling
 * Works with static data arrays
 */

export class CustomDropdown {
  constructor(dropdownElement, options = {}) {
    this.dropdownElement = dropdownElement;
    this.trigger = dropdownElement.querySelector(".dropdown-trigger");
    this.panel = dropdownElement.querySelector(".dropdown-panel");
    this.searchInput = dropdownElement.querySelector(".dropdown-search-input");
    this.optionsContainer = dropdownElement.querySelector(".dropdown-options");

    this.options = [];
    this.filteredOptions = [];
    this.selectedValue = null;
    this.isOpen = false;
    this.onChange = options.onChange || (() => {});

    this.init();
  }

  init() {
    // Event listeners
    this.trigger.addEventListener("click", () => this.toggle());
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => this.filterOptions());
      this.searchInput.addEventListener("click", (e) => e.stopPropagation());
    }
    document.addEventListener("click", (e) => {
      if (!this.dropdownElement.contains(e.target)) {
        this.close();
      }
    });
  }

  setOptions(optionsArray) {
    this.options = optionsArray || [];
    this.filteredOptions = [...this.options];
    this.render();
  }

  filterOptions() {
    const searchTerm = this.searchInput.value.toLowerCase().trim();
    this.filteredOptions = searchTerm
      ? this.options.filter((opt) => opt.toLowerCase().includes(searchTerm))
      : [...this.options];
    this.render();
  }

  render() {
    this.optionsContainer.innerHTML = "";

    if (this.filteredOptions.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "dropdown-empty";
      emptyDiv.textContent = this.searchInput?.value
        ? "No results found"
        : "No options available";
      this.optionsContainer.appendChild(emptyDiv);
      return;
    }

    this.filteredOptions.forEach((optionText) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "dropdown-option";
      if (optionText === this.selectedValue) {
        optionDiv.classList.add("selected");
      }
      optionDiv.textContent = optionText;
      optionDiv.addEventListener("click", () => this.selectOption(optionText));
      this.optionsContainer.appendChild(optionDiv);
    });
  }

  selectOption(value) {
    this.selectedValue = value;
    const triggerText = this.trigger.querySelector(".dropdown-trigger-text");
    triggerText.textContent = value;
    this.close();
    this.onChange(value);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.trigger.disabled) return;
    this.isOpen = true;
    this.trigger.classList.add("open");
    this.panel.classList.add("open");
    if (this.searchInput) {
      setTimeout(() => this.searchInput.focus(), 0);
    }
  }

  close() {
    this.isOpen = false;
    this.trigger.classList.remove("open");
    this.panel.classList.remove("open");
    if (this.searchInput) {
      this.searchInput.value = "";
      this.filterOptions();
    }
  }

  setDisabled(disabled) {
    this.trigger.disabled = disabled;
    if (disabled) {
      this.close();
    }
  }

  getValue() {
    return this.selectedValue;
  }

  setValue(value) {
    this.selectedValue = value;
    const triggerText = this.trigger.querySelector(".dropdown-trigger-text");
    triggerText.textContent = value || "Select Option";
  }

  clear() {
    this.selectedValue = null;
    const triggerText = this.trigger.querySelector(".dropdown-trigger-text");
    triggerText.textContent =
      this.trigger.getAttribute("data-placeholder") || "Select Option";
    this.close();
  }
}

export default CustomDropdown;
