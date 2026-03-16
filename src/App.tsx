import React, { useState, useEffect } from "react";
import { EcoItinerary } from "./types";
import { generateEcoItinerary } from "./services/geminiService";
import Map from "./components/Map";
import ItineraryCard from "./components/ItineraryCard";
import MetricsDashboard from "./components/MetricsDashboard";
import { Leaf, MapPin, Calendar, Compass, Loader2, Mic, MicOff, Globe, ExternalLink, Share2 } from "lucide-react";
import { useLiveAPI } from "./hooks/useLiveAPI";
import LZString from "lz-string";

// Helper to fetch real images from Wikipedia
const useWikipediaImage = (title: string, fallbackKeyword: string) => {
  const [imageUrl, setImageUrl] = useState<string>(`https://picsum.photos/seed/${fallbackKeyword}/600/400`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}&origin=*`);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1" && pages[pageId].original) {
          setImageUrl(pages[pageId].original.source);
        } else {
          // Fallback to Street View if API key is available, else placeholder
          const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            // Need coordinates for Street View, but we don't have them in this hook easily unless passed.
            // We'll just use the placeholder if Wikipedia fails and no coords are passed.
          }
        }
      } catch (error) {
        console.error("Failed to fetch Wikipedia image", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, [title, fallbackKeyword]);

  return { imageUrl, loading };
};

const EcoAttractionCard = ({ attraction, onLocate }: { attraction: any, onLocate: () => void }) => {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
  const hasCoords = attraction.coordinates && attraction.coordinates.lat && attraction.coordinates.lng;
  
  // Use Street View if API key and coords exist, else try Wikipedia, else placeholder
  const streetViewUrl = apiKey && hasCoords 
    ? `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${attraction.coordinates.lat},${attraction.coordinates.lng}&key=${apiKey}`
    : null;

  const { imageUrl } = useWikipediaImage(attraction.name, attraction.image_keyword);
  const finalImageUrl = streetViewUrl || imageUrl;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-md transition-all group flex flex-col">
      <div className="h-48 overflow-hidden relative flex-shrink-0 cursor-pointer" onClick={onLocate}>
        <img 
          src={finalImageUrl} 
          alt={attraction.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm">
          <span>🌱</span> Eco-Featured
        </div>
        <div className="absolute bottom-3 right-3 bg-stone-900/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <MapPin className="w-3 h-3" /> View on Map
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-lg font-bold text-stone-900 mb-2 cursor-pointer hover:text-emerald-700 transition-colors" onClick={onLocate}>
          {attraction.name}
        </h4>
        <p className="text-sm text-stone-600 mb-4 flex-grow">{attraction.description}</p>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mt-auto">
          <p className="text-xs font-medium text-emerald-800">
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-80">Why it's sustainable</span>
            {attraction.sustainability_highlight}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interests, setInterests] = useState("");
  const [pastTravelChoices, setPastTravelChoices] = useState("");
  const [modeOfTravel, setModeOfTravel] = useState("");
  const [accommodationPreference, setAccommodationPreference] = useState("Any Sustainable Accommodation");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<EcoItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripData = params.get('trip');
    if (tripData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(tripData);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          setItinerary(parsed);
          
          // Pre-populate form fields if available in the journey
          if (parsed.user_journey) {
            setOrigin(parsed.user_journey.origin || "");
            setDestination(parsed.user_journey.destination || "");
            setStartDate(parsed.user_journey.start_date || "");
            setEndDate(parsed.user_journey.end_date || "");
            setInterests(parsed.user_journey.interests || "");
            setPastTravelChoices(parsed.user_journey.past_travel_choices || "");
            setModeOfTravel(parsed.user_journey.mode_of_travel || "");
            setAccommodationPreference(parsed.user_journey.accommodation_preference || "Any Sustainable Accommodation");
          }
        }
      } catch (e) {
        console.error("Failed to parse shared trip", e);
      }
    }
  }, []);

  const handleShare = () => {
    if (itinerary) {
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(itinerary));
      const url = new URL(window.location.href);
      url.searchParams.set('trip', compressed);
      
      navigator.clipboard.writeText(url.toString()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleItineraryReady = (o: string, dest: string, sd: string, ed: string, i: string, m: string, accPref: string, ptc: string) => {
    setOrigin(o);
    setDestination(dest);
    setStartDate(sd);
    setEndDate(ed);
    setInterests(i);
    setModeOfTravel(m);
    setAccommodationPreference(accPref);
    setPastTravelChoices(ptc);
    
    // Auto-submit the form
    generateItineraryFromData(o, dest, sd, ed, i, m, accPref, ptc);
  };

  const { connect, disconnect, isConnected, isConnecting, isSpeaking } = useLiveAPI({
    onItineraryReady: handleItineraryReady
  });

  const generateItineraryFromData = async (o: string, dest: string, sd: string, ed: string, i: string, m: string, accPref: string, ptc: string) => {
    setLoading(true);
    setError(null);
    try {
      let durationDays = 7;
      let start = new Date(sd);
      let end = new Date(ed);
      
      let validSd = sd;
      let validEd = ed;
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else {
        // Fallback if dates are invalid
        start = new Date();
        end = new Date();
        end.setDate(start.getDate() + 6);
        validSd = start.toISOString().split('T')[0];
        validEd = end.toISOString().split('T')[0];
        setStartDate(validSd);
        setEndDate(validEd);
      }

      const result = await generateEcoItinerary(o, dest, durationDays, i, m, validSd, validEd, accPref, ptc);
      setItinerary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    generateItineraryFromData(origin, destination, startDate, endDate, interests, modeOfTravel, accommodationPreference, pastTravelChoices);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-800">
              EcoNavigator
            </h1>
          </div>
          <div className="text-sm font-medium text-stone-500 hidden sm:block">
            Sustainable Travel Worldwide
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!itinerary ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-stone-900 tracking-tight mb-4">
                Plan Your Carbon-Neutral Journey
              </h2>
              <p className="text-lg text-stone-600 mb-8">
                Discover the world while minimizing your footprint. Tell us
                about your trip, or talk to our AI agent to craft a sustainable itinerary.
              </p>
              
              <div className="flex justify-center mb-8">
                <button
                  type="button"
                  onClick={isConnected ? disconnect : connect}
                  disabled={isConnecting || loading}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-md ${
                    isConnected 
                      ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200" 
                      : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isConnecting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isConnected ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                  {isConnecting 
                    ? "Connecting..." 
                    : isConnected 
                      ? "End Conversation" 
                      : "Talk to EcoNavigator"}
                </button>
              </div>
              
              {isConnected && (
                <div className="mb-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-300'}`}></div>
                    <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-pulse delay-75' : 'bg-emerald-300'}`}></div>
                    <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-pulse delay-150' : 'bg-emerald-300'}`}></div>
                  </div>
                  <p className="text-emerald-800 font-medium">
                    {isSpeaking ? "EcoNavigator is speaking..." : "Listening to you..."}
                  </p>
                  <p className="text-sm text-emerald-600 mt-2">
                    Tell me where you want to go, where you're from, for how long, and what you like!
                  </p>
                </div>
              )}

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-stone-400 text-sm font-medium">OR ENTER DETAILS MANUALLY</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="origin"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Where are you traveling from?
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        id="origin"
                        required
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="e.g., London, UK"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="destination"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Where are you traveling to?
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        id="destination"
                        required
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="e.g., Costa Rica"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="date"
                        id="startDate"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="date"
                        id="endDate"
                        required
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="modeOfTravel"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Mode of Travel (e.g., Airbus A320, Train, Car)
                    </label>
                    <div className="relative">
                      <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        id="modeOfTravel"
                        required
                        value={modeOfTravel}
                        onChange={(e) => setModeOfTravel(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="e.g., Airbus A320"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="accommodationPreference"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Accommodation Preference
                    </label>
                    <div className="relative">
                      <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <select
                        id="accommodationPreference"
                        required
                        value={accommodationPreference}
                        onChange={(e) => setAccommodationPreference(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none appearance-none"
                      >
                        <option value="Any Sustainable Accommodation">Any Sustainable Accommodation</option>
                        <option value="Eco-Lodge">Eco-Lodge</option>
                        <option value="Carbon-Neutral Hotel">Carbon-Neutral Hotel</option>
                        <option value="Green Certified Resort">Green Certified Resort</option>
                        <option value="Sustainable Homestay">Sustainable Homestay</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="interests"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      What are your interests?
                    </label>
                    <div className="relative">
                      <Compass className="absolute left-3 top-4 w-5 h-5 text-stone-400" />
                      <textarea
                        id="interests"
                        required
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none"
                        placeholder="e.g., Wildlife, beaches, tea plantations, ancient ruins..."
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pastTravelChoices"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Past Travel Choices (Optional)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-4 w-5 h-5 text-stone-400" />
                      <textarea
                        id="pastTravelChoices"
                        value={pastTravelChoices}
                        onChange={(e) => setPastTravelChoices(e.target.value)}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none"
                        placeholder="e.g., I loved my trip to Iceland for the nature, but I want something warmer."
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Crafting your eco-itinerary...
                    </>
                  ) : (
                    "Generate Sustainable Itinerary"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-stone-900">
                Your Eco-Itinerary
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full border border-emerald-200 shadow-sm flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Link Copied!' : 'Share Itinerary'}
                </button>
                <button
                  onClick={() => {
                    setItinerary(null);
                    window.history.replaceState(null, '', window.location.pathname);
                  }}
                  className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm"
                >
                  Plan Another Trip
                </button>
              </div>
            </div>

            <MetricsDashboard
              metrics={itinerary.total_trip_metrics}
              journey={itinerary.user_journey}
              itinerary={itinerary.itinerary}
            />

            {itinerary.eco_attractions && itinerary.eco_attractions.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-stone-900 mb-6">
                  Featured Eco-Attractions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itinerary.eco_attractions.map((attraction, index) => (
                    <EcoAttractionCard 
                      key={index} 
                      attraction={attraction} 
                      onLocate={() => {
                        if (attraction.coordinates && attraction.coordinates.lat && attraction.coordinates.lng) {
                          setSelectedLocation({ lat: attraction.coordinates.lat, lng: attraction.coordinates.lng });
                          // Scroll to map
                          window.scrollTo({ top: document.getElementById('map-container')?.offsetTop || 0, behavior: 'smooth' });
                        }
                      }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {itinerary.seasonal_events && itinerary.seasonal_events.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                  Events & Seasonal Activities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itinerary.seasonal_events.map((event, index) => (
                    <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {event.type}
                        </div>
                        <div className="text-sm font-medium text-stone-500">
                          {event.date}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-stone-900 mb-2">{event.name}</h4>
                      <p className="text-sm text-stone-600">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itinerary.alternative_destinations && itinerary.alternative_destinations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-emerald-600" />
                  Alternative Sustainable Destinations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itinerary.alternative_destinations.map((dest, index) => (
                    <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 hover:shadow-md transition-all">
                      <h4 className="text-xl font-bold text-stone-900 mb-1">{dest.name}</h4>
                      <p className="text-sm font-medium text-emerald-700 mb-3">{dest.country}</p>
                      <p className="text-sm text-stone-600 mb-4">{dest.description}</p>
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mb-3">
                        <p className="text-xs font-medium text-stone-700">
                          <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-80">Why we suggest this</span>
                          {dest.reason_for_suggestion}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-800">
                          <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-80">Sustainability Highlight</span>
                          {dest.sustainability_highlight}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6 order-1 lg:order-2" id="map-container">
                <div className="sticky top-24 h-[calc(100vh-8rem)]">
                  <Map itineraryData={itinerary} selectedLocation={selectedLocation} />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6 order-2 lg:order-1" id="itinerary-list">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-stone-800">
                    Daily Plan
                  </h3>
                  <span className="text-sm font-medium text-stone-500">
                    {itinerary.itinerary.length} Days
                  </span>
                </div>
                {itinerary.itinerary.map((item, index) => (
                  <ItineraryCard 
                    key={index} 
                    item={item} 
                    onLocate={() => {
                      if (item.coordinates && item.coordinates.lat && item.coordinates.lng) {
                        setSelectedLocation({ lat: item.coordinates.lat, lng: item.coordinates.lng });
                        window.scrollTo({ top: document.getElementById('map-container')?.offsetTop || 0, behavior: 'smooth' });
                      }
                    }}
                  />
                ))}

                {itinerary.places_to_stay && itinerary.places_to_stay.length > 0 && (
                  <div className="mt-12" id="places-to-stay">
                    <h3 className="text-xl font-bold text-stone-800 mb-4">
                      Eco-Friendly Accommodations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {itinerary.places_to_stay.map((place, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
                          <h4 className="font-bold text-stone-900 mb-1">{place.name}</h4>
                          <p className="text-sm text-stone-600 mb-3">{place.description}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-sm font-medium text-stone-500">{place.price_range}</span>
                            <div className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                              <span>🌱</span> {place.sustainability_rating}/5 Eco Rating
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {itinerary.en_route_activities && itinerary.en_route_activities.length > 0 && (
                  <div className="mt-8" id="en-route-activities">
                    <h3 className="text-xl font-bold text-stone-800 mb-4">
                      En Route Activities
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {itinerary.en_route_activities.map((activity, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
                          <h4 className="font-bold text-stone-900 mb-1">{activity.name}</h4>
                          <p className="text-sm text-stone-600 mb-3">{activity.description}</p>
                          <div className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-md inline-block">
                            ⏱ {activity.duration_hours} hours
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
