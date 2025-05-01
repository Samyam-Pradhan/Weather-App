import { useState } from 'react';
import "./App.css";

function WeatherApp() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Use the full URL in development to avoid proxy issues
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `/api/weather?city=${encodeURIComponent(city)}`
        : `http://localhost:3000/api/weather?city=${encodeURIComponent(city)}`;
      
      console.log('Fetching from:', apiUrl); // Debug log
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`City not found or server error (${response.status})`);
      }
      
      const data = await response.json();
      console.log('Weather data:', data); // Debug log
      setWeather(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="weather-card">
        <h1 className="app-title">Weather App</h1>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-container">
            <input
              type="text"
              placeholder="Enter city name"
              className="search-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button 
              type="submit"
              className="search-button"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {weather && (
          <div className="weather-info">
            <div className="weather-header">
              <h2 className="city-name">{weather.name}, {weather.sys.country}</h2>
              <div className="weather-icon-container">
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                  alt={weather.weather[0].description}
                  className="weather-icon"
                />
              </div>
            </div>
            
            <div className="temperature-section">
              <div className="temperature">{Math.round(weather.main.temp)}°C</div>
              <div className="weather-description">{weather.weather[0].description}</div>
            </div>
            
            <div className="weather-details">
              <div className="detail-card">
                <div className="detail-label">Feels Like</div>
                <div className="detail-value">{Math.round(weather.main.feels_like)}°C</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Humidity</div>
                <div className="detail-value">{weather.main.humidity}%</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Wind</div>
                <div className="detail-value">{Math.round(weather.wind.speed * 3.6)} km/h</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Pressure</div>
                <div className="detail-value">{weather.main.pressure} hPa</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherApp;