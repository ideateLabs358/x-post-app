import requests
import argparse

def get_weather(city, api_key):
    """Fetches weather data for a given city."""
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": api_key,
        "units": "metric",  # Use "imperial" for Fahrenheit
        "lang": "ja"
    }
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return None

def display_weather(weather_data):
    """Displays the weather information."""
    if not weather_data:
        return

    if weather_data.get("cod") != 200:
        print(f"Error: {weather_data.get('message', 'Unknown error')}")
        return

    main = weather_data.get("main", {})
    weather = weather_data.get("weather", [{}])[0]
    wind = weather_data.get("wind", {})
    
    print(f"--- {weather_data.get('name')}の天気 ---")
    print(f"概要: {weather.get('description', 'N/A')}")
    print(f"気温: {main.get('temp', 'N/A')}°C")
    print(f"体感気温: {main.get('feels_like', 'N/A')}°C")
    print(f"湿度: {main.get('humidity', 'N/A')}%")
    print(f"風速: {wind.get('speed', 'N/A')} m/s")

def main():
    """Main function to parse arguments and run the app."""
    parser = argparse.ArgumentParser(description="Simple command-line weather app.")
    parser.add_argument("city", help="The city to get the weather for.")
    # In a real application, use a more secure way to handle API keys
    parser.add_argument("--apikey", required=True, help="Your OpenWeatherMap API key.")
    args = parser.parse_args()

    weather_data = get_weather(args.city, args.apikey)
    display_weather(weather_data)

if __name__ == "__main__":
    main()
