/**
 * cast — Weather Application Logic
 * Integrates Open-Meteo Weather API & Open-Meteo Geocoding API
 * Features Glassmorphism design and weather-responsive dynamic background glow.
 */

// ==========================================================================
// Application Configuration & State
// ==========================================================================
const CONFIG = {
  DEFAULT_LAT: 59.9139, // Oslo
  DEFAULT_LON: 10.7522,
  DEFAULT_CITY: "Осло",
  WEATHER_API_URL: "https://api.open-meteo.com/v1/forecast",
  GEOCODE_API_URL: "https://geocoding-api.open-meteo.com/v1/search"
};

const STATE = {
  currentLat: null,
  currentLon: null,
  currentCity: "",
  searchTimeout: null,
  activeCityBtn: null,
  editingCityId: null,
  currentLanguage: "ru"
};

// WMO weather code mapping to multi-language descriptions, Lucide icons, and glow classes
const WEATHER_CODE_MAP = {
  0: {
    translations: {
      ru: "Солнечно",
      en: "Sunny",
      no: "Solskinn",
      pl: "Słonecznie",
      uk: "Сонячно",
      be: "Сонечна"
    },
    icon: "sun",
    glow: "glow-sunny"
  },
  1: {
    translations: {
      ru: "Преимущественно ясно",
      en: "Mainly clear",
      no: "Hovedsakelig klart",
      pl: "Prawie bezchmurnie",
      uk: "Переважно ясно",
      be: "Пераважна ясна"
    },
    icon: "cloud-sun",
    glow: "glow-sunny"
  },
  2: {
    translations: {
      ru: "Переменная облачность",
      en: "Partly cloudy",
      no: "Delvis skyet",
      pl: "Zachmurzenie umiarkowane",
      uk: "Мінлива хмарність",
      be: "Пераменная воблачнасць"
    },
    icon: "cloud-sun",
    glow: "glow-cloudy"
  },
  3: {
    translations: {
      ru: "Пасмурно",
      en: "Overcast",
      no: "Overskyet",
      pl: "Całkowite zachmurzenie",
      uk: "Похмуро",
      be: "Пахмурна"
    },
    icon: "cloud",
    glow: "glow-cloudy"
  },
  45: {
    translations: {
      ru: "Туман",
      en: "Fog",
      no: "Tåke",
      pl: "Mgła",
      uk: "Туман",
      be: "Туман"
    },
    icon: "cloud-fog",
    glow: "glow-cloudy"
  },
  48: {
    translations: {
      ru: "Переохлажденный туман",
      en: "Depositing rime fog",
      no: "Rimtåke",
      pl: "Mgła osadzająca szadź",
      uk: "Памаразь",
      be: "Туман з памараззю"
    },
    icon: "cloud-fog",
    glow: "glow-cloudy"
  },
  51: {
    translations: {
      ru: "Слабая морось",
      en: "Light drizzle",
      no: "Lett yr",
      pl: "Słaba mżawka",
      uk: "Слабка мжичка",
      be: "Слабая імжа"
    },
    icon: "cloud-drizzle",
    glow: "glow-rainy"
  },
  53: {
    translations: {
      ru: "Умеренная морось",
      en: "Moderate drizzle",
      no: "Moderat yr",
      pl: "Umiarkowana mżawka",
      uk: "Помірна мжичка",
      be: "Умераная імжа"
    },
    icon: "cloud-drizzle",
    glow: "glow-rainy"
  },
  55: {
    translations: {
      ru: "Плотная морось",
      en: "Dense drizzle",
      no: "Tett yr",
      pl: "Intensywna mżawka",
      uk: "Густа мжичка",
      be: "Шчыльная імжа"
    },
    icon: "cloud-drizzle",
    glow: "glow-rainy"
  },
  56: {
    translations: {
      ru: "Слабая ледяная морось",
      en: "Light freezing drizzle",
      no: "Lett frysende yr",
      pl: "Słaba marznąca mżawka",
      uk: "Слабка крижана мжичка",
      be: "Слабая ледзяная імжа"
    },
    icon: "snowflake",
    glow: "glow-snowy"
  },
  57: {
    translations: {
      ru: "Плотная ледяная морось",
      en: "Dense freezing drizzle",
      no: "Tett frysende yr",
      pl: "Intensywna marznąca mżawka",
      uk: "Густа крижана мжичка",
      be: "Шчыльная ледзяная імжа"
    },
    icon: "snowflake",
    glow: "glow-snowy"
  },
  61: {
    translations: {
      ru: "Слабый дождь",
      en: "Light rain",
      no: "Lett regn",
      pl: "Słaby deszcz",
      uk: "Слабкий дощ",
      be: "Слабы дождж"
    },
    icon: "cloud-drizzle",
    glow: "glow-rainy"
  },
  63: {
    translations: {
      ru: "Умеренный дождь",
      en: "Moderate rain",
      no: "Moderat regn",
      pl: "Umiarkowany deszcz",
      uk: "Помірний дощ",
      be: "Умераны дождж"
    },
    icon: "cloud-rain",
    glow: "glow-rainy"
  },
  65: {
    translations: {
      ru: "Сильный дождь",
      en: "Heavy rain",
      no: "Kraftig regn",
      pl: "Silny deszcz",
      uk: "Сильний дощ",
      be: "Моцны дождж"
    },
    icon: "cloud-rain",
    glow: "glow-rainy"
  },
  66: {
    translations: {
      ru: "Слабый ледяной дождь",
      en: "Light freezing rain",
      no: "Lett underkjølt regn",
      pl: "Słaby marznący deszcz",
      uk: "Слабкий крижаний дощ",
      be: "Слабы ледзяны дождж"
    },
    icon: "cloud-snow",
    glow: "glow-snowy"
  },
  67: {
    translations: {
      ru: "Сильный ледяной дождь",
      en: "Heavy freezing rain",
      no: "Kraftig underkjølt regn",
      pl: "Silny marznący deszcz",
      uk: "Сильний крижаний дощ",
      be: "Моцны ледзяны дождж"
    },
    icon: "cloud-snow",
    glow: "glow-snowy"
  },
  71: {
    translations: {
      ru: "Слабый снегопад",
      en: "Light snow fall",
      no: "Lett snøfall",
      pl: "Słabe opady śniegu",
      uk: "Слабкий снігопад",
      be: "Слабы снегапад"
    },
    icon: "snowflake",
    glow: "glow-snowy"
  },
  73: {
    translations: {
      ru: "Умеренный снегопад",
      en: "Moderate snow fall",
      no: "Moderat snøfall",
      pl: "Umiarkowane opady śniegu",
      uk: "Помірний снігопад",
      be: "Умераны снегапад"
    },
    icon: "snowflake",
    glow: "glow-snowy"
  },
  75: {
    translations: {
      ru: "Сильный снегопад",
      en: "Heavy snow fall",
      no: "Kraftig snøfall",
      pl: "Silne opady śniegu",
      uk: "Сильний снігопад",
      be: "Моцны снегапад"
    },
    icon: "snowflake",
    glow: "glow-snowy"
  },
  77: {
    translations: {
      ru: "Снежная крупа",
      en: "Snow grains",
      no: "Snøkorn",
      pl: "Śnieg ziarnisty",
      uk: "Снігова крупа",
      be: "Снежная крупа"
    },
    icon: "snowflake",
    glow: "glow-snowy"
  },
  80: {
    translations: {
      ru: "Слабый ливневый дождь",
      en: "Light rain showers",
      no: "Lette regnbyger",
      pl: "Słaby przelotny deszcz",
      uk: "Слабкий зливовий дощ",
      be: "Слабы ліўневы дождж"
    },
    icon: "cloud-showers-heavy",
    glow: "glow-rainy"
  },
  81: {
    translations: {
      ru: "Умеренный ливневый дождь",
      en: "Moderate rain showers",
      no: "Moderate regnbyger",
      pl: "Umiarkowany przelotny deszcz",
      uk: "Помірний зливовий дощ",
      be: "Умераны ліўневы дождж"
    },
    icon: "cloud-showers-heavy",
    glow: "glow-rainy"
  },
  82: {
    translations: {
      ru: "Сильный ливневый дождь",
      en: "Heavy rain showers",
      no: "Kraftige regnbyger",
      pl: "Silny przelotny deszcz",
      uk: "Сильний зливовий дощ",
      be: "Моцны ліўневы дождж"
    },
    icon: "cloud-showers-heavy",
    glow: "glow-rainy"
  },
  85: {
    translations: {
      ru: "Слабый ливневый снег",
      en: "Light snow showers",
      no: "Lette snøbyger",
      pl: "Słaby przelotny śnieg",
      uk: "Слабкий зливовий сніг",
      be: "Слабы ліўневы снег"
    },
    icon: "cloud-snow",
    glow: "glow-snowy"
  },
  86: {
    translations: {
      ru: "Сильный ливневый снег",
      en: "Heavy snow showers",
      no: "Kraftige snøbyger",
      pl: "Silny przelotny śnieg",
      uk: "Сильний зливовий сніг",
      be: "Моцны ліўневы снег"
    },
    icon: "cloud-snow",
    glow: "glow-snowy"
  },
  95: {
    translations: {
      ru: "Гроза",
      en: "Thunderstorm",
      no: "Tordenvær",
      pl: "Burza",
      uk: "Гроза",
      be: "Навальніца"
    },
    icon: "cloud-lightning",
    glow: "glow-stormy"
  },
  96: {
    translations: {
      ru: "Гроза со слабым градом",
      en: "Thunderstorm with light hail",
      no: "Tordenvær med lett hagl",
      pl: "Burza z lekkim gradem",
      uk: "Гроза з легким градом",
      be: "Навальніца са слабым градам"
    },
    icon: "cloud-lightning",
    glow: "glow-stormy"
  },
  99: {
    translations: {
      ru: "Гроза с сильным градом",
      en: "Thunderstorm with heavy hail",
      no: "Tordenvær med kraftig hagl",
      pl: "Burza z silnym gradem",
      uk: "Гроза з сильним градом",
      be: "Навальніца з моцным градам"
    },
    icon: "cloud-lightning",
    glow: "glow-stormy"
  }
};

const TRANSLATIONS = {
  ru: {
    placeholder: "Поиск города...",
    geoBtn: "Моя геопозиция",
    forecastTitle: "Прогноз на 5 дней",
    hourlyForecastTitle: "Почасовой прогноз погоды",
    humidity: "Влажность",
    humidityComfort: "Комфортный уровень",
    humidityDry: "Сухой воздух",
    humidityWet: "Повышенная влажность",
    wind: "Ветер",
    windDirection: "Направление",
    windSpeedUnit: "м/с",
    precipitation: "Вероятность осадков",
    precipNone: "Без осадков",
    precipRain: "Идет дождь",
    precipSnow: "Идет снегопад",
    precipMixed: "Смешанные осадки",
    pressure: "Давление",
    pressureUnit: "мм рт. ст.",
    pressureNormal: "Нормальное давление",
    pressureHigh: "Высокое давление",
    pressureLow: "Низкое давление",
    sunCycle: "Солнечный цикл",
    sunrise: "Восход",
    sunset: "Закат",
    moonCycle: "Лунный цикл",
    moonIllumination: "Фаза",
    lunarDay: "Лунный день",
    minLabel: "Мин:",
    maxLabel: "Макс:",
    loadingText: "Получаем метеоданные...",
    errorTitle: "Упс! Произошла ошибка",
    errorText: "Не удалось загрузить данные о погоде.",
    retryText: "Повторить попытку",
    welcomeTitle: "Добро пожаловать в cast",
    welcomeText: "Выберите город из списка популярных выше или воспользуйтесь поиском, чтобы увидеть подробную метеосводку с атмосферным фоновым свечением.",
    footerText: "&copy; 2026 cast. Разработано с использованием данных Open-Meteo API.",
    modalTitle: "Редактировать город",
    modalInputLabel: "Название города",
    modalPlaceholder: "Например: Рига",
    modalSave: "Сохранить",
    modalCancel: "Отмена",
    editTooltip: "Редактировать город",
    errorEmptyInput: "Пожалуйста, введите название города",
    errorGeocode: "Город не найден, проверьте написание",
    errorModalNetwork: "Ошибка сети при поиске города",
    today: "Сегодня",
    now: "Сейчас",
    errorNetwork: "Не удалось связаться с сервером погоды. Проверьте соединение с интернетом."
  },
  en: {
    placeholder: "Search city...",
    geoBtn: "My Location",
    forecastTitle: "5-Day Forecast",
    hourlyForecastTitle: "Hourly Weather Forecast",
    humidity: "Humidity",
    humidityComfort: "Comfortable level",
    humidityDry: "Dry air",
    humidityWet: "High humidity",
    wind: "Wind",
    windDirection: "Direction",
    windSpeedUnit: "m/s",
    precipitation: "Precipitation probability",
    precipNone: "No precipitation expected",
    precipRain: "Raining",
    precipSnow: "Snowing",
    precipMixed: "Mixed precipitation",
    pressure: "Pressure",
    pressureUnit: "mm Hg",
    pressureNormal: "Normal pressure",
    pressureHigh: "High pressure",
    pressureLow: "Low pressure",
    sunCycle: "Sun Cycle",
    sunrise: "Sunrise",
    sunset: "Sunset",
    moonCycle: "Moon Cycle",
    moonIllumination: "Phase",
    lunarDay: "Lunar day",
    minLabel: "Min:",
    maxLabel: "Max:",
    loadingText: "Fetching weather data...",
    errorTitle: "Oops! Something went wrong",
    errorText: "Failed to load weather data.",
    retryText: "Try again",
    welcomeTitle: "Welcome to cast",
    welcomeText: "Select a city from the list above or use search to view detailed weather info with atmospheric background glow.",
    footerText: "&copy; 2026 cast. Developed using Open-Meteo API data.",
    modalTitle: "Edit City",
    modalInputLabel: "City Name",
    modalPlaceholder: "e.g. Riga",
    modalSave: "Save",
    modalCancel: "Cancel",
    editTooltip: "Edit city",
    errorEmptyInput: "Please enter city name",
    errorGeocode: "City not found, check spelling",
    errorModalNetwork: "Network error searching city",
    today: "Today",
    now: "Now",
    errorNetwork: "Failed to connect to the weather server. Please check your internet connection."
  },
  no: {
    placeholder: "Søk etter sted...",
    geoBtn: "Min posisjon",
    forecastTitle: "5-dagers varsel",
    hourlyForecastTitle: "Timeliste",
    humidity: "Luftfuktighet",
    humidityComfort: "Komfortabelt nivå",
    humidityDry: "Tørr luft",
    humidityWet: "Høy fuktighet",
    wind: "Vind",
    windDirection: "Retning",
    windSpeedUnit: "m/s",
    precipitation: "Sannsynlighet for nedbør",
    precipNone: "Ingen nedbør ventet",
    precipRain: "Det regner",
    precipSnow: "Det snør",
    precipMixed: "Blandet nedbør",
    pressure: "Lufttrykk",
    pressureUnit: "mm Hg",
    pressureNormal: "Normalt lufttrykk",
    pressureHigh: "Høyt lufttrykk",
    pressureLow: "Lavt lufttrykk",
    sunCycle: "Solens syklus",
    sunrise: "Soloppgang",
    sunset: "Solnedgang",
    moonCycle: "Månesyklus",
    moonIllumination: "Fase",
    lunarDay: "Månedag",
    minLabel: "Min:",
    maxLabel: "Maks:",
    loadingText: "Henter værdata...",
    errorTitle: "Oi! Noe gikk galt",
    errorText: "Kunne ikke hente værdata.",
    retryText: "Prøv igjen",
    welcomeTitle: "Velkommen til cast",
    welcomeText: "Velg en by fra listen ovenfor eller søk for å se detaljert værvarsel med atmosfærisk bakgrunnsglød.",
    footerText: "&copy; 2026 cast. Utviklet med data fra Open-Meteo API.",
    modalTitle: "Rediger by",
    modalInputLabel: "Bynavn",
    modalPlaceholder: "f.eks. Riga",
    modalSave: "Lagre",
    modalCancel: "Avbryt",
    editTooltip: "Rediger by",
    errorEmptyInput: "Vennligst skriv inn bynavn",
    errorGeocode: "Byen ble ikke funnet, sjekk skrivemåten",
    errorModalNetwork: "Nettverksfeil under søk",
    today: "I dag",
    now: "Nå",
    errorNetwork: "Kunne ikke koble til værtjenesten. Vennligst sjekk internettforbindelsen."
  },
  pl: {
    placeholder: "Szukaj miasta...",
    geoBtn: "Moja lokalizacja",
    forecastTitle: "Prognoza 5-dniowa",
    hourlyForecastTitle: "Prognoza godzinowa",
    humidity: "Wilgotność",
    humidityComfort: "Komfortowy poziom",
    humidityDry: "Suche powietrze",
    humidityWet: "Wysoka wilgotność",
    wind: "Wiatr",
    windDirection: "Kierunek",
    windSpeedUnit: "m/s",
    precipitation: "Szansa opadów",
    precipNone: "Brak opadów",
    precipRain: "Pada deszcz",
    precipSnow: "Pada śnieg",
    precipMixed: "Opady mieszane",
    pressure: "Ciśnienie",
    pressureUnit: "mm Hg",
    pressureNormal: "Normalne ciśnienie",
    pressureHigh: "Wysokie ciśnienie",
    pressureLow: "Niskie ciśnienie",
    sunCycle: "Cykl słoneczny",
    sunrise: "Wschód",
    sunset: "Zachód",
    moonCycle: "Cykl Księżyca",
    moonIllumination: "Faza",
    lunarDay: "Dzień księżycowy",
    minLabel: "Min:",
    maxLabel: "Max:",
    loadingText: "Pobieranie danych...",
    errorTitle: "Ups! Coś poszło nie tak",
    errorText: "Nie udało się pobrać danych pogodowych.",
    retryText: "Spróbuj ponownie",
    welcomeTitle: "Witamy w cast",
    welcomeText: "Wybierz miasto z listy powyżej lub użyj wyszukiwarki, aby zobaczyć szczegółową prognozę pogody z klimatycznym podświetleniem tła.",
    footerText: "&copy; 2026 cast. Opracowano przy użyciu danych Open-Meteo API.",
    modalTitle: "Edytuj miasto",
    modalInputLabel: "Nazwa miasta",
    modalPlaceholder: "np. Ryga",
    modalSave: "Zapisz",
    modalCancel: "Anuluj",
    editTooltip: "Edytuj miasto",
    errorEmptyInput: "Wpisz nazwę miasta",
    errorGeocode: "Nie znaleziono miasta, sprawdź pisownię",
    errorModalNetwork: "Błąd sieci podczas wyszukiwania miasta",
    today: "Dzisiaj",
    now: "Teraz",
    errorNetwork: "Nie udało się połączyć z serwerem pogodowym. Sprawdź swoje połączenie internetowe."
  },
  uk: {
    placeholder: "Пошук міста...",
    geoBtn: "Моя геопозиція",
    forecastTitle: "Прогноз на 5 днів",
    hourlyForecastTitle: "Погодинний прогноз погоди",
    humidity: "Вологість",
    humidityComfort: "Комфортний рівень",
    humidityDry: "Сухе повітря",
    humidityWet: "Висока вологість",
    wind: "Вітер",
    windDirection: "Напрямок",
    windSpeedUnit: "м/с",
    precipitation: "Ймовірність опадів",
    precipNone: "Опадів не очікується",
    precipRain: "Йде дощ",
    precipSnow: "Йде сніг",
    precipMixed: "Змішані опади",
    pressure: "Тиск",
    pressureUnit: "мм рт. ст.",
    pressureNormal: "Нормальний тиск",
    pressureHigh: "Високий тиск",
    pressureLow: "Низький тиск",
    sunCycle: "Сонячний цикл",
    sunrise: "Схід",
    sunset: "Захід",
    moonCycle: "Місячний цикл",
    moonIllumination: "Фаза",
    lunarDay: "Місячний день",
    minLabel: "Мін:",
    maxLabel: "Макс:",
    loadingText: "Отримуємо метеодані...",
    errorTitle: "Упс! Сталася помилка",
    errorText: "Не вдалося завантажити дані про погоду.",
    retryText: "Повторити спробу",
    welcomeTitle: "Ласкаво просимо до cast",
    welcomeText: "Виберіть місто зі списку популярних вище або скористайтеся пошуком, щоб побачити детальний метеопрогноз з атмосферним фоновим світінням.",
    footerText: "&copy; 2026 cast. Розроблено з використанням даних Open-Meteo API.",
    modalTitle: "Редагувати місто",
    modalInputLabel: "Назва міста",
    modalPlaceholder: "Наприклад: Рига",
    modalSave: "Зберегти",
    modalCancel: "Скасувати",
    editTooltip: "Редагувати місто",
    errorEmptyInput: "Будь ласка, введіть назву міста",
    errorGeocode: "Місто не знайдено, перевірте написання",
    errorModalNetwork: "Помилка мережі при пошуку міста",
    today: "Сьогодні",
    now: "Зараз",
    errorNetwork: "Не вдалося з'єднатися з сервером погоди. Перевірте підключення до інтернету."
  },
  be: {
    placeholder: "Пошук горада...",
    geoBtn: "Мая геапазіцыя",
    forecastTitle: "Прагноз на 5 дзён",
    hourlyForecastTitle: "Пагадзінны прагноз надвор'я",
    humidity: "Вільготнасць",
    humidityComfort: "Камфортны ўзровень",
    humidityDry: "Сухое паветра",
    humidityWet: "Высокая вільготнасць",
    wind: "Вецер",
    windDirection: "Напрамак",
    windSpeedUnit: "м/с",
    precipitation: "Верагоднасць ападаў",
    precipNone: "Ападаў не чакаецца",
    precipRain: "Ідзе дождж",
    precipSnow: "Ідзе снег",
    precipMixed: "Змешаныя ападкі",
    pressure: "Ціск",
    pressureUnit: "мм рт. ст.",
    pressureNormal: "Нармальны ціск",
    pressureHigh: "Высокі ціск",
    pressureLow: "Нізкі ціск",
    sunCycle: "Сонечны цыкл",
    sunrise: "Усход",
    sunset: "Захад",
    moonCycle: "Месяцавы цыкл",
    moonIllumination: "Фаза",
    lunarDay: "Месяцавы дзень",
    minLabel: "Мін:",
    maxLabel: "Макс:",
    loadingText: "Атрымліваем метеоданныя...",
    errorTitle: "Упс! Здарылася памылка",
    errorText: "Не ўдалося загрузіць дадзеныя аб надвор'і.",
    retryText: "Паўтарыць спробу",
    welcomeTitle: "Сардэчна запрашаем у cast",
    welcomeText: "Виберыце горад са спісу папулярных вышэй або скарыстайцеся пошукам, каб убачыць падрабязную метеозводку з атмасферным фонавым свячэннем.",
    footerText: "&copy; 2026 cast. Распрацавана з выкарыстаннем дадзеных Open-Meteo API.",
    modalTitle: "Рэдагаваць горад",
    modalInputLabel: "Назва горада",
    modalPlaceholder: "Напрыклад: Рыга",
    modalSave: "Захаваць",
    modalCancel: "Адмена",
    editTooltip: "Рэдагаваць горад",
    errorEmptyInput: "Калі ласка, увядзіце назву горада",
    errorGeocode: "Горад не знойдзены, праверце напісанне",
    errorModalNetwork: "Памылка сеткі пры пошуку горада",
    today: "Сёння",
    now: "Зараз",
    errorNetwork: "Не ўдалося звязацца з серверам надвор'я. Праверце падключэнне да інтэрнэту."
  }
}
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
  modalError: document.getElementById("modal-error"),
  langSelect: document.getElementById("lang-select")
};

// ==========================================================================
// Helper Functions
// ==========================================================================

function getLocaleString(lang) {
  const mapping = {
    ru: "ru-RU",
    en: "en-US",
    no: "no-NO",
    pl: "pl-PL",
    uk: "uk-UA",
    be: "be-BY"
  };
  return mapping[lang] || "ru-RU";
}

/**
 * Returns weather properties (localized description, Lucide icon name, glow class) based on WMO code
 */
function getWeatherDetails(code) {
  const details = WEATHER_CODE_MAP[code] || { translations: { ru: "Неизвестно" }, icon: "help-circle", glow: "glow-cloudy" };
  const text = details.translations[STATE.currentLanguage] || details.translations["ru"] || "Unknown";
  return { text, icon: details.icon, glow: details.glow };
}

/**
 * Maps wind direction in degrees to localized compass abbreviations
 */
function getWindDirection(deg) {
  const index = Math.round(deg / 45) % 8;
  const directions = {
    ru: ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"],
    en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    no: ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"],
    pl: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    uk: ["Пн", "Пн-Сх", "Сх", "Пд-Сх", "Пд", "Пд-Зх", "Зх", "Пн-Зх"],
    be: ["Пн", "Пн-Усх", "Усх", "Пд-Усх", "Пд", "Пд-Зах", "Зах", "Пн-Зах"]
  };
  const list = directions[STATE.currentLanguage] || directions["ru"];
  return list[index];
}

/**
 * Format timestamp array or ISO string into time representation (HH:MM)
 */
function formatTime(isoString) {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString(getLocaleString(STATE.currentLanguage), { hour: "2-digit", minute: "2-digit" });
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
  const fallbackCity = (TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"]).geoBtn;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${STATE.currentLanguage}`, {
      headers: { "Accept-Language": STATE.currentLanguage }
    });
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.suburb || address.county || fallbackCity;
      return city;
    }
  } catch (e) {
    console.error("OSM Reverse Geocoding API failed, falling back.", e);
  }
  return fallbackCity;
}

/**
 * Autocomplete city search
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
    const response = await fetch(`${CONFIG.GEOCODE_API_URL}?name=${encodeURIComponent(query)}&count=5&language=${STATE.currentLanguage}&format=json`);
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
    const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
    DOM.errorMessage.textContent = t.errorNetwork;
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
  const formattedDate = dateObj.toLocaleDateString(getLocaleString(STATE.currentLanguage), {
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

  const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
  DOM.metricWind.textContent = `${current.wind_speed_10m.toFixed(1)} ${t.windSpeedUnit}`;
  DOM.metricWindDir.textContent = `${t.windDirection}: ${getWindDirection(current.wind_direction_10m)} (${Math.round(current.wind_direction_10m)}°)`;

  DOM.metricPrecipitation.textContent = `${Math.round(hourly.precipitation_probability[0])}%`;
  DOM.metricPrecipitationHint.textContent = getPrecipitationHint(current.precipitation, current.weather_code);

  // Convert surface pressure from hPa to mm Hg
  const pressureMmHg = Math.round(current.surface_pressure * 0.750062);
  DOM.metricPressure.textContent = `${pressureMmHg} ${t.pressureUnit}`;
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
    const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
    const hourLabel = i === 0 ? t.now : time.toLocaleTimeString(getLocaleString(STATE.currentLanguage), { hour: "2-digit", minute: "2-digit" });

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

    let dayLabel = date.toLocaleDateString(getLocaleString(STATE.currentLanguage), { weekday: "short" });
    dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    
    let rowClass = "daily-row";
    if (i === 0) {
      const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
      dayLabel = t.today;
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
  const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
  if (humidity < 30) return t.humidityDry;
  if (humidity <= 60) return t.humidityComfort;
  return t.humidityWet;
}

function getPrecipitationHint(precipitationValue, weatherCode) {
  const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
  if (precipitationValue > 0) {
    if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
      return t.precipSnow;
    }
    return t.precipRain;
  }
  return t.precipNone;
}

function getPressureHint(pressureMmHg) {
  const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
  if (pressureMmHg < 745) return t.pressureLow;
  if (pressureMmHg <= 765) return t.pressureNormal;
  return t.pressureHigh;
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
  
  // Determine phase name based on active language
  const phaseTranslations = {
    newMoon: { ru: "Новолуние", en: "New Moon", no: "Nymåne", pl: "Nów", uk: "Новий місяць", be: "Маладзік" },
    waxingCrescent: { ru: "Растущий серп", en: "Waxing Crescent", no: "Voksende sigd", pl: "Przyrastający sierp", uk: "Молодий місяць", be: "Нарастаячы серп" },
    firstQuarter: { ru: "Первая четверть", en: "First Quarter", no: "Første kvarter", pl: "Pierwsza kwadra", uk: "Перша чверть", be: "Першая чвэрць" },
    waxingGibbous: { ru: "Растущая луна", en: "Waxing Gibbous", no: "Voksende måne", pl: "Przyrastający księżyc", uk: "Зростаючий місяць", be: "Нарастаячы месяц" },
    fullMoon: { ru: "Полнолуние", en: "Full Moon", no: "Fullmåne", pl: "Pełnia", uk: "Повний місяць", be: "Поўня" },
    waningGibbous: { ru: "Убывающая луна", en: "Waning Gibbous", no: "Minkende måne", pl: "Ubywający księżyc", uk: "Спадаючий місяць", be: "Спадаючы месяц" },
    lastQuarter: { ru: "Последняя четверть", en: "Last Quarter", no: "Siste kvarter", pl: "Ostatnia kwadra", uk: "Остання чверть", be: "Апошняя чвэрць" },
    waningCrescent: { ru: "Стареющий серп", en: "Waning Crescent", no: "Minkende sigd", pl: "Ubywający sierp", uk: "Старий місяць", be: "Спадаючы серп" }
  };
  
  let key = "";
  if (phaseFraction < 0.03 || phaseFraction > 0.97) {
    key = "newMoon";
  } else if (phaseFraction < 0.22) {
    key = "waxingCrescent";
  } else if (phaseFraction < 0.28) {
    key = "firstQuarter";
  } else if (phaseFraction < 0.47) {
    key = "waxingGibbous";
  } else if (phaseFraction < 0.53) {
    key = "fullMoon";
  } else if (phaseFraction < 0.72) {
    key = "waningGibbous";
  } else if (phaseFraction < 0.78) {
    key = "lastQuarter";
  } else {
    key = "waningCrescent";
  }
  
  const phaseName = phaseTranslations[key][STATE.currentLanguage] || phaseTranslations[key]["ru"];
  
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

function getLunarDayString(day, lang) {
  if (lang === "ru" || lang === "uk" || lang === "be") {
    return `${day}-й`;
  }
  if (lang === "en") {
    const s = ["th", "st", "nd", "rd"];
    const v = day % 100;
    return day + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  if (lang === "no" || lang === "pl") {
    return `${day}.`;
  }
  return day;
}

/**
 * Updates the Moon Cycle card UI
 */
function renderMoonCycle(currentTimeStr) {
  const moonInfo = calculateMoonPhase(currentTimeStr);
  const lang = STATE.currentLanguage;
  
  DOM.moonPhaseName.textContent = moonInfo.name;
  
  // Determine if moon is waxing (growing) or waning (shrinking)
  let growthTrend = "";
  const MOON_TRANSLATIONS = {
    waxing: {
      ru: ", луна растет",
      en: ", moon is waxing",
      no: ", månen vokser",
      pl: ", księżyca przybywa",
      uk: ", місяць зростає",
      be: ", месяц нарастае"
    },
    waning: {
      ru: ", луна убывает",
      en: ", moon is waning",
      no: ", månen minker",
      pl: ", księżyca ubywa",
      uk: ", місяць спадає",
      be: ", месяц спадае"
    },
    phaseLabel: {
      ru: "Фаза",
      en: "Phase",
      no: "Fase",
      pl: "Faza",
      uk: "Фаза",
      be: "Фаза"
    },
    lunarDay: {
      ru: "Лунный день",
      en: "Lunar day",
      no: "Månedag",
      pl: "Dzień księżycowy",
      uk: "Місячний день",
      be: "Месяцавы дзень"
    }
  };
  
  const mt = MOON_TRANSLATIONS;
  if (moonInfo.phase <= 0.03 || moonInfo.phase >= 0.97) {
    growthTrend = "";
  } else if (moonInfo.phase >= 0.47 && moonInfo.phase <= 0.53) {
    growthTrend = "";
  } else if (moonInfo.phase < 0.5) {
    growthTrend = mt.waxing[lang] || mt.waxing["ru"];
  } else {
    growthTrend = mt.waning[lang] || mt.waning["ru"];
  }
  
  const phaseText = mt.phaseLabel[lang] || mt.phaseLabel["ru"];
  DOM.moonIllumination.textContent = `${phaseText}: ${moonInfo.illumination}%${growthTrend}`;
  DOM.moonVisual.innerHTML = getMoonPhaseSVG(moonInfo.phase);
  
  DOM.moonNextEventLabel.textContent = mt.lunarDay[lang] || mt.lunarDay["ru"];
  DOM.moonNextEventValue.textContent = getLunarDayString(moonInfo.moonDay, lang);
}

// ==========================================================================
// Custom Editable Cities Helpers
// ==========================================================================
const DEFAULT_EDITABLE_CITIES = [
  {
    translations: {
      ru: "Осло",
      en: "Oslo",
      no: "Oslo",
      pl: "Oslo",
      uk: "Осло",
      be: "Осла"
    },
    lat: 59.9139,
    lon: 10.7522
  },
  {
    translations: {
      ru: "Даугавпилс",
      en: "Daugavpils",
      no: "Daugavpils",
      pl: "Dyneburg",
      uk: "Даугавпілс",
      be: "Даўгаўпілс"
    },
    lat: 55.8747,
    lon: 26.5362
  },
  {
    translations: {
      ru: "Варшава",
      en: "Warsaw",
      no: "Warszawa",
      pl: "Warszawa",
      uk: "Варшава",
      be: "Варшава"
    },
    lat: 52.2297,
    lon: 21.0122
  }
];

function loadCustomCities() {
  let customCities = localStorage.getItem("cast_custom_cities");
  if (customCities) {
    try {
      customCities = JSON.parse(customCities);
      // Migrate old default cities to new ones if the user hasn't customized them yet
      if (Array.isArray(customCities) && customCities.length === 3) {
        const isOldDefaults = customCities[0].name === "Екатеринбург" && 
                              customCities[1].name === "Владивосток" && 
                              customCities[2].name === "Дубай";
        if (isOldDefaults) {
          customCities = null;
        }
      }
    } catch (e) {
      console.error("Failed to parse custom cities", e);
      customCities = null;
    }
  }
  
  if (!customCities || !Array.isArray(customCities) || customCities.length !== 3) {
    customCities = DEFAULT_EDITABLE_CITIES.map(c => ({
      name: c.translations.ru,
      lat: c.lat,
      lon: c.lon
    }));
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
      // Check if this city is one of the defaults (by comparing coordinates closely)
      const isDefault = DEFAULT_EDITABLE_CITIES.find(
        d => Math.abs(d.lat - cityData.lat) < 0.01 && Math.abs(d.lon - cityData.lon) < 0.01
      );
      
      const displayName = isDefault 
        ? (isDefault.translations[STATE.currentLanguage] || isDefault.translations["ru"]) 
        : cityData.name;
        
      btn.setAttribute("data-city", displayName);
      btn.setAttribute("data-lat", cityData.lat);
      btn.setAttribute("data-lon", cityData.lon);
      
      const textSpan = btn.querySelector(".city-btn-text");
      if (textSpan) {
        textSpan.textContent = displayName;
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
    const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
    if (!cityName) {
      showModalError(t.errorEmptyInput);
      return;
    }

    DOM.modalError.classList.add("hidden");
    DOM.modalSpinner.classList.remove("hidden");
    DOM.modalSaveBtn.disabled = true;

    try {
      const response = await fetch(`${CONFIG.GEOCODE_API_URL}?name=${encodeURIComponent(cityName)}&count=1&language=${STATE.currentLanguage}&format=json`);
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
        showModalError(t.errorGeocode);
      }
    } catch (e) {
      console.error("Modal geocoding error:", e);
      showModalError(t.errorModalNetwork);
    } finally {
      DOM.modalSpinner.classList.add("hidden");
      DOM.modalSaveBtn.disabled = false;
    }
  });

  // Language Selector Change Event
  if (DOM.langSelect) {
    DOM.langSelect.addEventListener("change", (e) => {
      const selectedLang = e.target.value;
      STATE.currentLanguage = selectedLang;
      localStorage.setItem("cast_language", selectedLang);
      
      applyLanguageUI();
      renderEditableCityButtons();
      
      // Reload weather to apply language translation to API responses
      if (STATE.currentLat !== null && STATE.currentLon !== null) {
        loadWeather(STATE.currentLat, STATE.currentLon, STATE.currentCity);
      }
    });
  }
}

/**
 * Updates all static UI texts in the DOM to the selected language
 */
function applyLanguageUI() {
  const t = TRANSLATIONS[STATE.currentLanguage] || TRANSLATIONS["ru"];
  
  // Search placeholder
  if (DOM.searchInput) {
    DOM.searchInput.placeholder = t.placeholder;
  }
  
  // Geolocation button text
  const geoText = DOM.geoBtn ? DOM.geoBtn.querySelector("span") : null;
  if (geoText) {
    geoText.textContent = t.geoBtn;
  }
  
  // Forecast card titles
  const dailyTitle = document.querySelector(".daily-forecast-card .card-title");
  if (dailyTitle) {
    dailyTitle.innerHTML = `<i data-lucide="calendar"></i> ${t.forecastTitle}`;
  }
  const hourlyTitle = document.querySelector(".hourly-forecast-card .card-title");
  if (hourlyTitle) {
    hourlyTitle.innerHTML = `<i data-lucide="clock"></i> ${t.hourlyForecastTitle}`;
  }
  
  // Metric headers
  const humidityHeader = document.querySelector(".metric-icon.humidity + span");
  if (humidityHeader) humidityHeader.textContent = t.humidity;
  
  const windHeader = document.querySelector(".metric-icon.wind + span");
  if (windHeader) windHeader.textContent = t.wind;
  
  const precipitationHeader = document.querySelector(".metric-icon.precipitation + span");
  if (precipitationHeader) precipitationHeader.textContent = t.precipitation;
  
  const pressureHeader = document.querySelector(".metric-icon.pressure + span");
  if (pressureHeader) pressureHeader.textContent = t.pressure;
  
  const sunCycleHeader = document.querySelector(".metric-icon.sun-schedule + span");
  if (sunCycleHeader) sunCycleHeader.textContent = t.sunCycle;
  
  const moonCycleHeader = document.querySelector(".metric-icon.moon-phase + span");
  if (moonCycleHeader) moonCycleHeader.textContent = t.moonCycle;
  
  // Sunrise / sunset labels
  const timeLabels = document.querySelectorAll(".time-label");
  if (timeLabels.length >= 2) {
    timeLabels[0].textContent = t.sunrise;
    timeLabels[1].textContent = t.sunset;
  }
  
  // Min / Max labels
  const tempLabels = document.querySelectorAll(".temp-label");
  if (tempLabels.length >= 2) {
    tempLabels[0].textContent = t.minLabel;
    tempLabels[1].textContent = t.maxLabel;
  }
  
  // Loading & welcome states
  const loadingStateText = document.querySelector("#loading-state p");
  if (loadingStateText) loadingStateText.textContent = t.loadingText;
  
  const errorStateTitle = document.querySelector("#error-state h3");
  if (errorStateTitle) errorStateTitle.textContent = t.errorTitle;
  
  const retryBtn = document.querySelector("#retry-btn");
  if (retryBtn) retryBtn.textContent = t.retryText;
  
  const welcomeStateTitle = document.querySelector("#welcome-state h2");
  if (welcomeStateTitle) welcomeStateTitle.textContent = t.welcomeTitle;
  
  const welcomeStateText = document.querySelector("#welcome-state p");
  if (welcomeStateText) welcomeStateText.textContent = t.welcomeText;
  
  // Footer
  const footerText = document.querySelector(".app-footer p");
  if (footerText) footerText.innerHTML = t.footerText;
  
  // Edit city modal
  const modalTitle = document.querySelector(".modal-header h3");
  if (modalTitle) modalTitle.textContent = t.modalTitle;
  
  const modalLabel = document.querySelector(".modal-label");
  if (modalLabel) modalLabel.textContent = t.modalInputLabel;
  
  const modalInput = document.querySelector("#modal-city-input");
  if (modalInput) modalInput.placeholder = t.modalPlaceholder;
  
  const modalCancelBtn = document.querySelector("#modal-cancel-btn");
  if (modalCancelBtn) modalCancelBtn.textContent = t.modalCancel;
  
  const modalSaveBtnText = document.querySelector("#modal-save-btn span");
  if (modalSaveBtnText) modalSaveBtnText.textContent = t.modalSave;
  
  // Edit icon tooltips
  const editBtns = document.querySelectorAll(".edit-icon-btn");
  editBtns.forEach(btn => {
    btn.title = t.editTooltip;
  });

  // Re-instantiate Lucide icon elements
  lucide.createIcons();
}

// ==========================================================================
// Application Bootstrapping
// ==========================================================================
function bootstrap() {
  // Load active language from localStorage
  STATE.currentLanguage = localStorage.getItem("cast_language") || "ru";
  if (DOM.langSelect) {
    DOM.langSelect.value = STATE.currentLanguage;
  }
  applyLanguageUI();

  // Load custom quick city button names from localStorage before initializing
  renderEditableCityButtons();
  
  initEventHandlers();
  
  // Load custom cities to find the first one (fallback to CONFIG default)
  const customCities = loadCustomCities();
  const defaultCity = customCities[0] || { name: CONFIG.DEFAULT_CITY, lat: CONFIG.DEFAULT_LAT, lon: CONFIG.DEFAULT_LON };
  
  // Highlight the first editable button
  const firstEditableBtn = document.querySelector('.city-btn.editable[data-id="0"]');
  if (firstEditableBtn) {
    firstEditableBtn.classList.add("active");
    STATE.activeCityBtn = firstEditableBtn;
  }
  
  loadWeather(defaultCity.lat, defaultCity.lon, defaultCity.name);
}

// Run bootstrap when DOM content is fully parsed
document.addEventListener("DOMContentLoaded", bootstrap);
