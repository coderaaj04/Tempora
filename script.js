// Wind direction
function windDir(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
}

//Weather
async function getWeather(cityInputValue = null) {

    let city = cityInputValue || document.getElementById("cityInput").value.trim();

    if (!city) {
        alert("Enter city");
        return;
    }

    const loader = document.getElementById("loader");
    loader.classList.remove("d-none");

    try {
        let lat, lon, name;

        // location input
        if (city.includes(",")) {
            [lat, lon] = city.split(",");
            name = "Current Location";
        } else {
            const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
            const geoData = await geo.json();

            if (!geoData.results) {
                alert("City not found");
                loader.classList.add("d-none");
                return;
            }

            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            name = geoData.results[0].name;
        }

        // Weather API
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}
&current_weather=true
&hourly=relative_humidity_2m,apparent_temperature,pressure_msl,windspeed_10m,winddirection_10m
&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max
&timezone=auto`
        );

        const data = await res.json();

        // AQI
        const aqiRes = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`
        );
        const aqiData = await aqiRes.json();

        // Values
        const temp = data.current_weather.temperature;
        const humidity = data.hourly.relative_humidity_2m[0];
        const pressure = data.hourly.pressure_msl[0];
        const wind = data.hourly.windspeed_10m[0];
        const dir = windDir(data.hourly.winddirection_10m[0]);
        const uv = data.daily.uv_index_max[0];
        const sunrise = data.daily.sunrise[0].split("T")[1];
        const sunset = data.daily.sunset[0].split("T")[1];
        const aqi = aqiData.hourly.us_aqi[0];

        // Show weather
        const box = document.getElementById("weatherBox");
        box.classList.remove("d-none");

        box.innerHTML = `
<h3>${name}</h3>
<h1>${temp}°C</h1>

<div class="row mt-3 text-center">

<div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🌫 Air Quality</small><br>
            <strong>AQI ${aqi}</strong>
        </div>
    </div>
    
    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>💧 Humidity</small><br>
            <strong>${humidity}%</strong>
        </div>
    </div>

    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🌡 Pressure</small><br>
            <strong>${pressure} hPa</strong>
        </div>
    </div>

    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🌬 Wind Speed</small><br>
            <strong>${wind} km/h</strong>
        </div>
    </div>

    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🧭 Direction</small><br>
            <strong>${dir}</strong>
        </div>
    </div>

    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🔆 UV Index</small><br>
            <strong>${uv}</strong>
        </div>
    </div>

    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🌅 Sunrise</small><br>
            <strong>${sunrise}</strong>
        </div>
    </div>

    <div class="col-md-4 col-6 mb-3">
        <div class="card p-2">
            <small>🌇 Sunset</small><br>
            <strong>${sunset}</strong>
        </div>
    </div>

    

</div>
`;

        // Forecast
        const forecast = document.getElementById("forecast");
        forecast.innerHTML = "";

        for (let i = 0; i < 5; i++) {

            const date = new Date(data.daily.time[i]);
            const day = date.toLocaleDateString("en-US", { weekday: "short" });

            forecast.innerHTML += `
    <div class="col-md-2 col-6">
        <div class="card p-3 text-center mt-2">

            <h6>${day}</h6>
            <small>${data.daily.time[i]}</small>

            <h5 class="mt-2">
                ${data.daily.temperature_2m_max[i]}° / 
                ${data.daily.temperature_2m_min[i]}°
            </h5>

            <p class="mb-1">🔆 UV Index: ${data.daily.uv_index_max[i]}</p>

        </div>
    </div>`;
        }

    } catch {
        alert("Error fetching data");
    }

    loader.classList.add("d-none");
}

// Location (FIXED)
async function getLocation() {
    const input = document.getElementById("cityInput");

    if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser");
        return;
    }


    input.value = "Getting location...";

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;


                const geoRes = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`
                );
                const geoData = await geoRes.json();

                let cityName = "Your Location";

                if (geoData.results && geoData.results.length > 0) {
                    cityName = geoData.results[0].name;
                }

                input.value = cityName;

                getWeather(`${lat},${lon}`);

            } catch (err) {
                input.value = "";
                alert("Failed to get location data");
            }
        },

        (error) => {
            input.value = "";

            if (error.code === 1) {
                alert("Permission denied! Please allow location.");
            } else if (error.code === 2) {
                alert("Location unavailable.");
            } else {
                alert("Something went wrong!");
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Dark nd Light Mode
function toggleMode() {
    document.body.classList.toggle("light");

    const btn = document.getElementById("themeBtn");

    if (document.body.classList.contains("light")) {
        btn.innerText = "☀️";
    } else {
        btn.innerText = "🌙";
    }
}