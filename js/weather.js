// script.js

const API_KEY = '2b449509f9759ce1f3b01e6df45af171';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const toggleBtn = document.getElementById('toggleBtn');
const searchPanel = document.getElementById('searchPanel');
const refreshBtn = document.getElementById('refreshBtn');
const backgroundVideo = document.getElementById('backgroundVideo');

const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const cityName = document.getElementById('cityName');
const weatherIcon = document.getElementById('weatherIcon');
const tempRange = document.getElementById('tempRange');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const cloudy = document.getElementById('cloudy');
const weatherMessage = document.getElementById('weatherMessage');
const weeklyForecast = document.getElementById('weeklyForecast');
const feelsLike = document.getElementById('feelsLike');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');

init();

function init() {
  updateDate();
  getWeatherByCity('Seoul');

  if (window.innerWidth <= 768) {
    searchPanel.classList.remove('hidden');
  }

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  toggleBtn.addEventListener('click', togglePanel);
  refreshBtn.addEventListener('click', () => {
    getWeatherByCity(cityName.textContent);
  });
}

function updateDate() {
  const now = new Date();
  const day = now.getDate();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dayWithSuffix = day + getDaySuffix(day);
  currentDate.textContent = `${weekday}, ${dayWithSuffix} ${month} ${year}`;
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function handleSearch() {
  const city = searchInput.value.trim();
  if (city) {
    getWeatherByCity(city);
    searchInput.value = '';
  }
}

async function getWeatherByCity(city) {
  try {
    const response = await fetch(
      `${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=kr`,
    );
    if (!response.ok) throw new Error('도시를 찾을 수 없습니다.');
    const data = await response.json();
    updateWeatherUI(data);
    //  현재 날씨 데이터 함께 전달 → 오늘 카드 항상 보장
    getWeeklyForecast(city, data);
  } catch (error) {
    alert(error.message);
    console.error('Error:', error);
  }
}

async function getWeeklyForecast(city, currentWeatherData) {
  try {
    const response = await fetch(
      `${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=kr`,
    );
    if (!response.ok) throw new Error('예보 정보를 가져올 수 없습니다.');
    const data = await response.json();
    displayWeeklyForecast(data, currentWeatherData);
  } catch (error) {
    console.error('Forecast Error:', error);
  }
}

//  오늘: 현재 날씨 API로 강제 생성 (시간대 무관, 항상 표시)
//  내일~6일: forecast 데이터를 날짜 직접 비교로 매핑
function displayWeeklyForecast(forecastData, currentWeatherData) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // --- 오늘 카드 (현재 날씨 데이터 사용) ---
  const todayCondition = currentWeatherData.weather[0].main.toLowerCase();
  const todayTemp = Math.round(currentWeatherData.main.temp);
  const todayCard = `
    <div class="forecast-card">
      <div class="forecast-day">오늘</div>
      <div class="forecast-icon"><img src="${getWeatherEmojiUrl(todayCondition)}" alt="${todayCondition}"></div>
      <div class="forecast-temp">${todayTemp}°C</div>
    </div>
  `;

  // --- 내일~6일 후 (forecast 데이터에서 매핑) ---
  const targetDates = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    targetDates.push(d);
  }

  const result = [];

  targetDates.forEach((targetDate) => {
    const ty = targetDate.getFullYear();
    const tm = targetDate.getMonth();
    const td = targetDate.getDate();

    let bestItem = null;
    let bestDiff = Infinity;

    forecastData.list.forEach((item) => {
      const itemDate = new Date(item.dt * 1000);
      if (
        itemDate.getFullYear() === ty &&
        itemDate.getMonth() === tm &&
        itemDate.getDate() === td
      ) {
        const diff = Math.abs(itemDate.getHours() - 12);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestItem = item;
        }
      }
    });

    if (bestItem) {
      result.push({ item: bestItem, date: targetDate });
    }
  });

  const futureCards = result
    .map(({ item, date }) => {
      const dayName = dayNames[date.getDay()] + '요일';
      const temp = Math.round(item.main.temp);
      const condition = item.weather[0].main.toLowerCase();
      const iconUrl = getWeatherEmojiUrl(condition);

      return `
        <div class="forecast-card">
          <div class="forecast-day">${dayName}</div>
          <div class="forecast-icon">
            <img src="${iconUrl}" alt="${condition}">
          </div>
          <div class="forecast-temp">${temp}°C</div>
        </div>
      `;
    })
    .join('');

  // 오늘 카드 + 이후 날짜 카드 합치기
  weeklyForecast.innerHTML = todayCard + futureCards;
}

function updateWeatherUI(data) {
  const temp = Math.round(data.main.temp);
  animateTemperature(temp);
  cityName.textContent = data.name;

  const weatherCondition = data.weather[0].main.toLowerCase();
  weatherIcon.innerHTML = getWeatherEmoji(weatherCondition);
  updateBackground(weatherCondition);
  weatherMessage.textContent = getWeatherSuggestion(weatherCondition, temp);

  const tempMax = Math.round(data.main.temp_max);
  const tempMin = Math.round(data.main.temp_min);
  tempRange.textContent = `${tempMax}°C / ${tempMin}°C`;

  feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${(data.wind.speed * 3.6).toFixed(2)}km/h`;
  cloudy.textContent = `${data.clouds.all}%`;
  pressure.textContent = `${data.main.pressure}hPa`;
  visibility.textContent = `${(data.visibility / 1000).toFixed(1)}km`;

  sunrise.textContent = formatTime(new Date(data.sys.sunrise * 1000));
  sunset.textContent = formatTime(new Date(data.sys.sunset * 1000));
}

function animateTemperature(targetTemp) {
  const duration = 1000;
  const steps = 30;
  const increment = targetTemp / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current = Math.round(increment * step);
    if (step >= steps) {
      current = targetTemp;
      clearInterval(timer);
    }
    temperature.textContent = `${current}°C`;
  }, duration / steps);
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getWeatherSuggestion(condition, temp) {
  if (condition.includes('rain') || condition.includes('drizzle'))
    return '☔ 우산을 챙기세요!';
  if (condition.includes('snow')) return '⛄ 눈이 내려요! 따뜻하게 입으세요.';
  if (condition.includes('thunderstorm'))
    return '⚡ 천둥번개가 쳐요! 실내에 계세요.';
  if (condition.includes('clear')) {
    if (temp > 25) return '🌞 외출하기 좋은 날씨예요!';
    if (temp < 5) return '🧥 춥네요! 두껍게 입으세요.';
    return '☀️ 맑고 화창한 날이에요!';
  }
  if (condition.includes('cloud'))
    return '☁️ 흐린 날씨네요. 좋은 하루 보내세요!';
  if (
    condition.includes('mist') ||
    condition.includes('fog') ||
    condition.includes('haze')
  )
    return '🌫️ 안개가 짙어요. 운전 조심하세요!';
  return '😊 좋은 하루 보내세요!';
}

function getWeatherEmoji(condition) {
  return `<img src="${getWeatherEmojiUrl(condition)}" alt="weather icon">`;
}

function getWeatherEmojiUrl(condition) {
  const map = {
    clear: 'img/clear.gif',
    clouds: 'img/cloudy.gif',
    rain: 'img/rain.gif',
    snow: 'img/snow.gif',
    drizzle: 'img/rain.gif',
    thunderstorm: 'img/rain.gif',
    mist: 'img/cloudy.gif',
    fog: 'img/cloudy.gif',
    haze: 'img/cloudy.gif',
  };
  return map[condition] || 'img/clear.gif';
}

function isNightTime() {
  const hour = new Date().getHours();
  // 19시(오후 7시) ~ 익일 6시 → 밤
  return hour >= 19 || hour < 6;
}

function updateBackground(condition) {
  const night = isNightTime();
  let src;

  if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('thunderstorm')
  ) {
    // 비/눈/천둥은 낮밤 동일 gif (이미 어두운 느낌)
    src = 'img/rain.gif';
  } else if (condition.includes('snow')) {
    src = night ? 'img/night.png' : 'img/snow.gif';
  } else {
    // clear, clouds, mist, haze 등 모두
    src = night ? 'img/night.png' : 'img/w1.gif';
  }

  backgroundVideo.src = src;
}

function togglePanel() {
  searchPanel.classList.toggle('hidden');
  // 모바일에서 패널 닫으면 날씨 영역 전체 확장
  const weatherMain = document.querySelector('.weather-main');
  if (window.innerWidth <= 768) {
    weatherMain.classList.toggle(
      'expanded',
      searchPanel.classList.contains('hidden'),
    );
  }
}
