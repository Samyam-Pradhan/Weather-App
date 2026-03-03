import React, { useState, useEffect } from 'react';

const weatherBg = (condition, isDay) => {
  if (!condition) return isDay ? 'from-emerald-900 via-teal-800 to-cyan-900' : 'from-gray-900 via-slate-900 to-blue-950';
  
  const c = condition.toLowerCase();
  
  // Day backgrounds
  if (isDay) {
    if (c.includes('clear')) return 'from-orange-600 via-rose-500 to-pink-600';
    if (c.includes('cloud')) return 'from-slate-700 via-zinc-600 to-slate-800';
    if (c.includes('rain')) return 'from-indigo-900 via-blue-700 to-cyan-800';
    if (c.includes('snow')) return 'from-sky-300 via-blue-200 to-indigo-400';
    if (c.includes('thunder')) return 'from-gray-950 via-zinc-800 to-gray-900';
    if (c.includes('mist') || c.includes('fog')) return 'from-zinc-500 via-stone-400 to-zinc-600';
    return 'from-emerald-800 via-teal-700 to-cyan-800';
  } 
  // Night backgrounds
  else {
    if (c.includes('clear')) return 'from-indigo-950 via-purple-900 to-blue-950';
    if (c.includes('cloud')) return 'from-gray-900 via-slate-900 to-blue-950';
    if (c.includes('rain')) return 'from-gray-950 via-blue-950 to-indigo-950';
    if (c.includes('snow')) return 'from-slate-800 via-blue-900 to-indigo-900';
    if (c.includes('thunder')) return 'from-gray-950 via-zinc-900 to-gray-950';
    if (c.includes('mist') || c.includes('fog')) return 'from-gray-800 via-stone-800 to-gray-900';
    return 'from-gray-900 via-slate-900 to-blue-950';
  }
};

const weatherIcon = (main, isDay) => {
  const icons = {
    Clear: isDay ? '☀️' : '🌙',
    Clouds: isDay ? '☁️' : '☁️',
    Rain: '🌧️', 
    Drizzle: '🌦️',
    Thunderstorm: '⛈️', 
    Snow: '❄️', 
    Mist: '🌫️', 
    Fog: '🌫️',
    Haze: '🌁',
  };
  return icons[main] || (isDay ? '🌡️' : '🌡️');
};

export default function Weather() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('metric');
  const [showForecast, setShowForecast] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);
  const [isDay, setIsDay] = useState(true);

  // Function to get city's local time based on timezone offset
  const getCityTime = (timezoneOffset) => {
    if (!timezoneOffset) return null;
    
    // Get current UTC time
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Create new date with city's timezone offset (timezoneOffset is in seconds)
    const cityTime = new Date(utcTime + (timezoneOffset * 1000));
    
    return cityTime;
  };

  // Simple function to determine day/night based on local hour (6 AM - 6 PM = day)
  const isDayByLocalHour = (cityTime) => {
    if (!cityTime) return true;
    const hour = cityTime.getHours();
    // Consider it day between 6 AM and 6 PM
    return hour >= 6 && hour < 18;
  };

  // Function to check if sunrise/sunset times are reasonable
  const areTimesReasonable = (sunriseUTC, sunsetUTC, timezone) => {
    // Convert to local hours for sanity check
    const sunriseLocal = new Date(sunriseUTC.getTime() + (timezone * 1000));
    const sunsetLocal = new Date(sunsetUTC.getTime() + (timezone * 1000));
    
    const sunriseHour = sunriseLocal.getHours();
    const sunsetHour = sunsetLocal.getHours();
    
    console.log('Sunrise local hour:', sunriseHour);
    console.log('Sunset local hour:', sunsetHour);
    
    // Sunrise should be between 4 AM and 10 AM local time
    // Sunset should be between 4 PM and 8 PM local time
    return sunriseHour >= 4 && sunriseHour <= 10 && sunsetHour >= 16 && sunsetHour <= 20;
  };

  // Function to determine if it's day or night
  const checkIsDay = (weatherData, cityTime) => {
    if (!weatherData?.sys || !cityTime) return true;
    
    // Get sunrise and sunset times (they come from API in UTC)
    const sunriseUTC = new Date(weatherData.sys.sunrise * 1000);
    const sunsetUTC = new Date(weatherData.sys.sunset * 1000);
    
    // Log times for debugging
    console.log('Debug - City:', weatherData.name);
    console.log('Sunrise UTC:', sunriseUTC.toISOString());
    console.log('Sunset UTC:', sunsetUTC.toISOString());
    console.log('Local time:', cityTime.toString());
    
    // Check if the times are reasonable
    if (!areTimesReasonable(sunriseUTC, sunsetUTC, weatherData.timezone)) {
      console.log('Sunrise/sunset times seem incorrect, using local hour fallback');
      return isDayByLocalHour(cityTime);
    }
    
    // Convert current city time to UTC for comparison
    const currentUTC = new Date(cityTime.getTime() - (weatherData.timezone * 1000));
    
    console.log('Current UTC:', currentUTC.toISOString());
    console.log('Using sunrise/sunset times for calculation');
    
    // Compare UTC times
    return currentUTC >= sunriseUTC && currentUTC < sunsetUTC;
  };

  // Update time every minute when weather is loaded
  useEffect(() => {
    if (!weather?.timezone) return;

    const updateTime = () => {
      const cityTime = getCityTime(weather.timezone);
      setCurrentTime(cityTime);
      
      // Check if it's day or night
      if (cityTime && weather) {
        setIsDay(checkIsDay(weather, cityTime));
      }
    };

    // Update immediately
    updateTime();

    // Then update every minute (60000 ms)
    const timer = setInterval(updateTime, 60000);

    return () => clearInterval(timer);
  }, [weather]);

  const toTemp = (t) =>
    unit === 'metric' ? `${Math.round(t)}°C` : `${Math.round(t * 9 / 5 + 32)}°F`;

  const toSpeed = (s) =>
    unit === 'metric' ? `${Math.round(s * 3.6)} km/h` : `${Math.round(s)} mph`;

  // Fixed toTime function - now correctly converts UTC to local time
  const toTime = (ts, timezone) => {
    if (!ts) return '';
    // Create date from UTC timestamp
    const date = new Date(ts * 1000);
    // Add timezone offset to convert from UTC to local time
    const localTime = new Date(date.getTime() + (timezone * 1000));
    return localTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Use UTC to prevent double conversion
    });
  };

  const toDayName = (ts) =>
    new Date(ts * 1000).toLocaleDateString('en-US', { weekday: 'short' });

  // Format city time for display (only hour and minute)
  const formatCityTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast(null);
    setShowForecast(false);
    setCurrentTime(null);

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}&units=${unit}`);
      if (!res.ok) throw new Error((await res.json()).error || 'City not found');
      const weatherData = await res.json();
      setWeather(weatherData);
      
      // Set initial day/night state
      const cityTime = getCityTime(weatherData.timezone);
      setCurrentTime(cityTime);
      if (cityTime) {
        setIsDay(checkIsDay(weatherData, cityTime));
      }

      const fRes = await fetch(`/api/forecast?city=${encodeURIComponent(city)}&units=${unit}`);
      if (fRes.ok) setForecast(await fRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bg = weatherBg(weather?.weather?.[0]?.description, isDay);

  return (
    <div className={`min-h-screen bg-linear-to-br ${bg} transition-colors duration-500 font-sans will-change-transform`}>
      {/* Fixed overlay with optimized blur */}
      <div className="min-h-screen bg-black/10 flex flex-col items-center px-4 py-12">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-1">
            <h1
              className="text-4xl font-black text-white tracking-tight drop-shadow-lg"
              style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}
            >
              Weather App
            </h1>
          </div>
          <p className="text-white/60 text-sm mt-1 tracking-widest uppercase">
            Real-time forecasts
          </p>
          {/* Decorative underline */}
          <div className="mx-auto mt-3 h-0.5 w-24 rounded-full bg-white/30" />
        </div>

        {/* Search - Optimized with hardware acceleration */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">🔍</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white/15 text-white placeholder-white/50 border border-white/20 focus:border-white/50 focus:outline-none text-base transition-colors will-change-transform"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-white text-slate-800 font-semibold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60 shadow-lg will-change-transform"
            >
              {loading ? '...' : '→'}
            </button>
          </div>
        </form>

        {/* Unit Toggle - Simplified blur */}
        <div className="flex gap-1 mb-8 bg-white/10 rounded-xl p-1 border border-white/15">
          {['metric', 'imperial'].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                unit === u ? 'bg-white text-slate-800 shadow' : 'text-white/70 hover:text-white'
              }`}
            >
              {u === 'metric' ? '°C' : '°F'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="w-full max-w-md mb-6 px-5 py-4 rounded-2xl bg-red-500/20 border border-red-300/30 text-red-100 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-white/70 text-sm animate-pulse mt-4">Fetching weather…</div>
        )}

        {/* Weather Card - Optimized */}
        {weather && !loading && (
          <div className="w-full max-w-md space-y-4">
            {/* Main Card - Removed heavy backdrop-blur */}
            <div className="rounded-3xl bg-white/10 border border-white/20 shadow-2xl p-7">
              {/* Location */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white leading-tight">
                      {weather.name}
                    </h2>
                    <p className="text-white/60 text-sm mt-0.5">
                      {weather.sys.country}
                    </p>
                  </div>
                  {/* City Local Time - Only hour and minute */}
                  {currentTime && (
                    <div className="text-right">
                      <div className="text-white/90 text-xl font-semibold">
                        {formatCityTime(currentTime)}
                      </div>
                      <div className="text-white/50 text-xs">
                        {isDay ? 'Day' : 'Night'}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-2">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Temp + Icon */}
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-7xl font-black text-white leading-none tracking-tighter">
                    {toTemp(weather.main.temp)}
                  </div>
                  <div className="text-white/70 capitalize mt-2 text-base">
                    {weather.weather[0].description}
                  </div>
                  <div className="text-white/50 text-sm mt-0.5">
                    Feels like {toTemp(weather.main.feels_like)}
                  </div>
                </div>
                <div className="text-7xl">{weatherIcon(weather.weather[0].main, isDay)}</div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/15 my-5" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Humidity', value: `${weather.main.humidity}%` },
                  { label: 'Wind', value: toSpeed(weather.wind.speed) },
                  { label: 'Pressure', value: `${weather.main.pressure} hPa` },
                  { label: 'Visibility', value: `${(weather.visibility / 1000).toFixed(1)} km` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="text-white/50 text-xs">{label}</div>
                    <div className="text-white font-semibold text-sm">{value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-2xl bg-amber-400/20 px-4 py-3">
                  <div className="text-white/50 text-xs">Sunrise</div>
                  <div className="text-white font-semibold text-sm">{toTime(weather.sys.sunrise, weather.timezone)}</div>
                </div>
                <div className="rounded-2xl bg-orange-400/20 px-4 py-3">
                  <div className="text-white/50 text-xs">Sunset</div>
                  <div className="text-white font-semibold text-sm">{toTime(weather.sys.sunset, weather.timezone)}</div>
                </div>
              </div>
            </div>
            
            {/* Forecast Toggle - Optimized */}
            {forecast && (
              <button
                onClick={() => setShowForecast(!showForecast)}
                className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors text-sm will-change-transform"
              >
                {showForecast ? 'Hide Forecast ↑' : '5-Day Forecast ↓'}
              </button>
            )}
            
            {/* Forecast - Optimized */}
            {showForecast && forecast && (
              <div className="rounded-3xl bg-white/10 border border-white/20 shadow-xl p-5">
                <div className="grid grid-cols-5 gap-2">
                  {forecast.list.filter((_, i) => i % 8 === 0).slice(0, 5).map((day) => (
                    <div key={day.dt} className="flex flex-col items-center gap-1.5 py-2">
                      <span className="text-white/60 text-xs font-medium">{toDayName(day.dt)}</span>
                      <span className="text-2xl">{weatherIcon(day.weather[0].main, true)}</span>
                      <span className="text-white font-bold text-sm">{toTemp(day.main.temp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}