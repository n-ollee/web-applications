
const API_KEY = 'fe1fa84ceb8a8bcb6ca756ae7f00bbaf'; 
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

let currentLanguage = 'pl';

const cityInput = document.getElementById('cityInput');
const weatherBtn = document.getElementById('weatherBtn');
const currentWeather = document.getElementById('currentWeather');
const forecastSection = document.getElementById('forecastSection');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const langButtons = document.querySelectorAll('.lang-btn');

const translations = {
    pl: {
        placeholder: 'Wpisz nazwę miasta...',
        button: 'Pogoda',
        loading: 'Ładowanie danych pogodowych...',
        forecastTitle: 'Prognoza 5-dniowa',
        feelsLike: 'Odczuwalna',
        humidity: 'Wilgotność',
        pressure: 'Ciśnienie',
        windSpeed: 'Wiatr',
        errorCity: 'Nie znaleziono miasta. Sprawdź nazwę i spróbuj ponownie.',
        errorGeneral: 'Wystąpił błąd podczas pobierania danych. Spróbuj ponownie.'
    },
    en: {
        placeholder: 'Enter city name...',
        button: 'Weather',
        loading: 'Loading weather data...',
        forecastTitle: '5-day Forecast',
        feelsLike: 'Feels like',
        humidity: 'Humidity',
        pressure: 'Pressure',
        windSpeed: 'Wind',
        errorCity: 'City not found. Check the name and try again.',
        errorGeneral: 'An error occurred while fetching data. Please try again.'
    }
};

function kelvinToCelsius(kelvin) {
    return Math.round(kelvin - 273.15);
}

function formatDate(timestamp, lang) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function hideAll() {
    currentWeather.classList.remove('show');
    forecastSection.classList.remove('show');
    errorMessage.classList.remove('show');
    loading.classList.remove('show');
}

function getCurrentWeather(city) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&lang=${currentLanguage}`;
        
        xhr.open('GET', url, true);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log('Current weather data:', data);
                resolve(data);
            } else if (xhr.status === 404) {
                reject(new Error('city_not_found'));
            } else {
                reject(new Error('general_error'));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('general_error'));
        };
        
        xhr.send();
    });
}

async function getForecast(city) {
    try {
        const url = `${API_BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&lang=${currentLanguage}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('city_not_found');
            }
            throw new Error('general_error');
        }
        
        const data = await response.json();
        console.log('Forecast data:', data);
        return data;
    } catch (error) {
        throw error;
    }
}

function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = `${kelvinToCelsius(data.main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('feelsLike').textContent = `${kelvinToCelsius(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    
    currentWeather.classList.add('show');
}

function displayForecast(data) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    const forecastsByDay = {};
    
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const hour = date.getHours();
        
        if (hour < 1 || hour > 22) {
            return;
        }
        
        const dayKey = date.toLocaleDateString(currentLanguage === 'pl' ? 'pl-PL' : 'en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
        
        if (!forecastsByDay[dayKey]) {
            forecastsByDay[dayKey] = [];
        }
        forecastsByDay[dayKey].push(forecast);
    });
    
    const days = Object.keys(forecastsByDay).slice(0, 5);
    
    days.forEach((day, dayIndex) => {
        const dayForecasts = forecastsByDay[day];
        
        if (dayForecasts.length === 0) {
            return;
        }
        
        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-container';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = formatDate(dayForecasts[0].dt, currentLanguage);
        dayContainer.appendChild(dayHeader);
        
        const hourlyWrapper = document.createElement('div');
        hourlyWrapper.className = 'hourly-wrapper';
        
        const prevButton = document.createElement('button');
        prevButton.className = 'nav-button prev disabled';
        prevButton.innerHTML = '&#8249;';
        prevButton.setAttribute('data-day', dayIndex);
        hourlyWrapper.appendChild(prevButton);
        
        const hourlyContainer = document.createElement('div');
        hourlyContainer.className = 'hourly-container';
        hourlyContainer.setAttribute('data-day', dayIndex);
        hourlyContainer.setAttribute('data-scroll', '0');
        
        dayForecasts.forEach(forecast => {
            const card = document.createElement('div');
            card.className = 'forecast-card';
            
            card.innerHTML = `
                <div class="forecast-time">${formatTime(forecast.dt)}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="Weather icon" />
                <div class="forecast-temp">${kelvinToCelsius(forecast.main.temp)}°C</div>
                <div class="forecast-desc">${forecast.weather[0].description}</div>
                <div style="margin-top: 10px; font-size: 0.85em;">
                    <div>💧 ${forecast.main.humidity}%</div>
                    <div>💨 ${Math.round(forecast.wind.speed * 3.6)} km/h</div>
                </div>
            `;
            
            hourlyContainer.appendChild(card);
        });
        
        hourlyWrapper.appendChild(hourlyContainer);
        
        const nextButton = document.createElement('button');
        nextButton.className = 'nav-button next';
        nextButton.innerHTML = '&#8250;';
        nextButton.setAttribute('data-day', dayIndex);
        hourlyWrapper.appendChild(nextButton);
        
        dayContainer.appendChild(hourlyWrapper);
        forecastGrid.appendChild(dayContainer);
        setupNavigationButtons(prevButton, nextButton, hourlyContainer, dayForecasts.length);
    });
    
    document.querySelector('.forecast-title').textContent = translations[currentLanguage].forecastTitle;
    forecastSection.classList.add('show');
}

function setupNavigationButtons(prevBtn, nextBtn, container, totalItems) {
    let scrollPosition = 0;
    
    const updateButtons = () => {
        const wrapper = container.parentElement;
        const wrapperWidth = wrapper.offsetWidth - 110; // minus padding dla przycisków (55px * 2)
        const cardWidth = 155; // szerokość karty (140px) + gap (15px)
        const visibleCards = Math.floor(wrapperWidth / cardWidth);
        const maxScroll = Math.max(0, totalItems - visibleCards);
        
        console.log(`Total items: ${totalItems}, Visible: ${visibleCards}, Max scroll: ${maxScroll}, Current: ${scrollPosition}`);
        
        prevBtn.classList.toggle('disabled', scrollPosition === 0);
        nextBtn.classList.toggle('disabled', scrollPosition >= maxScroll);
        
        return { maxScroll, cardWidth };
    };
    
    prevBtn.addEventListener('click', () => {
        if (scrollPosition > 0) {
            scrollPosition--;
            const { cardWidth } = updateButtons();
            container.style.transform = `translateX(-${scrollPosition * cardWidth}px)`;
            updateButtons();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const { maxScroll, cardWidth } = updateButtons();
        if (scrollPosition < maxScroll) {
            scrollPosition++;
            container.style.transform = `translateX(-${scrollPosition * cardWidth}px)`;
            updateButtons();
        }
    });
    
    updateButtons();
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            scrollPosition = 0;
            container.style.transform = 'translateX(0)';
            updateButtons();
        }, 250);
    });
}

function updateDetailLabels() {
    document.querySelector('.detail-item:nth-child(1) .detail-label').textContent = translations[currentLanguage].feelsLike;
    document.querySelector('.detail-item:nth-child(2) .detail-label').textContent = translations[currentLanguage].humidity;
    document.querySelector('.detail-item:nth-child(3) .detail-label').textContent = translations[currentLanguage].pressure;
    document.querySelector('.detail-item:nth-child(4) .detail-label').textContent = translations[currentLanguage].windSpeed;
}

async function fetchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError(currentLanguage === 'pl' ? 'Wpisz nazwę miasta' : 'Enter city name');
        return;
    }
    
    hideAll();
    loading.classList.add('show');
    
    try {
        // XMLHttpRequest
        const currentData = await getCurrentWeather(city);
        displayCurrentWeather(currentData);
        updateDetailLabels();
        
        // Fetch API
        const forecastData = await getForecast(city);
        displayForecast(forecastData);
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message === 'city_not_found') {
            showError(translations[currentLanguage].errorCity);
        } else {
            showError(translations[currentLanguage].errorGeneral);
        }
    } finally {
        loading.classList.remove('show');
    }
}

function changeLanguage(lang) {
    currentLanguage = lang;
    
    langButtons.forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    cityInput.placeholder = translations[lang].placeholder;
    weatherBtn.textContent = translations[lang].button;
    loading.textContent = translations[lang].loading;
    
    if (currentWeather.classList.contains('show')) {
        fetchWeather();
    }
}

weatherBtn.addEventListener('click', fetchWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeather();
    }
});

langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeLanguage(btn.dataset.lang);
    });
});