/**
 * cast — Weather Application Logic
 * Integrates Open-Meteo Weather API & Open-Meteo Geocoding API
 * Features Glassmorphism design and weather-responsive dynamic background glow.
 */

// ==========================================================================
// Application Configuration & State
// ==========================================================================
const CONFIG = {
  DEFAULT_LAT: 55.7558, // Moscow
  DEFAULT_LON: 37.6173,
  DEFAULT_CITY: "Москва",
  WEATHER_API_URL: "https://api.open-meteo.com/v1/forecast",
  GEOCODE_API_URL: "https://geocoding-api.open-meteo.com/v1/search"
};

const STATE = {
  currentLat: null,
  currentLon: null,
  currentCity: "",
  searchTimeout: null,
  activeCityBtn: null,
  editingCityId: null
};

// WMO weather code mapping to Russian descriptions, Lucide icons, and glow classes
const WEATHER_CODE_MAP = {
  0: { text: "Солнечно", icon: "sun", glow: "glow-sunny" },
  1: { text: "Преимущественно ясно", icon: "cloud-sun", glow: "glow-sunny" },
  2: { text: "Переменная облачность", icon: "cloud-sun", glow: "glow-cloudy" },
  3: { text: "Пасмурно", icon: "cloud", glow: "glow-cloudy" },
  45: { text: "Туман", icon: "cloud-fog", glow: "glow-cloudy" },
  48: { text: "Переохлажденный туман", icon: "cloud-fog", glow: "glow-cloudy" },
  51: { text: "Слабая морось", icon: "cloud-drizzle", glow: "glow-rainy" },
  53: { text: "Умеренная морось", icon: "cloud-drizzle", glow: "glow-rainy" },
  55: { text: "Плотная морось", icon: "cloud-drizzle", glow: "glow-rainy" },
  56: { text: "Слабая ледяная морось", icon: "snowflake", glow: "glow-snowy" },
  57: { text: "Плотная ледяная морось", icon: "snowflake", glow: "glow-snowy" },
  61: { text: "Слабый дождь", icon: "cloud-drizzle", glow: "glow-rainy" },
  63: { text: "Умеренный дождь", icon: "cloud-rain", glow: "glow-rainy" },
  65: { text: "Сильный дождь", icon: "cloud-rain", glow: "glow-rainy" },
  66: { text: "Слабый ледяной дождь", icon: "cloud-snow", glow: "glow-snowy" },
  67: { text: "Сильный ледяной дождь", icon: "cloud-snow", glow: "glow-snowy" },
  71: { text: "Слабый снегопад", icon: "snowflake", glow: "glow-snowy" },
  73: { text: "Умеренный снегопад", icon: "snowflake", glow: "glow-snowy" },
  75: { text: "Сильный снегопад", icon: "snowflake", glow: "glow-snowy" },
  77: { text: "Снежная крупа", icon: "snowflake", glow: "glow-snowy" },
  80: { text: "Слабый ливневый дождь", icon: "cloud-showers-heavy", glow: "glow-rainy" },
  81: { text: "Умеренный ливневый дождь", icon: "cloud-showers-heavy", glow: "glow-rainy" },
  82: { text: "Сильный ливневый дождь", icon: "cloud-showers-heavy", glow: "glow-rainy" },
  85: { text: "Слабый ливневый снег", icon: "cloud-snow", glow: "glow-snowy" },
  86: { text: "Сильный ливневый снег", icon: "cloud-snow", glow: "glow-snowy" },
  95: { text: "Гроза", icon: "cloud-lightning", glow: "glow-stormy" },
  96: { text: "Гроза со слабым градом", icon: "cloud-lightning", glow: "glow-stormy" },
  99: { text: "Гроза с сильным градом", icon: "cloud-lightning", glow: "glow-stormy" }
};

// ==========================================================================
// DOM Elements Cache
// ==========================================================================
const DOM = {
  body: document.body,
  searchInput: document.getElementById("search-input"),
  clearSearchBtn: document.getElementById("clear-search-btn"),
  searchSpinner: document.getElementById("search-spinner"),
  suggestionsList: document.getElementById("suggestions-list"),
  geoBtn: document.getElementById("geo-btn"),
  dashboard: document.getElementById("dashboard"),
  stateContainer: document.getElementById("state-container"),
  loadingState: document.getElementById("loading-state"),
  errorState: document.getElementById("error-state"),
  errorMessage: document.getElementById("error-message"),
  welcomeState: document.getElementById("welcome-state"),
  retryBtn: document.getElementById("retry-btn"),
  
  // Current Weather Cards elements
  currentCityName: document.getElementById("current-city-name"),
  currentDate: document.getElementById("current-date"),
  currentTemp: document.getElementById("current-temp"),
  currentConditionText: document.getElementById("current-condition-text"),
  heroWeatherIcon: document.getElementById("hero-weather-icon"),
  heroTempMin: document.getElementById("hero-temp-min"),
  heroTempMax: document.getElementById("hero-temp-max"),
  
  // Metrics details
  metricHumidity: document.getElementById("metric-humidity"),
  metricHumidityHint: document.getElementById("metric-humidity-hint"),
  metricWind: document.getElementById("metric-wind"),
  metricWindDir: document.getElementById("metric-wind-dir"),
  metricPrecipitation: document.getElementById("metric-precipitation"),
  metricPrecipitationHint: document.getElementById("metric-precipitation-hint"),
  metricPressure: document.getElementById("metric-pressure"),
  metricPressureHint: document.getElementById("metric-pressure-hint"),
  
  // Sunrise/Sunset details
  timeSunrise: document.getElementById("time-sunrise"),
  timeSunset: document.getElementById("time-sunset"),
  sunPosition: document.getElementById("sun-position"),
  
  // Forecast lists
  hourlyList: document.getElementById("hourly-list"),
  dailyList: document.getElementById("daily-list"),

  // Moon Cycle elements
  moonPhaseName: document.getElementById("moon-phase-name"),
  moonIllumination: document.getElementById("moon-illumination"),
  moonVisual: document.getElementById("moon-visual"),
  moonNextEventLabel: document.getElementById("moon-next-event-label"),
  moonNextEventValue: document.getElementById("moon-next-event-value"),

  // Modal elements
  editCityModal: document.getElementById("edit-city-modal"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  modalCancelBtn: document.getElementById("modal-cancel-btn"),
  modalSaveBtn: document.getElementById("modal-save-btn"),
  modalCityInput: document.getElementById("modal-city-input"),
  modalSpinner: document.getElementById("modal-spinner"),
  modalError: document.getElementById("modal-error")
};

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Returns weather properties (Russian description, Lucide icon name, glow class) based on WMO code
 */
function getWeatherDetails(code) {
  return WEATHER_CODE_MAP[code] || { text: "Неизвестно", icon: "help-circle", glow: "glow-cloudy" };
}

/**
 * Maps wind direction in degrees to Russian compass abbreviations
 */
function getWindDirection(deg) {
  const index = Math.round(deg / 45) % 8;
  const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
  return directions[index];
}

/**
 * Format timestamp array or ISO string into time representation (HH:MM)
 */
function formatTime(isoString) {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Smooth transition for body glow classes
 */
function updateGlowEffect(glowClass) {
  const glowClasses = ["glow-sunny", "glow-cloudy", "glow-rainy", "glow-snowy", "glow-stormy"];
  glowClasses.forEach(cls => {
    if (cls === glowClass) {
      DOM.body.classList.add(cls);
    } else {
      DOM.body.classList.remove(cls);
    }
  });
}

/**
 * Helper to display the right dashboard state
 */
function showState(state) {
  DOM.loadingState.classList.add("hidden");
  DOM.errorState.classList.add("hidden");
  DOM.welcomeState.classList.add("hidden");
  DOM.dashboard.classList.add("hidden");
  DOM.stateContainer.classList.add("hidden");

  if (state === "loading") {
    DOM.stateContainer.classList.remove("hidden");
    DOM.loadingState.classList.remove("hidden");
  } else if (state === "error") {
    DOM.stateContainer.classList.remove("hidden");
    DOM.errorState.classList.remove("hidden");
  } else if (state === "welcome") {
    DOM.stateContainer.classList.remove("hidden");
    DOM.welcomeState.classList.remove("hidden");
  } else if (state === "dashboard") {
    DOM.dashboard.classList.remove("hidden");
  }
}

// ==========================================================================
// API Operations
// ==========================================================================

/**
 * Performs reverse-geocoding request using OpenStreetMap Nominatim API
 * Falls back to "Моя геопозиция" on failure/rate limit
 */
async function getCityNameFromCoords(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`, {
      headers: { "Accept-Language": "ru" }
    });
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.suburb || address.county || "Моя геопозиция";
      return city;
    }
  } catch (e) {
    console.error("OSM Reverse Geocoding API failed, falling back.", e);
  }
  return "Моя геопозиция";
}

/**
 * Fetches and displays autocomplete suggestions from Open-Meteo Geocoding API
 */
async function fetchCitySuggestions(query) {
  if (!query || query.trim().length < 2) {
    DOM.suggestionsList.innerHTML = "";
    DOM.suggestionsList.classList.add("hidden");
    DOM.clearSearchBtn.classList.add("hidden");
    return;
  }

  DOM.clearSearchBtn.classList.remove("hidden");
  DOM.searchSpinner.classList.remove("hidden");

  try {
    const response = await fetch(`${CONFIG.GEOCODE_API_URL}?name=${encodeURIComponent(query)}&count=5&language=ru&format=json`);
    const data = await response.json();
    
    DOM.suggestionsList.innerHTML = "";
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(result => {
        const li = document.createElement("li");
        
        // Structure naming (e.g. City Name, Region / Country)
        const cityText = result.name;
        const regionText = [result.admin1, result.country].filter(Boolean).join(", ");
        
        // Highlight matching characters
        const queryRegex = new RegExp(`(${query})`, "gi");
        const highlightedCity = cityText.replace(queryRegex, `<span class="highlight">$1</span>`);
        
        li.innerHTML = `
          <span class="city-title">${highlightedCity}</span>
          <span class="country-subtitle">${regionText}</span>
        `;
        
        li.addEventListener("click", () => {
          DOM.searchInput.value = result.name;
          DOM.suggestionsList.classList.add("hidden");
          DOM.suggestionsList.innerHTML = "";
          deactivatePopularButtons();
          loadWeather(result.latitude, result.longitude, result.name);
        });
        
        DOM.suggestionsList.appendChild(li);
      });
      DOM.suggestionsList.classList.remove("hidden");
    } else {
      const li = document.createElement("li");
      li.innerHTML = `<span class="country-subtitle">Города не найдены</span>`;
      li.style.cursor = "default";
      DOM.suggestionsList.appendChild(li);
      DOM.suggestionsList.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Geocoding API error:", error);
  } finally {
    DOM.searchSpinner.classList.add("hidden");
  }
}

/**
 * Loads entire meteorological data for the given coordinates
 */
async function loadWeather(lat, lon, cityName) {
  STATE.currentLat = lat;
  STATE.currentLon = lon;
  STATE.currentCity = cityName;
  
  showState("loading");

  try {
    const response = await fetch(
      `${CONFIG.WEATHER_API_URL}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
      `&timezone=auto`
    );

    if (!response.ok) throw new Error("Weather request failed");

    const data = await response.json();
    renderWeather(data, cityName);
    showState("dashboard");
  } catch (error) {
    console.error("Error fetching weather:", error);
    DOM.errorMessage.textContent = "Не удалось связаться с сервером погоды. Проверьте соединение с интернетом.";
    showState("error");
  }
}

// ==========================================================================
// UI Rendering Operations
// ==========================================================================

/**
 * Orchestrates rendering of loaded weather data into all dashboard sections
 */
function renderWeather(data, cityName) {
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  const weatherDetails = getWeatherDetails(current.weather_code);

  // Update dynamic neon glow backdrop theme
  updateGlowEffect(weatherDetails.glow);

  // Apply warm weather theme overrides if temperature is 25°C or higher
  if (current.temperature_2m >= 25) {
    DOM.body.classList.add("temp-hot");
  } else {
    DOM.body.classList.remove("temp-hot");
  }

  // Update current date representation
  const dateObj = new Date(current.time);
  const formattedDate = dateObj.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  DOM.currentDate.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Update Hero elements
  DOM.currentCityName.textContent = cityName;
  DOM.currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  DOM.currentConditionText.textContent = weatherDetails.text;
  DOM.heroTempMin.textContent = `${Math.round(daily.temperature_2m_min[0])}°`;
  DOM.heroTempMax.textContent = `${Math.round(daily.temperature_2m_max[0])}°`;

  // Render hero icon with dynamic sizing attributes
  DOM.heroWeatherIcon.innerHTML = `<i data-lucide="${weatherDetails.icon}"></i>`;

  // Update Meteorological Metrics
  DOM.metricHumidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  DOM.metricHumidityHint.textContent = getHumidityHint(current.relative_humidity_2m);

  DOM.metricWind.textContent = `${current.wind_speed_10m.toFixed(1)} м/с`;
  DOM.metricWindDir.textContent = `Направление: ${getWindDirection(current.wind_direction_10m)} (${Math.round(current.wind_direction_10m)}°)`;

  DOM.metricPrecipitation.textContent = `${Math.round(hourly.precipitation_probability[0])}%`;
  DOM.metricPrecipitationHint.textContent = getPrecipitationHint(current.precipitation, current.weather_code);

  // Convert surface pressure from hPa to mm Hg
  const pressureMmHg = Math.round(current.surface_pressure * 0.750062);
  DOM.metricPressure.textContent = `${pressureMmHg} мм рт. ст.`;
  DOM.metricPressureHint.textContent = getPressureHint(pressureMmHg);

  // Update Sunrise / Sunset
  const sunriseStr = daily.sunrise[0];
  const sunsetStr = daily.sunset[0];
  DOM.timeSunrise.textContent = formatTime(sunriseStr);
  DOM.timeSunset.textContent = formatTime(sunsetStr);
  renderSunProgress(sunriseStr, sunsetStr, current.time);

  // Render Hourly & Daily forecasts
  renderHourlySlider(hourly, current.time);
  renderDailyForecast(daily);

  // Render Moon Cycle
  renderMoonCycle(current.time);

  // Re-instantiate Lucide icon elements
  lucide.createIcons();
}

/**
 * Renders the horizontal hourly forecast slider (next 24 hours)
 */
function renderHourlySlider(hourly, currentTimeStr) {
  DOM.hourlyList.innerHTML = "";
  
  // Find current hour index or start from index 0
  const currentHourDate = new Date(currentTimeStr);
  currentHourDate.setMinutes(0, 0, 0); // truncate minutes
  
  let startIndex = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const itemDate = new Date(hourly.time[i]);
    if (itemDate >= currentHourDate) {
      startIndex = i;
      break;
    }
  }

  // Generate cards for the next 24 hours
  for (let i = 0; i < 24; i++) {
    const index = startIndex + i;
    if (index >= hourly.time.length) break;

    const time = new Date(hourly.time[index]);
    const temp = Math.round(hourly.temperature_2m[index]);
    const code = hourly.weather_code[index];
    const pop = hourly.precipitation_probability[index];
    
    const details = getWeatherDetails(code);
    const hourLabel = i === 0 ? "Сейчас" : time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    const hourlyItem = document.createElement("div");
    hourlyItem.className = "hourly-item";
    
    let popHTML = "";
    if (pop > 10) {
      popHTML = `<span class="hourly-pop"><i data-lucide="droplet" style="width: 10px; height: 10px;"></i>${pop}%</span>`;
    }

    hourlyItem.innerHTML = `
      <span class="hourly-time">${hourLabel}</span>
      <div class="hourly-icon" title="${details.text}">
        <i data-lucide="${details.icon}"></i>
      </div>
      <span class="hourly-temp">${temp}°</span>
      ${popHTML}
    `;

    DOM.hourlyList.appendChild(hourlyItem);
  }
}

/**
 * Renders the vertical 5-day weather forecast column
 */
function renderDailyForecast(daily) {
  DOM.dailyList.innerHTML = "";

  // Loop through 5 days starting from index 0 (today)
  for (let i = 0; i < 5; i++) {
    if (i >= daily.time.length) break;

    const date = new Date(daily.time[i]);
    const tempMin = Math.round(daily.temperature_2m_min[i]);
    const tempMax = Math.round(daily.temperature_2m_max[i]);
    const code = daily.weather_code[i];
    const details = getWeatherDetails(code);

    let dayLabel = date.toLocaleDateString("ru-RU", { weekday: "short" });
    dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    
    let rowClass = "daily-row";
    if (i === 0) {
      dayLabel = "Сегодня";
      rowClass += " today";
    }

    const row = document.createElement("div");
    row.className = rowClass;
    row.innerHTML = `
      <span class="daily-day">${dayLabel}</span>
      <div class="daily-condition-col">
        <div class="daily-icon-wrapper" title="${details.text}">
          <i data-lucide="${details.icon}"></i>
        </div>
        <span class="daily-desc">${details.text}</span>
      </div>
      <div class="daily-temp-bar">
        <span class="temp-min">${tempMin}°</span>
        <span class="divider">/</span>
        <span class="temp-max">${tempMax}°</span>
      </div>
    `;

    DOM.dailyList.appendChild(row);
  }
}

/**
 * Places the sun position indicator dynamically on the semi-circular track
 */
function renderSunProgress(sunriseIso, sunsetIso, currentTimeIso) {
  const sunrise = new Date(sunriseIso).getTime();
  const sunset = new Date(sunsetIso).getTime();
  const current = new Date(currentTimeIso).getTime();

  if (current >= sunrise && current <= sunset) {
    const totalDaylight = sunset - sunrise;
    const progress = (current - sunrise) / totalDaylight; // 0 to 1

    // Semicircle arc mapping: theta from 0 (sunrise) to PI (sunset)
    const theta = progress * Math.PI;
    const xPercent = ((1 - Math.cos(theta)) / 2) * 100; // 0% to 100%
    const yPercent = Math.sin(theta) * 100; // 0% to 100% (height relative)

    DOM.sunPosition.style.left = `${xPercent}%`;
    DOM.sunPosition.style.bottom = `${yPercent}%`;
    DOM.sunPosition.style.opacity = "1";
  } else {
    // Hide sun indicator during night-time hours
    DOM.sunPosition.style.left = "0%";
    DOM.sunPosition.style.bottom = "0%";
    DOM.sunPosition.style.opacity = "0";
  }
}

// ==========================================================================
// Metric Helpers (Semantic descriptions in Russian)
// ==========================================================================

function getHumidityHint(humidity) {
  if (humidity < 30) return "Сухой воздух";
  if (humidity <= 60) return "Комфортный уровень";
  return "Повышенная влажность";
}

function getPrecipitationHint(precipitationValue, weatherCode) {
  if (precipitationValue > 0) {
    if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
      return "Идет снегопад";
    }
    return "Идет дождь";
  }
  return "Осадков не ожидается";
}

function getPressureHint(pressureMmHg) {
  if (pressureMmHg < 745) return "Низкое давление";
  if (pressureMmHg <= 765) return "Нормальное давление";
  return "Высокое давление";
}

// ==========================================================================
// Moon Cycle Calculation & Rendering
// ==========================================================================

/**
 * Calculates the current moon phase, illumination and next events based on synodic cycle.
 * Reference New Moon: Jan 6, 2000 18:14 UTC.
 * Synodic Month: 29.530588853 days.
 */
function calculateMoonPhase(dateString) {
  const date = new Date(dateString);
  const time = date.getTime();
  
  // Days since J2000.0 (January 1.5, 2000 UTC, which is January 1, 2000 12:00:00 UTC)
  const epochJ2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const d = (time - epochJ2000) / (1000 * 60 * 60 * 24);
  
  const rad = Math.PI / 180;
  
  // Moon mean longitude
  let L = (218.316 + 13.176396 * d) % 360;
  if (L < 0) L += 360;
  
  // Moon mean anomaly
  let M = (134.963 + 13.064993 * d) % 360;
  if (M < 0) M += 360;
  
  // Moon mean elongation
  let D = (297.850 + 12.190749 * d) % 360;
  if (D < 0) D += 360;
  
  // Sun mean anomaly
  let Ms = (357.529 + 0.985600 * d) % 360;
  if (Ms < 0) Ms += 360;
  
  // Moon longitude corrections (first 5 perturbation terms of Meeus Chapter 47)
  const l = L + 6.289 * Math.sin(M * rad) 
              - 1.274 * Math.sin((M - 2 * D) * rad) 
              + 0.658 * Math.sin(2 * D * rad) 
              + 0.214 * Math.sin(2 * M * rad) 
              - 0.186 * Math.sin(Ms * rad);
              
  // Sun longitude
  let F = (280.466 + 0.985647 * d) % 360;
  if (F < 0) F += 360;
  const sunLong = F + 1.915 * Math.sin(Ms * rad);
  
  // Elongation (Angle between Moon and Sun)
  let elongation = (l - sunLong) % 360;
  if (elongation < 0) elongation += 360;
  
  // Illumination percentage
  const illumination = Math.round((1 - Math.cos(elongation * rad)) / 2 * 100);
  
  // Phase fraction (0 to 1, where 0/1 is New Moon, 0.5 is Full Moon)
  const phaseFraction = elongation / 360;
  
  // Determine phase name in Russian
  let phaseName = "";
  if (phaseFraction < 0.03 || phaseFraction > 0.97) {
    phaseName = "Новолуние";
  } else if (phaseFraction < 0.22) {
    phaseName = "Растущий серп";
  } else if (phaseFraction < 0.28) {
    phaseName = "Первая четверть";
  } else if (phaseFraction < 0.47) {
    phaseName = "Растущая луна";
  } else if (phaseFraction < 0.53) {
    phaseName = "Полнолуние";
  } else if (phaseFraction < 0.72) {
    phaseName = "Убывающая луна";
  } else if (phaseFraction < 0.78) {
    phaseName = "Последняя четверть";
  } else {
    phaseName = "Стареющий серп";
  }
  
  // Days until next Full Moon and New Moon
  let daysToFull = 0;
  let daysToNew = 0;
  
  if (phaseFraction < 0.5) {
    daysToFull = (0.5 - phaseFraction) * 29.53059;
    daysToNew = (1.0 - phaseFraction) * 29.53059;
  } else {
    daysToFull = (1.5 - phaseFraction) * 29.53059;
    daysToNew = (1.0 - phaseFraction) * 29.53059;
  }
  
  // Calculate lunar day number (lunar day is synodic day index from 1 to 30)
  const moonDay = Math.floor(phaseFraction * 29.530588853) + 1;
  
  return {
    phase: phaseFraction,
    illumination: illumination,
    name: phaseName,
    moonDay: moonDay,
    daysToFull: Math.round(daysToFull),
    daysToNew: Math.round(daysToNew)
  };
}

function getMoonPhaseSVG(phase) {
  const r = 20; // radius
  const cx = 25; // center X
  const cy = 25; // center Y
  
  let d = "";
  const illuminationColor = "#fef08a"; // yellow-200
  const darkColor = "rgba(255, 255, 255, 0.08)";
  
  let svg = `<svg viewBox="0 0 50 50" width="48" height="48" style="filter: drop-shadow(0 0 6px rgba(254, 240, 138, 0.35))">`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${darkColor}" />`;
  
  if (phase <= 0.03 || phase >= 0.97) {
    // New Moon - no illumination overlay
  } else if (phase >= 0.47 && phase <= 0.53) {
    // Full Moon - full yellow circle
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${illuminationColor}" />`;
  } else {
    const isWaxing = phase < 0.5;
    
    // Determine the width of the semi-ellipse (terminator)
    let rx = r;
    if (isWaxing) {
      rx = Math.abs(r * (1 - 4 * phase));
    } else {
      rx = Math.abs(r * (1 - 4 * (phase - 0.5)));
    }
    
    if (phase < 0.25) {
      // Waxing Crescent: crescent on the right
      d = `M 25 5 A 20 20 0 0 1 25 45 A ${rx} 20 0 0 0 25 5`;
    } else if (phase < 0.5) {
      // Waxing Gibbous: gibbous on the right
      d = `M 25 5 A 20 20 0 0 1 25 45 A ${rx} 20 0 0 1 25 5`;
    } else if (phase < 0.75) {
      // Waning Gibbous: gibbous on the left
      d = `M 25 5 A 20 20 0 0 0 25 45 A ${rx} 20 0 0 0 25 5`;
    } else {
      // Waning Crescent: crescent on the left
      d = `M 25 5 A 20 20 0 0 0 25 45 A ${rx} 20 0 0 1 25 5`;
    }
    
    svg += `<path d="${d}" fill="${illuminationColor}" />`;
  }
  
  svg += `</svg>`;
  return svg;
}

/**
 * Updates the Moon Cycle card UI
 */
function renderMoonCycle(currentTimeStr) {
  const moonInfo = calculateMoonPhase(currentTimeStr);
  
  DOM.moonPhaseName.textContent = moonInfo.name;
  
  // Determine if moon is waxing (growing) or waning (shrinking)
  let growthTrend = "";
  if (moonInfo.phase <= 0.03 || moonInfo.phase >= 0.97) {
    growthTrend = "";
  } else if (moonInfo.phase >= 0.47 && moonInfo.phase <= 0.53) {
    growthTrend = "";
  } else if (moonInfo.phase < 0.5) {
    growthTrend = ", луна растет";
  } else {
    growthTrend = ", луна убывает";
  }
  
  DOM.moonIllumination.textContent = `Фаза: ${moonInfo.illumination}%${growthTrend}`;
  DOM.moonVisual.innerHTML = getMoonPhaseSVG(moonInfo.phase);
  
  DOM.moonNextEventLabel.textContent = "Лунный день";
  DOM.moonNextEventValue.textContent = `${moonInfo.moonDay}-й`;
}

// ==========================================================================
// Custom Editable Cities Helpers
// ==========================================================================
const DEFAULT_EDITABLE_CITIES = [
  { name: "Екатеринбург", lat: 56.8389, lon: 60.6057 },
  { name: "Владивосток", lat: 43.1198, lon: 131.8869 },
  { name: "Дубай", lat: 25.2048, lon: 55.2708 }
];

function loadCustomCities() {
  let customCities = localStorage.getItem("cast_custom_cities");
  if (customCities) {
    try {
      customCities = JSON.parse(customCities);
    } catch (e) {
      console.error("Failed to parse custom cities", e);
      customCities = null;
    }
  }
  
  if (!customCities || !Array.isArray(customCities) || customCities.length !== 3) {
    customCities = DEFAULT_EDITABLE_CITIES;
    localStorage.setItem("cast_custom_cities", JSON.stringify(customCities));
  }
  
  return customCities;
}

function renderEditableCityButtons() {
  const customCities = loadCustomCities();
  const editableButtons = document.querySelectorAll(".city-btn.editable");
  editableButtons.forEach(btn => {
    const id = parseInt(btn.getAttribute("data-id"));
    const cityData = customCities[id];
    if (cityData) {
      btn.setAttribute("data-city", cityData.name);
      btn.setAttribute("data-lat", cityData.lat);
      btn.setAttribute("data-lon", cityData.lon);
      
      const textSpan = btn.querySelector(".city-btn-text");
      if (textSpan) {
        textSpan.textContent = cityData.name;
      }
    }
  });
}

function openEditCityModal(id, cityName) {
  STATE.editingCityId = id;
  DOM.modalCityInput.value = cityName;
  DOM.modalError.classList.add("hidden");
  DOM.modalError.textContent = "";
  DOM.modalSpinner.classList.add("hidden");
  DOM.editCityModal.classList.remove("hidden");
  DOM.modalCityInput.focus();
  DOM.modalCityInput.select();
}

function closeEditCityModal() {
  STATE.editingCityId = null;
  DOM.editCityModal.classList.add("hidden");
}

function showModalError(message) {
  DOM.modalError.textContent = message;
  DOM.modalError.classList.remove("hidden");
}

// ==========================================================================
// Event Listeners & Initialization
// ==========================================================================

function deactivatePopularButtons() {
  if (STATE.activeCityBtn) {
    STATE.activeCityBtn.classList.remove("active");
    STATE.activeCityBtn = null;
  }
}

function initEventHandlers() {
  // Autocomplete search input
  DOM.searchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    clearTimeout(STATE.searchTimeout);
    
    if (query.trim().length === 0) {
      DOM.clearSearchBtn.classList.add("hidden");
      DOM.suggestionsList.innerHTML = "";
      DOM.suggestionsList.classList.add("hidden");
      return;
    }

    DOM.clearSearchBtn.classList.remove("hidden");
    STATE.searchTimeout = setTimeout(() => {
      fetchCitySuggestions(query);
    }, 400);
  });

  // Clear search input button
  DOM.clearSearchBtn.addEventListener("click", () => {
    DOM.searchInput.value = "";
    DOM.clearSearchBtn.classList.add("hidden");
    DOM.suggestionsList.innerHTML = "";
    DOM.suggestionsList.classList.add("hidden");
    DOM.searchInput.focus();
  });

  // Click outside autocomplete dropdown to close
  document.addEventListener("click", (e) => {
    if (!DOM.searchInput.contains(e.target) && !DOM.suggestionsList.contains(e.target)) {
      DOM.suggestionsList.classList.add("hidden");
    }
  });

  // Popular cities buttons click event
  const cityButtons = document.querySelectorAll(".city-btn");
  cityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      deactivatePopularButtons();
      
      btn.classList.add("active");
      STATE.activeCityBtn = btn;
      
      const city = btn.getAttribute("data-city");
      const lat = parseFloat(btn.getAttribute("data-lat"));
      const lon = parseFloat(btn.getAttribute("data-lon"));
      
      DOM.searchInput.value = ""; // Clear input
      DOM.clearSearchBtn.classList.add("hidden");
      DOM.suggestionsList.classList.add("hidden");
      
      loadWeather(lat, lon, city);
    });
  });

  // Geolocation button click event
  DOM.geoBtn.addEventListener("click", () => {
    deactivatePopularButtons();
    DOM.searchInput.value = "";
    DOM.clearSearchBtn.classList.add("hidden");
    DOM.suggestionsList.classList.add("hidden");

    showState("loading");

    if (!navigator.geolocation) {
      DOM.errorMessage.textContent = "Ваш браузер не поддерживает геолокацию.";
      showState("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        const cityName = await getCityNameFromCoords(lat, lon);
        loadWeather(lat, lon, cityName);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Не удалось получить доступ к местоположению.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Вы отклонили запрос на доступ к геолокации. Разрешите доступ в настройках браузера.";
        }
        DOM.errorMessage.textContent = errorMsg;
        showState("error");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  // Retry loading button on error state
  DOM.retryBtn.addEventListener("click", () => {
    if (STATE.currentLat !== null && STATE.currentLon !== null) {
      loadWeather(STATE.currentLat, STATE.currentLon, STATE.currentCity);
    } else {
      // If no search context, load default Moscow
      loadWeather(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LON, CONFIG.DEFAULT_CITY);
    }
  });

  // Edit City icon button click handler
  const editButtons = document.querySelectorAll(".edit-icon-btn");
  editButtons.forEach(editBtn => {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent loading weather for old city coordinates
      const parentBtn = editBtn.closest(".city-btn.editable");
      if (parentBtn) {
        const id = parseInt(parentBtn.getAttribute("data-id"));
        const cityName = parentBtn.getAttribute("data-city");
        openEditCityModal(id, cityName);
      }
    });
  });

  // Modal control buttons
  DOM.closeModalBtn.addEventListener("click", closeEditCityModal);
  DOM.modalCancelBtn.addEventListener("click", closeEditCityModal);
  DOM.editCityModal.addEventListener("click", (e) => {
    if (e.target === DOM.editCityModal) {
      closeEditCityModal();
    }
  });

  // Modal input enter key save
  DOM.modalCityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      DOM.modalSaveBtn.click();
    }
  });

  // Save changes modal button click handler
  DOM.modalSaveBtn.addEventListener("click", async () => {
    const cityName = DOM.modalCityInput.value.trim();
    if (!cityName) {
      showModalError("Пожалуйста, введите название города");
      return;
    }

    DOM.modalError.classList.add("hidden");
    DOM.modalSpinner.classList.remove("hidden");
    DOM.modalSaveBtn.disabled = true;

    try {
      const response = await fetch(`${CONFIG.GEOCODE_API_URL}?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`);
      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];

        // Save new values in localStorage custom cities array
        const customCities = loadCustomCities();
        customCities[STATE.editingCityId] = {
          name: result.name,
          lat: result.latitude,
          lon: result.longitude
        };
        localStorage.setItem("cast_custom_cities", JSON.stringify(customCities));

        // Update DOM buttons with new titles/attributes
        renderEditableCityButtons();

        // Close modal popup
        closeEditCityModal();

        // Find the newly edited button in DOM to trigger active state and load weather
        const editableButtons = document.querySelectorAll(".city-btn.editable");
        const updatedBtn = Array.from(editableButtons).find(
          btn => parseInt(btn.getAttribute("data-id")) === STATE.editingCityId
        );

        if (updatedBtn) {
          deactivatePopularButtons();
          updatedBtn.classList.add("active");
          STATE.activeCityBtn = updatedBtn;
          loadWeather(result.latitude, result.longitude, result.name);
        }
      } else {
        showModalError("Город не найден, проверьте написание");
      }
    } catch (e) {
      console.error("Modal geocoding error:", e);
      showModalError("Ошибка сети при поиске города");
    } finally {
      DOM.modalSpinner.classList.add("hidden");
      DOM.modalSaveBtn.disabled = false;
    }
  });
}

// ==========================================================================
// Application Bootstrapping
// ==========================================================================
function bootstrap() {
  // Load custom quick city button names from localStorage before initializing
  renderEditableCityButtons();
  
  initEventHandlers();
  
  // Set default initial load for Moscow and activate button
  const moscowBtn = document.querySelector('.city-btn[data-city="Москва"]');
  if (moscowBtn) {
    moscowBtn.classList.add("active");
    STATE.activeCityBtn = moscowBtn;
  }
  
  loadWeather(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LON, CONFIG.DEFAULT_CITY);
}

// Run bootstrap when DOM content is fully parsed
document.addEventListener("DOMContentLoaded", bootstrap);
