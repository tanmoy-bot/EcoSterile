/**
 * Crop Recommendations Engine
 * Determines recommended crops based on location, season, and water availability
 * Modular design allows future integration with weather/rainfall APIs
 */

export class CropRecommendationEngine {
  /**
   * Initialize the recommendation engine
   */
  constructor() {
    this.seasonalCrops = this.buildSeasonalCropMap();
    this.regionCrops = this.buildRegionalCropMap();
  }

  /**
   * Get recommended crops based on user profile and context
   * @param {Object} userProfile - User profile with location data
   * @param {Array} allCrops - Complete crop database
   * @param {number} limit - Max number of recommendations (default: 10)
   * @returns {Array} Sorted array of recommended crop objects
   */
  getRecommendations(userProfile, allCrops, limit = 10) {
    if (!userProfile || !allCrops) {
      return [];
    }

    // Calculate recommendation scores
    const scoredCrops = allCrops.map((crop) => {
      let score = 0;

      // Season score (highest weight)
      const seasonScore = this.getSeasonalScore(crop);
      score += seasonScore * 3; // Weight: 3x

      // Location score (medium weight)
      const locationScore = this.getLocationScore(crop, userProfile);
      score += locationScore * 2; // Weight: 2x

      // Water score (lower weight - simple logic for now)
      const waterScore = this.getWaterScore(crop);
      score += waterScore * 1; // Weight: 1x

      return {
        ...crop,
        recommendationScore: score,
      };
    });

    // Sort by recommendation score (highest first) and return top N
    return scoredCrops
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  /**
   * Calculate seasonal score for a crop (0-100)
   * Based on current month and crop season mapping
   * @param {Object} crop - Crop object
   * @returns {number} Score 0-100
   */
  getSeasonalScore(crop) {
    const currentMonth = new Date().getMonth(); // 0-11
    const cropValue = crop.value.toLowerCase();

    // Get seasonal crops for current month
    const seasonalCropsThisMonth = this.seasonalCrops[currentMonth] || [];

    // Exact match: 100 points
    if (seasonalCropsThisMonth.includes(cropValue)) {
      return 100;
    }

    // Adjacent months: 60 points (next/prev month)
    const prevMonth = (currentMonth - 1 + 12) % 12;
    const nextMonth = (currentMonth + 1) % 12;
    const adjacentCrops = [
      ...(this.seasonalCrops[prevMonth] || []),
      ...(this.seasonalCrops[nextMonth] || []),
    ];

    if (adjacentCrops.includes(cropValue)) {
      return 60;
    }

    // Off-season: 30 points
    return 30;
  }

  /**
   * Calculate location score for a crop (0-100)
   * Based on user's farm location and regional crop suitability
   * @param {Object} crop - Crop object
   * @param {Object} userProfile - User profile with location
   * @returns {number} Score 0-100
   */
  getLocationScore(crop, userProfile) {
    const location = userProfile.farmLocation?.toLowerCase() || "";
    const cropValue = crop.value.toLowerCase();

    if (!location) {
      // No location data: return neutral score
      return 50;
    }

    // Get regional crops for user's location
    const regionalCrops = this.regionCrops[location] || [];

    // Exact match: 100 points
    if (regionalCrops.includes(cropValue)) {
      return 100;
    }

    // Partial match (state-level): 70 points
    // Extract state from location if available
    const state = location.split(",")[0]?.trim();
    const stateRegionalCrops = this.regionCrops[state] || [];

    if (stateRegionalCrops.includes(cropValue)) {
      return 70;
    }

    // Not commonly grown in region: 40 points
    return 40;
  }

  /**
   * Calculate water score for a crop (0-100)
   * Placeholder for future weather API integration
   * Currently uses simple pH-based heuristic
   * @param {Object} crop - Crop object
   * @returns {number} Score 0-100
   */
  getWaterScore(crop) {
    // Simple placeholder logic:
    // Crops with neutral pH (6.5-7.0) are generally well-adapted to water management
    const neutralPH = (crop.minPH + crop.maxPH) / 2;
    const idealRange = 6.5;
    const deviation = Math.abs(neutralPH - idealRange);

    // Closer to ideal range = higher score
    const score = 100 - deviation * 10;
    return Math.max(30, Math.min(100, score));
  }

  /**
   * Build seasonal crop mapping (month -> crops)
   * @returns {Object} Month index -> array of crop values
   */
  buildSeasonalCropMap() {
    return {
      // January (Winter Harvest)
      0: [
        "wheat",
        "barley",
        "rye",
        "peas",
        "carrot",
        "radish",
        "turnip",
        "spinach",
        "lettuce",
        "mustard",
        "cabbage",
        "cauliflower",
        "broccoli",
      ],

      // February (Winter Harvest)
      1: [
        "wheat",
        "barley",
        "rye",
        "peas",
        "carrot",
        "radish",
        "spinach",
        "lettuce",
        "mustard",
        "cabbage",
      ],

      // March (Spring Start)
      2: [
        "chickpea",
        "moong",
        "urad",
        "barley",
        "wheat",
        "tomato",
        "cucumber",
        "squash",
        "okra",
        "pepper",
      ],

      // April (Pre-Monsoon)
      3: [
        "rice",
        "maize",
        "cotton",
        "sugarcane",
        "tomato",
        "onion",
        "garlic",
        "chili",
        "eggplant",
      ],

      // May (Monsoon Prep)
      5: [
        "rice",
        "maize",
        "cotton",
        "sugarcane",
        "millet",
        "sorghum",
        "pigeon_pea",
        "arhar",
      ],

      // June (Monsoon)
      5: [
        "rice",
        "maize",
        "cotton",
        "sugarcane",
        "millet",
        "sorghum",
        "pigeon_pea",
      ],

      // July (Monsoon)
      6: [
        "rice",
        "maize",
        "cotton",
        "sugarcane",
        "millet",
        "okra",
        "bottle_gourd",
        "bitter_melon",
      ],

      // August (Late Monsoon)
      7: [
        "rice",
        "maize",
        "cotton",
        "millet",
        "sorghum",
        "okra",
        "bottle_gourd",
        "bitter_melon",
      ],

      // September (Post-Monsoon)
      8: [
        "rice",
        "maize",
        "millet",
        "sorghum",
        "chickpea",
        "lentil",
        "moong",
        "tomato",
      ],

      // October (Rabi Season Start)
      9: [
        "wheat",
        "barley",
        "rye",
        "chickpea",
        "lentil",
        "carrot",
        "radish",
        "spinach",
        "lettuce",
        "cabbage",
      ],

      // November (Rabi Season)
      10: [
        "wheat",
        "barley",
        "chickpea",
        "lentil",
        "peas",
        "carrot",
        "radish",
        "spinach",
        "lettuce",
        "mustard",
      ],

      // December (Winter Harvest)
      11: [
        "wheat",
        "barley",
        "rye",
        "peas",
        "carrot",
        "radish",
        "spinach",
        "lettuce",
        "mustard",
        "cabbage",
      ],
    };
  }

  /**
   * Build regional crop mapping (location -> crops)
   * Maps common Indian regions and their primary crops
   * @returns {Object} Location -> array of crop values
   */
  buildRegionalCropMap() {
    return {
      // Northern States
      punjab: ["wheat", "rice", "cotton", "sugarcane", "maize"],
      haryana: ["wheat", "rice", "cotton", "maize", "mustard"],
      "uttar pradesh": ["wheat", "rice", "sugar cane", "chickpea", "lentil"],
      "himachal pradesh": ["apple", "mango", "wheat", "rice", "potato"],
      jammu: ["rice", "maize", "wheat", "apple", "walnut"],
      kashmir: ["rice", "maize", "apple", "walnut", "saffron"],

      // Central States
      "madhya pradesh": ["wheat", "soybean", "cotton", "chickpea", "lentil"],
      chhattisgarh: ["rice", "cotton", "chickpea", "lentil"],

      // Eastern States
      bihar: ["rice", "wheat", "maize", "lentil", "chickpea"],
      "west bengal": ["rice", "jute", "wheat", "maize", "potato"],
      odisha: ["rice", "lentil", "groundnut", "cotton"],
      jharkhand: ["rice", "wheat", "maize", "cotton", "lentil"],

      // Southern States
      "tamil nadu": [
        "rice",
        "sugarcane",
        "groundnut",
        "cotton",
        "mango",
        "banana",
      ],
      karnataka: ["rice", "sugarcane", "cotton", "groundnut", "coffee"],
      telangana: ["rice", "groundnut", "cotton", "sugarcane", "turmeric"],
      "andhra pradesh": ["rice", "cotton", "groundnut", "sugarcane", "chili"],
      kerala: ["coconut", "banana", "pepper", "tea", "coffee"],

      // Western States
      maharashtra: ["sugarcane", "cotton", "groundnut", "soybean", "chickpea"],
      "guj arat": ["cotton", "groundnut", "tobacco", "sugarcane", "wheat"],
      rajasthan: ["wheat", "barley", "mustard", "groundnut", "millet"],
      goa: ["coconut", "arecanut", "banana", "rice"],
    };
  }
}

/**
 * Convenience function to get recommendations with default engine
 * @param {Object} userProfile - User profile
 * @param {Array} crops - All crops database
 * @param {number} limit - Max recommendations
 * @returns {Array} Recommended crops
 */
export function getRecommendedCrops(userProfile, crops, limit = 10) {
  const engine = new CropRecommendationEngine();
  return engine.getRecommendations(userProfile, crops, limit);
}
