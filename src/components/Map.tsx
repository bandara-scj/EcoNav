import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { EcoItinerary } from '../types';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const activityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stayIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const enRouteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  itineraryData: EcoItinerary;
  selectedLocation?: { lat: number; lng: number } | null;
}

function MapUpdater({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  return null;
}

function MapCenterer({ location }: { location: { lat: number; lng: number } | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 12, { animate: true });
    }
  }, [location, map]);
  return null;
}

export default function Map({ itineraryData, selectedLocation }: MapProps) {
  const { itinerary, places_to_stay, en_route_activities, eco_attractions } = itineraryData;

  const itineraryCoords: [number, number][] = itinerary
    .filter(item => item.coordinates && item.coordinates.lat && item.coordinates.lng)
    .map(item => [item.coordinates.lat, item.coordinates.lng]);

  const stayCoords: [number, number][] = (places_to_stay || [])
    .filter(item => item.coordinates && item.coordinates.lat && item.coordinates.lng)
    .map(item => [item.coordinates.lat, item.coordinates.lng]);

  const enRouteCoords: [number, number][] = (en_route_activities || [])
    .filter(item => item.coordinates && item.coordinates.lat && item.coordinates.lng)
    .map(item => [item.coordinates.lat, item.coordinates.lng]);

  const ecoAttractionCoords: [number, number][] = (eco_attractions || [])
    .filter(item => item.coordinates && item.coordinates.lat && item.coordinates.lng)
    .map(item => [item.coordinates.lat, item.coordinates.lng]);

  const allCoords = [...itineraryCoords, ...stayCoords, ...enRouteCoords, ...ecoAttractionCoords];
  const center: [number, number] = allCoords.length > 0 ? allCoords[0] : [0, 0];

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-sm border border-stone-200 relative z-0">
      <MapContainer center={center} zoom={4} className="w-full h-full min-h-[500px]">
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        {/* Eco Attractions Markers */}
        {(eco_attractions || []).map((attraction, index) => (
          attraction.coordinates && attraction.coordinates.lat && attraction.coordinates.lng && (
            <Marker 
              key={`eco-${index}`} 
              position={[attraction.coordinates.lat, attraction.coordinates.lng]}
              icon={activityIcon} // Reusing green icon for eco attractions
            >
              <Popup className="rounded-xl">
                <div className="p-1 max-w-[200px]">
                  <div className="text-xs font-bold text-emerald-600 mb-1">Eco-Attraction</div>
                  <h3 className="font-bold text-stone-800 text-sm mb-1">{attraction.name}</h3>
                  <p className="text-xs text-stone-600 mb-2 line-clamp-3">{attraction.description}</p>
                  <button 
                    onClick={() => {
                      // Scroll to the attraction card
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-1.5 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Itinerary Markers */}
        {itinerary.map((item, index) => (
          item.coordinates && item.coordinates.lat && item.coordinates.lng && (
            <Marker 
              key={`itinerary-${index}`} 
              position={[item.coordinates.lat, item.coordinates.lng]}
              icon={activityIcon}
            >
              <Popup className="rounded-xl">
                <div className="p-1 max-w-[200px]">
                  <div className="text-xs font-bold text-emerald-600 mb-1">Day {item.day}</div>
                  <h3 className="font-bold text-stone-800 text-sm mb-1">{item.location_name}</h3>
                  <p className="text-xs text-stone-600 mb-2 line-clamp-2">{item.activity_title}</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 mb-2">
                    <span>🌱</span> {item.sustainability_rating}/5 Eco Rating
                  </div>
                  <button 
                    onClick={() => {
                      window.scrollTo({ top: document.getElementById('itinerary-list')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    className="w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-1.5 rounded-md transition-colors"
                  >
                    View Itinerary
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Places to Stay Markers */}
        {(places_to_stay || []).map((place, index) => (
          place.coordinates && place.coordinates.lat && place.coordinates.lng && (
            <Marker 
              key={`stay-${index}`} 
              position={[place.coordinates.lat, place.coordinates.lng]}
              icon={stayIcon}
            >
              <Popup className="rounded-xl">
                <div className="p-1 max-w-[200px]">
                  <div className="text-xs font-bold text-blue-600 mb-1">Accommodation</div>
                  <h3 className="font-bold text-stone-800 text-sm mb-1">{place.name}</h3>
                  <p className="text-xs text-stone-600 mb-2">{place.price_range}</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-2">
                    <span>🌱</span> {place.sustainability_rating}/5 Eco Rating
                  </div>
                  <button 
                    onClick={() => {
                      window.scrollTo({ top: document.getElementById('places-to-stay')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-1.5 rounded-md transition-colors"
                  >
                    View Accommodation
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* En Route Activities Markers */}
        {(en_route_activities || []).map((activity, index) => (
          activity.coordinates && activity.coordinates.lat && activity.coordinates.lng && (
            <Marker 
              key={`enroute-${index}`} 
              position={[activity.coordinates.lat, activity.coordinates.lng]}
              icon={enRouteIcon}
            >
              <Popup className="rounded-xl">
                <div className="p-1 max-w-[200px]">
                  <div className="text-xs font-bold text-orange-600 mb-1">En Route Activity</div>
                  <h3 className="font-bold text-stone-800 text-sm mb-1">{activity.name}</h3>
                  <p className="text-xs text-stone-600 mb-2">{activity.duration_hours} hours</p>
                  <button 
                    onClick={() => {
                      window.scrollTo({ top: document.getElementById('en-route-activities')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    className="w-full text-center bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold py-1.5 rounded-md transition-colors"
                  >
                    View Activity
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {itineraryCoords.length > 1 && (
          <Polyline 
            positions={itineraryCoords} 
            color="#059669" 
            weight={3} 
            opacity={0.7} 
            dashArray="10, 10" 
          />
        )}
        <MapUpdater coordinates={allCoords} />
        <MapCenterer location={selectedLocation} />
      </MapContainer>
    </div>
  );
}
