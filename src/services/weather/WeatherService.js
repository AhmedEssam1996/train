class WeatherService {
  constructor() {
    this.geocodingBase = 'https://geocoding-api.open-meteo.com/v1';
    this.weatherBase = 'https://api.open-meteo.com/v1';
    this.defaultLat = 30.0444;
    this.defaultLon = 31.2357;
    this.defaultCity = 'Cairo';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000;
  }

  weatherCodeToText(code, language = 'en') {
    const descriptions = {
      en: {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
        56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
        61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
        80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
      },
      ar: {
        0: 'سماء صافية',
        1: 'صافي معظم الوقت', 2: 'غيوم جزئية', 3: 'غطائم',
        45: 'ضباب', 48: 'ضباب كثيف',
        51: 'رذى خفيف', 53: 'رذى', 55: 'رذى كثيف',
        56: 'رذى متجمد', 57: 'رذى متجمد كثيف',
        61: 'مطر خفيف', 63: 'مطر', 65: 'مطر غزير',
        66: 'مطر متجمد خفيف', 67: 'مطر متجمد غزير',
        71: 'ثلج خفيف', 73: 'ثلج', 75: 'ثلوج كثيفة', 77: 'حبيبات ثلج',
        80: 'زخارف مطر', 81: 'زخارف مطر غزيرة', 82: 'عواصف مطر عنيفة',
        85: 'زخارف ثلج خفيفة', 86: 'زخارف ثلج كثيفة',
        95: 'عاصفة رعدية', 96: 'عاصفة رعدية مع برد', 99: 'عاصفة رعدية مع برد غزير',
      }
    };
    const desc = descriptions[language] || descriptions.en;
    return desc[code] || (language === 'ar' ? 'حالة جوية غير معروفة' : 'Unknown weather');
  }

  weatherCodeToEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌧️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    if (code <= 86) return '🌨️';
    if (code <= 99) return '⛈️';
    return '🌡️';
  }

  async geocodeCity(cityName) {
    if (!cityName) return { lat: this.defaultLat, lon: this.defaultLon, name: this.defaultCity, country: 'Egypt' };
    const cacheKey = `geo_${cityName.toLowerCase().trim()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTimeout * 6) {
      return cached.data;
    }
    try {
      const url = `${this.geocodingBase}/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const geoData = {
          lat: result.latitude,
          lon: result.longitude,
          name: result.name || cityName,
          country: result.country || '',
          admin1: result.admin1 || '',
        };
        this.cache.set(cacheKey, { time: Date.now(), data: geoData });
        return geoData;
      }
      return { lat: this.defaultLat, lon: this.defaultLon, name: this.defaultCity, country: 'Egypt' };
    } catch (e) {
      console.error('Geocoding error:', e);
      return { lat: this.defaultLat, lon: this.defaultLon, name: this.defaultCity, country: 'Egypt' };
    }
  }

  async getCurrentWeather(cityOrCoords = null, language = 'en') {
    let coords;
    if (cityOrCoords && typeof cityOrCoords === 'object') {
      coords = cityOrCoords;
    } else {
      coords = await this.geocodeCity(cityOrCoords);
    }
    const cacheKey = `weather_${coords.lat}_${coords.lon}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTimeout) {
      return { ...cached.data, location: coords };
    }
    try {
      const url = `${this.weatherBase}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data || !data.current) {
        throw new Error('No weather data');
      }
      const cur = data.current;
      const daily = data.daily;
      const weatherData = {
        temperature: cur.temperature_2m,
        temperatureUnit: data.current_units?.temperature_2m || '°C',
        feelsLike: cur.apparent_temperature,
        humidity: cur.relative_humidity_2m,
        windSpeed: cur.wind_speed_10m,
        windUnit: data.current_units?.wind_speed_10m || 'km/h',
        windDirection: cur.wind_direction_10m,
        weatherCode: cur.weather_code,
        description: this.weatherCodeToText(cur.weather_code, language),
        emoji: this.weatherCodeToEmoji(cur.weather_code),
        tempMax: daily?.temperature_2m_max?.[0],
        tempMin: daily?.temperature_2m_min?.[0],
        timezone: data.timezone,
      };
      this.cache.set(cacheKey, { time: Date.now(), data: weatherData });
      return { ...weatherData, location: coords };
    } catch (e) {
      console.error('Weather fetch error:', e);
      return null;
    }
  }

  formatWeatherReport(weatherData, language = 'en') {
    if (!weatherData) {
      return language === 'ar'
        ? 'عذراً، لم أتمكن من الحصول على معلومات الطقس في الوقت الحالي.'
        : "Sorry, I couldn't get weather information at this time.";
    }
    const { temperature, feelsLike, humidity, windSpeed, description, emoji, tempMax, tempMin, location } = weatherData;
    const locName = location?.name || this.defaultCity;
    const locExtra = location?.admin1 ? `${location.admin1}, ${location?.country || ''}` : (location?.country || '');
    if (language === 'ar') {
      let report = `${emoji} الطقس في ${locName}`;
      if (locExtra) report += ` (${locExtra})`;
      report += `:\n`;
      report += `• الحرارة الحالية: ${temperature}°C`;
      if (feelsLike !== undefined) report += `، والشعور الفعلي ${feelsLike}°C\n`;
      else report += '\n';
      report += `• ${description}\n`;
      if (tempMin !== undefined && tempMax !== undefined) {
        report += `• أدنى حرارة: ${tempMin}°C · أعلى حرارة: ${tempMax}°C\n`;
      }
      report += `• الرطوبة: ${humidity}% · سرعة الرياح: ${windSpeed} كم/ساعة`;
      return report;
    } else {
      let report = `${emoji} Weather in ${locName}`;
      if (locExtra) report += ` (${locExtra})`;
      report += `:\n`;
      report += `• Current temperature: ${temperature}°C`;
      if (feelsLike !== undefined) report += `, feels like ${feelsLike}°C\n`;
      else report += '\n';
      report += `• ${description}\n`;
      if (tempMin !== undefined && tempMax !== undefined) {
        report += `• Low: ${tempMin}°C · High: ${tempMax}°C\n`;
      }
      report += `• Humidity: ${humidity}% · Wind: ${windSpeed} km/h`;
      return report;
    }
  }
}

export const weatherService = new WeatherService();
export default WeatherService;
