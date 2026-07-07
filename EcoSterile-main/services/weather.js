/**
 * Weather Service
 * Fetches weather data from Open-Meteo API (free, no key required)
 */

export const weatherService = {
  /**
   * Get weather data for a location
   * Falls back to random weather if API fails
   */
  async getWeather(location) {
    try {
      // For demo purposes, use random weather immediately
      // In production, you can remove this and use the API calls below
      if (!location || location === "Not provided") {
        return this.generateRandomWeather("Demo Location");
      }

      // Try to geocode and fetch real weather
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          location
        )}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        console.log("Location not found, using random weather");
        return this.generateRandomWeather(location);
      }

      const { latitude, longitude } = geoData.results[0];

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&timezone=auto`
      );
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      return {
        success: true,
        temp: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        weatherCode: current.weather_code,
        description: this.getWeatherDescription(current.weather_code),
        icon: this.getWeatherIcon(current.weather_code),
        location: geoData.results[0].name,
      };
    } catch (error) {
      console.error("Weather API error, using random data:", error);
      return this.generateRandomWeather(location || "Demo Location");
    }
  },

  /**
   * Get weather description from WMO code
   */
  getWeatherDescription(code) {
    const descriptions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Thunderstorm with heavy hail",
    };
    return descriptions[code] || "Unknown";
  },

  /**
   * Get weather emoji icon from WMO code
   */
  getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code >= 51 && code <= 55) return "🌧️";
    if (code >= 61 && code <= 65) return "🌧️";
    if (code >= 71 && code <= 75) return "❄️";
    if (code >= 80 && code <= 82) return "⛈️";
    if (code >= 85 && code <= 86) return "🌨️";
    if (code >= 95) return "⛈️";
    return "🌤️";
  },

  /**
   * Generate random weather for fallback
   */
  generateRandomWeather(location = "Demo Location") {
    const conditions = [
      { icon: "☀️", description: "Clear" },
      { icon: "🌤️", description: "Partly Cloudy" },
      { icon: "☁️", description: "Cloudy" },
      { icon: "🌧️", description: "Rainy" },
      { icon: "⛈️", description: "Thunderstorm" },
    ];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = Math.floor(Math.random() * 20) + 15; // 15-35°C
    const humidity = Math.floor(Math.random() * 50) + 40; // 40-90%
    const windSpeed = Math.floor(Math.random() * 20) + 5; // 5-25 km/h

    return {
      success: true,
      temp,
      humidity,
      windSpeed,
      description: condition.description,
      icon: condition.icon,
      location: location,
    };
  },
};
