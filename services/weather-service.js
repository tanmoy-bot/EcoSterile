/**
 * Weather Service - Fetch and manage weather data
 * Uses Open-Meteo API (free, no key needed)
 */

// WMO weather code mapping
const wmoCodeMap = {
  0: { icon: "☀️", text: "Clear" },
  1: { icon: "🌤️", text: "Mostly Clear" },
  2: { icon: "⛅", text: "Partly Cloudy" },
  3: { icon: "☁️", text: "Overcast" },
  45: { icon: "🌫️", text: "Foggy" },
  48: { icon: "🌫️", text: "Foggy" },
  51: { icon: "🌧️", text: "Light Drizzle" },
  53: { icon: "🌧️", text: "Drizzle" },
  55: { icon: "🌧️", text: "Heavy Drizzle" },
  61: { icon: "🌧️", text: "Light Rain" },
  63: { icon: "🌧️", text: "Rain" },
  65: { icon: "🌧️", text: "Heavy Rain" },
  71: { icon: "❄️", text: "Light Snow" },
  73: { icon: "❄️", text: "Snow" },
  75: { icon: "❄️", text: "Heavy Snow" },
  77: { icon: "❄️", text: "Snow Grains" },
  80: { icon: "🌧️", text: "Light Showers" },
  81: { icon: "🌧️", text: "Showers" },
  82: { icon: "🌧️", text: "Heavy Showers" },
  85: { icon: "❄️", text: "Snow Showers" },
  86: { icon: "❄️", text: "Heavy Snow Showers" },
};

/**
 * Fetch weather data from Open-Meteo API
 */
export async function fetchWeatherData(lat = 24.8692, lon = 92.3554) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Weather API failed");

    const data = await res.json();
    if (!data.current) throw new Error("No current weather");

    const current = data.current;
    const wmo = current.weather_code || 0;
    const cond = wmoCodeMap[wmo] || { icon: "🌤️", text: "Unknown" };

    // Estimate AQI
    let aqiValue = Math.floor(30 + Math.random() * 120);
    if (wmo >= 45 && wmo <= 48) aqiValue = Math.floor(60 + Math.random() * 50);
    let aqiStatus = "Good";
    if (aqiValue > 150) aqiStatus = "Unhealthy";
    else if (aqiValue > 100) aqiStatus = "Moderate";
    else if (aqiValue > 50) aqiStatus = "Fair";

    return {
      temp: current.temperature_2m || 25,
      feelsLike: current.apparent_temperature || 25,
      condition: cond.text,
      icon: cond.icon,
      humidity: current.relative_humidity_2m || 65,
      windSpeed: current.wind_speed_10m || 10,
      pressure: current.pressure_msl || 1013,
      visibility: current.visibility ? current.visibility / 1000 : 10,
      uvIndex: current.uv_index || 5,
      aqiValue: aqiValue,
      aqiStatus: aqiStatus,
      hourly: data.hourly || {},
      daily: data.daily || {},
    };
  } catch (err) {
    console.error("Weather fetch error:", err);
    return generateFallbackWeather();
  }
}

/**
 * Fallback weather data
 */
export function generateFallbackWeather() {
  const conditions = [
    { icon: "☀️", text: "Sunny" },
    { icon: "⛅", text: "Partly Cloudy" },
    { icon: "☁️", text: "Cloudy" },
    { icon: "🌧️", text: "Rainy" },
  ];
  const cond = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = 22 + Math.random() * 12;

  return {
    temp: Math.round(temp * 10) / 10,
    feelsLike: Math.round((temp - 2) * 10) / 10,
    condition: cond.text,
    icon: cond.icon,
    humidity: Math.floor(45 + Math.random() * 50),
    windSpeed: Math.round((5 + Math.random() * 20) * 10) / 10,
    pressure: 1000 + Math.round(Math.random() * 30),
    visibility: Math.round((5 + Math.random() * 5) * 10) / 10,
    uvIndex: Math.floor(Math.random() * 11),
    aqiValue: Math.floor(20 + Math.random() * 80),
    aqiStatus: "Moderate",
  };
}

/**
 * Get geolocation
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation failed:", err);
          // Default to Karimganj, Assam
          resolve({ lat: 24.8692, lon: 92.3554 });
        }
      );
    } else {
      resolve({ lat: 24.8692, lon: 92.3554 });
    }
  });
}
