export interface UserJourney {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  arrival_carbon_footprint_kg: number;
  mode_of_travel: string;
  accommodation_preference: string;
  interests?: string;
  past_travel_choices?: string;
}

export interface TotalTripMetrics {
  total_emitted_kg: number;
  total_offset_kg: number;
  net_carbon_status: string;
}

export interface ItineraryItem {
  day: number;
  location_name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  activity_title: string;
  description: string;
  sustainability_factor: string;
  sustainability_rating: number;
  eco_friendly_practices: string[];
  carbon_emitted_kg: number;
  carbon_offset_kg: number;
  actionable_links: {
    website: string;
    contact: string;
  };
}

export interface PlaceToStay {
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  sustainability_rating: number;
  eco_friendly_practices: string[];
  price_range: string;
}

export interface EnRouteActivity {
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  duration_hours: number;
}

export interface EcoAttraction {
  name: string;
  description: string;
  image_keyword: string;
  sustainability_highlight: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface SeasonalEvent {
  name: string;
  date: string;
  description: string;
  type: string;
}

export interface AlternativeDestination {
  name: string;
  country: string;
  description: string;
  reason_for_suggestion: string;
  sustainability_highlight: string;
}

export interface EcoItinerary {
  user_journey: UserJourney;
  total_trip_metrics: TotalTripMetrics;
  itinerary: ItineraryItem[];
  places_to_stay: PlaceToStay[];
  en_route_activities: EnRouteActivity[];
  eco_attractions: EcoAttraction[];
  seasonal_events: SeasonalEvent[];
  alternative_destinations?: AlternativeDestination[];
}
