import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

interface ForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

const weatherIcons: Record<number, string> = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  77: '🌨️',
  80: '🌧️', 81: '🌧️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export function getWeatherIcon(code: number): string {
  return weatherIcons[code] ?? '🌡️';
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=9.32&longitude=126.11&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&timezone=Asia%2FManila&forecast_days=7'
        );
        const data = await res.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
        });
        setHumidity(Math.round(data.current.relative_humidity_2m));
        setWindSpeed(Math.round(data.current.wind_speed_10m));

        const days: ForecastDay[] = (data.daily.time as string[]).map((date: string, i: number) => {
          const d = new Date(date + 'T00:00:00');
          return {
            date,
            dayName: d.toLocaleDateString('en', { weekday: 'short' }),
            tempMax: Math.round(data.daily.temperature_2m_max[i]),
            tempMin: Math.round(data.daily.temperature_2m_min[i]),
            weatherCode: data.daily.weather_code[i],
          };
        });
        setForecast(days);
      } catch {
        // silently fail
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const icon = weather ? (weatherIcons[weather.weatherCode] ?? '🌡️') : null;

  return { weather, icon, forecast, humidity, windSpeed };
}
