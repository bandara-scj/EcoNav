import { GoogleGenAI, Type } from "@google/genai";
import { EcoItinerary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateEcoItinerary(
  origin: string,
  destination: string,
  duration: number,
  interests: string,
  modeOfTravel: string,
  startDate: string,
  endDate: string,
  accommodationPreference: string
): Promise<EcoItinerary> {
  const prompt = `
    Role: You are "EcoNavigator," an advanced, multimodal sustainable travel agent specializing in carbon-neutral tourism.
    
    Objective: Analyze user travel inputs, calculate initial carbon footprints, and generate a dynamic, interactive, and customized itinerary for the exact number of days the user specifies. You prioritize eco-friendly transport, sustainable accommodations, and activities that offer carbon offsets or are carbon-neutral.
    
    User Inputs:
    - Origin: ${origin}
    - Destination: ${destination}
    - Duration: ${duration} days
    - Dates of Travel: ${startDate} to ${endDate}
    - Interests/Regions: ${interests}
    - Mode of Travel: ${modeOfTravel}
    - Accommodation Preference: ${accommodationPreference}
    
    Workflow Instructions:
    1. Carbon Calculation (Baseline): Calculate an estimated carbon footprint (in kg CO2e) for the user's arrival journey based on standard transport emission factors from their origin to ${destination}. If the tourist is travelling in an Airbus or similar commercial flight, calculate the per-seat count for a rough estimation.
    2. Dynamic Itinerary Generation: Create a daily plan for the exact number of days requested (${duration} days). For each day, provide:
       - A primary location/region in ${destination}.
       - 1-2 sustainable activities (e.g., mangrove planting, visiting certified eco-estates, wildlife conservation projects).
       - Estimated carbon emitted by the activity/local transport vs. carbon offset by the activity.
    3. Places to Stay & En Route Activities: Provide a list of 2-3 sustainable places to stay that strictly match the user's Accommodation Preference (${accommodationPreference}). Use Google Search to find real, reliable data sources for these accommodations, verifying their sustainability credentials (e.g., eco-lodges, carbon-neutral hotels, green certifications). Also provide 2-3 en-route activities (e.g., scenic stops, local markets) with their coordinates.
    4. Eco-Friendly Attractions: Provide 3-4 top eco-friendly attractions or activities at the destination. For each, include a name, description, a sustainability highlight, coordinates, and a single-word 'image_keyword' (e.g., 'waterfall', 'forest', 'museum') to be used for fetching a placeholder image.
    5. Seasonal Events & Activities: Use Google Search to find real events, festivals, or seasonal activities happening in ${destination} specifically between ${startDate} and ${endDate}. Provide 2-3 suggestions.
    6. Current Events & Fact-Checking: Use Google Search to discuss current events, cite recent news, or fact-check information related to the destination and activities. Include this context in the description.
    7. Tone: Encouraging, informative, and deeply knowledgeable about ${destination}'s geography and sustainable practices.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          user_journey: {
            type: Type.OBJECT,
            properties: {
              origin: { type: Type.STRING },
              destination: { type: Type.STRING },
              start_date: { type: Type.STRING },
              end_date: { type: Type.STRING },
              duration_days: { type: Type.INTEGER },
              arrival_carbon_footprint_kg: { type: Type.NUMBER },
              mode_of_travel: { type: Type.STRING },
              accommodation_preference: { type: Type.STRING },
            },
            required: [
              "origin",
              "destination",
              "start_date",
              "end_date",
              "duration_days",
              "arrival_carbon_footprint_kg",
              "mode_of_travel",
              "accommodation_preference",
            ],
          },
          total_trip_metrics: {
            type: Type.OBJECT,
            properties: {
              total_emitted_kg: { type: Type.NUMBER },
              total_offset_kg: { type: Type.NUMBER },
              net_carbon_status: { type: Type.STRING },
            },
            required: [
              "total_emitted_kg",
              "total_offset_kg",
              "net_carbon_status",
            ],
          },
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                location_name: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                  },
                  required: ["lat", "lng"],
                },
                activity_title: { type: Type.STRING },
                description: { type: Type.STRING },
                sustainability_factor: { type: Type.STRING },
                sustainability_rating: { type: Type.NUMBER, description: "Rating out of 5 for sustainability" },
                eco_friendly_practices: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of eco-friendly practices for the accommodation or activity"
                },
                carbon_emitted_kg: { type: Type.NUMBER },
                carbon_offset_kg: { type: Type.NUMBER },
                actionable_links: {
                  type: Type.OBJECT,
                  properties: {
                    website: { type: Type.STRING },
                    contact: { type: Type.STRING },
                  },
                  required: ["website", "contact"],
                },
              },
              required: [
                "day",
                "location_name",
                "coordinates",
                "activity_title",
                "description",
                "sustainability_factor",
                "sustainability_rating",
                "eco_friendly_practices",
                "carbon_emitted_kg",
                "carbon_offset_kg",
                "actionable_links",
              ],
            },
          },
          places_to_stay: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                  },
                  required: ["lat", "lng"],
                },
                sustainability_rating: { type: Type.NUMBER },
                eco_friendly_practices: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                price_range: { type: Type.STRING },
              },
              required: ["name", "description", "coordinates", "sustainability_rating", "eco_friendly_practices", "price_range"],
            },
          },
          en_route_activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                  },
                  required: ["lat", "lng"],
                },
                duration_hours: { type: Type.NUMBER },
              },
              required: ["name", "description", "coordinates", "duration_hours"],
            },
          },
          eco_attractions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                image_keyword: { type: Type.STRING },
                sustainability_highlight: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                  },
                  required: ["lat", "lng"],
                },
              },
              required: ["name", "description", "image_keyword", "sustainability_highlight", "coordinates"],
            },
          },
          seasonal_events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
              },
              required: ["name", "date", "description", "type"],
            },
          },
        },
        required: ["user_journey", "total_trip_metrics", "itinerary", "places_to_stay", "en_route_activities", "eco_attractions", "seasonal_events"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(text) as EcoItinerary;
}
