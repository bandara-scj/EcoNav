import React from 'react';
import { ItineraryItem } from '../types';
import { MapPin, Leaf, ExternalLink, Activity, Info } from 'lucide-react';

interface ItineraryCardProps {
  item: ItineraryItem;
  onLocate?: () => void;
}

export default function ItineraryCard({ item, onLocate }: ItineraryCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0 bg-emerald-100 text-emerald-800 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold">
          <span className="text-xs uppercase tracking-wider opacity-80">Day</span>
          <span className="text-xl leading-none">{item.day}</span>
        </div>
        
        <div className="flex-grow space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-stone-500 text-sm font-medium mb-1">
                <MapPin className="w-4 h-4" />
                {item.location_name}
              </div>
              <h4 className="text-xl font-bold text-stone-900">{item.activity_title}</h4>
            </div>
            {onLocate && item.coordinates && item.coordinates.lat && item.coordinates.lng && (
              <button 
                onClick={onLocate}
                className="flex-shrink-0 bg-stone-100 hover:bg-stone-200 text-stone-600 p-2 rounded-xl transition-colors"
                title="View on Map"
              >
                <MapPin className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <p className="text-stone-600 leading-relaxed text-sm">
            {item.description}
          </p>
          
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-emerald-900 mb-1">Sustainability Factor</h5>
                <p className="text-sm text-emerald-800 mb-2">{item.sustainability_factor}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${i < item.sustainability_rating ? 'bg-emerald-500' : 'bg-emerald-200'}`}
                    />
                  ))}
                  <span className="text-xs font-medium text-emerald-700 ml-2">{item.sustainability_rating}/5 Rating</span>
                </div>

                {item.eco_friendly_practices && item.eco_friendly_practices.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <h6 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Eco Practices</h6>
                    <ul className="text-xs text-emerald-800 list-disc list-inside">
                      {item.eco_friendly_practices.map((practice, idx) => (
                        <li key={idx}>{practice}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="text-xs text-stone-500 font-medium mb-1 uppercase tracking-wider">Carbon Emitted</div>
              <div className="text-lg font-bold text-stone-800">{item.carbon_emitted_kg} <span className="text-sm font-normal text-stone-500">kg CO₂</span></div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="text-xs text-stone-500 font-medium mb-1 uppercase tracking-wider">Carbon Offset</div>
              <div className="text-lg font-bold text-emerald-600">{item.carbon_offset_kg} <span className="text-sm font-normal text-emerald-600/70">kg CO₂</span></div>
            </div>
          </div>
          
          {(item.actionable_links?.website || item.actionable_links?.contact) && (
            <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-3">
              {item.actionable_links.website && item.actionable_links.website !== "N/A" && (
                <a 
                  href={item.actionable_links.website.startsWith('http') ? item.actionable_links.website : `https://${item.actionable_links.website}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Website
                </a>
              )}
              {item.actionable_links.contact && item.actionable_links.contact !== "N/A" && (
                <div className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg">
                  <Info className="w-4 h-4" />
                  {item.actionable_links.contact}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
