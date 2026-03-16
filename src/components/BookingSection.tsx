import React, { useState } from 'react';
import { Plane, Hotel, Loader2, Calendar, Users, MapPin, Search } from 'lucide-react';

interface BookingSectionProps {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export default function BookingSection({ origin, destination, startDate, endDate }: BookingSectionProps) {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Note: Amadeus API requires IATA codes (e.g., LHR, JFK) for flights and city codes for hotels.
  // In a full production app, we would use an autocomplete API to map city names to IATA codes.
  // For this prototype, we'll ask the user to enter IATA codes or we'll try to use the first 3 letters.
  const [originCode, setOriginCode] = useState(origin.substring(0, 3).toUpperCase());
  const [destCode, setDestCode] = useState(destination.substring(0, 3).toUpperCase());
  const [adults, setAdults] = useState('1');

  const searchFlights = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLocationCode: originCode,
          destinationLocationCode: destCode,
          departureDate: startDate,
          adults: parseInt(adults, 10),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch flights');
      }

      const data = await response.json();
      setFlights(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchHotels = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hotels/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityCode: destCode,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch hotels');
      }

      const data = await response.json();
      setHotels(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 mt-12">
      <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
        <Plane className="w-6 h-6 text-emerald-600" />
        Book Your Travel
      </h3>

      <div className="flex space-x-4 mb-6 border-b border-stone-200 pb-4">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
            activeTab === 'flights'
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Plane className="w-4 h-4" /> Flights
        </button>
        <button
          onClick={() => setActiveTab('hotels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
            activeTab === 'hotels'
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Hotel className="w-4 h-4" /> Accommodations
        </button>
      </div>

      {activeTab === 'flights' && (
        <div>
          <form onSubmit={searchFlights} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Origin (IATA)</label>
              <input
                type="text"
                value={originCode}
                onChange={(e) => setOriginCode(e.target.value.toUpperCase())}
                maxLength={3}
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g., LHR"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Dest (IATA)</label>
              <input
                type="text"
                value={destCode}
                onChange={(e) => setDestCode(e.target.value.toUpperCase())}
                maxLength={3}
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g., JFK"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Adults</label>
              <input
                type="number"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                min={1}
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Search</>}
              </button>
            </div>
          </form>

          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm mb-4">{error}</div>}

          {flights.length > 0 && (
            <div className="space-y-4">
              {flights.map((flight, idx) => (
                <div key={idx} className="border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-emerald-300 transition-colors">
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-bold text-lg">{flight.itineraries[0].segments[0].departure.iataCode}</span>
                      <Plane className="w-4 h-4 text-stone-400" />
                      <span className="font-bold text-lg">{flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode}</span>
                    </div>
                    <div className="text-sm text-stone-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {new Date(flight.itineraries[0].segments[0].departure.at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-700 mb-1">
                      {flight.price.total} {flight.price.currency}
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full text-sm font-bold transition-colors">
                      Book Flight
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hotels' && (
        <div>
          <form onSubmit={searchHotels} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">City (IATA)</label>
              <input
                type="text"
                value={destCode}
                onChange={(e) => setDestCode(e.target.value.toUpperCase())}
                maxLength={3}
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g., PAR"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Search</>}
              </button>
            </div>
          </form>

          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm mb-4">{error}</div>}

          {hotels.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hotels.slice(0, 6).map((hotel, idx) => (
                <div key={idx} className="border border-stone-200 rounded-2xl p-4 hover:border-emerald-300 transition-colors flex flex-col">
                  <h4 className="font-bold text-stone-900 mb-2">{hotel.name}</h4>
                  <div className="text-sm text-stone-500 flex items-start gap-2 mb-4 flex-grow">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{hotel.iataCode} - {hotel.address?.countryCode}</span>
                  </div>
                  <button className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors mt-auto">
                    View Rooms
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
