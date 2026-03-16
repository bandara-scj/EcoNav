<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🧪 Reproducible Testing Instructions

To help judges easily evaluate EcoNavigator, follow these steps to test the core multimodal and agentic features locally.

### 1. Complete Environment Setup
In addition to the Gemini API key, EcoNavigator integrates with external travel APIs. Ensure your `.env.local` file contains the following:
* `GEMINI_API_KEY`=your_api_key (Required for the core AI agent logic)
* `AMADEUS_CLIENT_ID`=your_amadeus_key (Required to test the live booking section)
* `AMADEUS_CLIENT_SECRET`=your_amadeus_secret (Required for the live booking section)
* `VITE_GOOGLE_MAPS_API_KEY`=your_google_maps_key (Optional: used for fetching real Street View images on the map)

### 2. Start the Application
Run `npm run dev` and open the provided `localhost` link in your browser.

### 3. Step-by-Step Test Scenarios

**Test Scenario 1: Initial AI Itinerary Generation**
1.  On the main dashboard, locate the user input area.
2.  Provide the following test prompt (you can type this or use the voice input button):
    > *"I am flying from London to Colombo, Sri Lanka. I want a 3-day eco-friendly itinerary focusing on the central highlands and sustainable tea estates."*
3.  **Expected Result:** The AI agent will process the request. The Leaflet map will populate with 3 days of localized sustainable activities in Sri Lanka, and the Carbon Metrics Dashboard will update to show your initial carbon footprint vs. projected offsets.

**Test Scenario 2: Dynamic UI Navigation (Function Calling)**
1.  Once the first itinerary is loaded on the map, test the agent's function-calling capability by giving it a modification command.
2.  Type or say: 
    > *"Actually, swap my Day 2 activity for mangrove planting in Negombo instead."*
3.  **Expected Result:** The agent should interpret the intent, trigger a function to update the UI without reloading the page, move the Day 2 marker to Negombo, and dynamically recalculate the charts on the Metrics Dashboard.

**Test Scenario 3: Exploring the Interactive Cards & Booking**
1.  Click on any generated marker on the interactive map.
2.  **Expected Result:** An `ItineraryCard` will pop up displaying the activity name, the specific carbon offset value (e.g., "-15kg CO2"), and actionable links connecting to the Amadeus booking integration.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7fcc1774-4e2a-4dd3-a67d-09cdec26c09a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
