# Command-Line Weather App

A simple Python script to fetch and display the current weather for a specified city using the OpenWeatherMap API.

## Setup

1.  **Clone the repository or download the files.**
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Get an API Key:**
    - Sign up for a free account on [OpenWeatherMap](https://openweathermap.org/appid) to get your API key.

## Usage

Run the script from your terminal:

```bash
python main.py "YourCity" --apikey "YOUR_API_KEY"
```

Replace `"YourCity"` with the name of the city you want to check and `"YOUR_API_KEY"` with the key you obtained from OpenWeatherMap.

### Example

```bash
python main.py "Tokyo" --apikey "YOUR_API_KEY"
```
