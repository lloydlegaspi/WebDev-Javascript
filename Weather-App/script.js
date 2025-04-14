// OpenWeatherApp API 
const apikey = "a202947595cff89070b4b878816d045c";
const apiurl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

const searchBox = document.querySelector(".search-box input");
const searchBtn = document.querySelector(".search-box button");
const weatherIcon = document.querySelector(".weather img");


// App will check weather of location when user clicks the search button or presses enter
searchBtn.addEventListener("click", () => {
    const location = searchBox.value.trim();
    if (location) {
        checkWeather(location);
    }
});

searchBox.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        const location = searchBox.value.trim();
        if (location) {
            checkWeather(location);
        }
    }
});


// Check the weather of the location entered by the user
async function checkWeather(location) {
    // Get the weather data from the API
    try {
        const response = await fetch(apiurl + location + `&appid=${apikey}`);

        if (response.status == 404) {
            alert("Location not found");
            return;
        }

        // Store the response in variable 'data'
        const data = await response.json();

        // Update the UI with the contents of 'data'
        document.querySelector(".location").innerHTML = data.name;
        document.querySelector(".country").innerHTML = data.sys.country;
        document.querySelector(".temperature").innerHTML = Math.round(data.main.temp) + "<span>°C</span>";
        document.querySelector(".description").innerHTML = data.weather[0].description;
        document.querySelector(".info-humidity span").innerHTML = data.main.humidity + "%";
        document.querySelector(".info-wind span").innerHTML = data.wind.speed + " Km/h";

        // Update the date and time based on the timezone from the API response
        updateDateTime(data.timezone);

        // Dynamically set the weather icon based on the weather condition
        if (data.weather[0].main == "Clouds") {
            weatherIcon.src = "images/cloudy.png";
        }
        else if (data.weather[0].main == "Clear") {
            weatherIcon.src = "images/sunny.png";
        }
        else if (data.weather[0].main == "Rain") {
            weatherIcon.src = "images/rainy.png";
        }
        else if (data.weather[0].main == "Drizzle") {
            weatherIcon.src = "images/rainy.png";
        }
        else if (data.weather[0].main == "Mist" || data.weather[0].main == "Fog") {
            weatherIcon.src = "images/foggy.png";
        }
        else if (data.weather[0].main == "Snow") {
            weatherIcon.src = "images/snowy.png";
        }
        else if (data.weather[0].main == "Wind") {
            weatherIcon.src = "images/windy.png";
        }

        // Get the forecast data for the location
        await getForecast(location);

    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

// Update the date and time based on the timezone from the API response
function updateDateTime(timezone) {
    const now = new Date();
    const localTime = new Date(now.getTime() + (timezone * 1000));

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const day = days[localTime.getUTCDay()];
    const date = localTime.getUTCDate();
    const month = months[localTime.getUTCMonth()];

    let hours = localTime.getUTCHours();
    const minutes = localTime.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    document.querySelector(".date").textContent = `${day}, ${month} ${date}`;
    document.querySelector(".time").textContent = `${hours}:${formattedMinutes} ${ampm}`;
}

async function getForecast(location) {
    // Get the forecast data from the API
    try {
        const response = await fetch(forecastApiUrl + location + `&appid=${apikey}`);

        if (response.status !== 200) {
            return;
        }

        // Store the response in variable 'forecastData'
        const forecastData = await response.json();

        // Create a variable to store the daily forecasts
        const dailyForecasts = {};
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];

        // Loop through the forecast data and extract the daily forecasts
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = weekdays[date.getDay()];

            if (!dailyForecasts[day] && date.getHours() >= 12 && date.getHours() <= 15) {
                dailyForecasts[day] = {
                    temp: Math.round(item.main.temp),
                    weather: item.weather[0].main
                };
            }
        });

        const dayForecasts = document.querySelectorAll(".day-forecast");
        const nextDays = Object.keys(dailyForecasts).slice(0, 5);

        // Update the forecast elements with the next 5 days 
        nextDays.forEach((day, index) => {
            if (index < dayForecasts.length && dailyForecasts[day]) {
                const forecast = dailyForecasts[day];

                dayForecasts[index].querySelector(".day").textContent = day;
                dayForecasts[index].querySelector(".temp").innerHTML = forecast.temp + "<span>°C</span>";

                // Set appropriate weather icon
                const iconElement = dayForecasts[index].querySelector(".icon");

                if (forecast.weather == "Clouds") {
                    iconElement.src = "images/cloudy.png";
                }
                else if (forecast.weather == "Clear") {
                    iconElement.src = "images/sunny.png";
                }
                else if (forecast.weather == "Rain") {
                    iconElement.src = "images/rainy.png";
                }
                else if (forecast.weather == "Snow") {
                    iconElement.src = "images/snowy.png";
                }
                else if (forecast.weather == "Wind") {
                    iconElement.src = "images/windy.png";
                }
            }
        });

    } catch (error) {
        console.error("Error fetching forecast data:", error);
    }
}

// Default location to check weather when the page loads
window.addEventListener("load", () => {
    checkWeather("Manila");
});