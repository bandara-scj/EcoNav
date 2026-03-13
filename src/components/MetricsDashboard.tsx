import React from 'react';
import { TotalTripMetrics, UserJourney, ItineraryItem } from '../types';
import { Plane, Leaf, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricsDashboardProps {
  metrics: TotalTripMetrics;
  journey: UserJourney;
  itinerary: ItineraryItem[];
}

export default function MetricsDashboard({ metrics, journey, itinerary }: MetricsDashboardProps) {
  const netCarbon = metrics.total_emitted_kg - metrics.total_offset_kg;
  const isNeutralOrPositive = netCarbon <= 0;

  const chartData = itinerary.map(item => ({
    name: `Day ${item.day}`,
    Emitted: item.carbon_emitted_kg,
    Offset: item.carbon_offset_kg,
  }));

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 md:col-span-3 lg:col-span-1">
          <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Journey Overview</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-stone-50 p-3 rounded-xl border border-stone-100 text-center">
              <div className="text-xs text-stone-500 font-medium mb-1">Origin</div>
              <div className="font-bold text-stone-800 truncate" title={journey.origin}>{journey.origin}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 flex-shrink-0" />
            <div className="flex-1 bg-stone-50 p-3 rounded-xl border border-stone-100 text-center">
              <div className="text-xs text-stone-500 font-medium mb-1">Destination</div>
              <div className="font-bold text-stone-800 truncate" title={journey.destination}>{journey.destination}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Plane className="w-4 h-4" />
              <span>{journey.mode_of_travel}</span>
            </div>
            <div className="font-medium text-stone-800">
              {journey.start_date && journey.end_date ? `${journey.start_date} to ${journey.end_date}` : `${journey.duration_days} Days`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Carbon Footprint</h3>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black text-stone-800 leading-none">{metrics.total_emitted_kg}</span>
            <span className="text-stone-500 font-medium mb-1">kg CO₂e</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-red-400 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-xs text-stone-500 mt-2">Total emissions including travel and activities</p>
        </div>

        <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-center relative overflow-hidden ${isNeutralOrPositive ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-stone-200'}`}>
          {isNeutralOrPositive && (
            <div className="absolute -right-6 -top-6 opacity-10">
              <Leaf className="w-32 h-32" />
            </div>
          )}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isNeutralOrPositive ? 'text-emerald-100' : 'text-stone-500'}`}>
                Carbon Offset
              </h3>
              {isNeutralOrPositive ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            
            <div className="flex items-end gap-2 mb-1">
              <span className={`text-4xl font-black leading-none ${isNeutralOrPositive ? 'text-white' : 'text-emerald-600'}`}>
                {metrics.total_offset_kg}
              </span>
              <span className={`font-medium mb-1 ${isNeutralOrPositive ? 'text-emerald-100' : 'text-stone-500'}`}>
                kg CO₂e
              </span>
            </div>
            
            <div className={`w-full h-2 rounded-full mt-4 overflow-hidden ${isNeutralOrPositive ? 'bg-emerald-800' : 'bg-stone-100'}`}>
              <div 
                className={`h-full rounded-full ${isNeutralOrPositive ? 'bg-emerald-300' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(100, (metrics.total_offset_kg / Math.max(1, metrics.total_emitted_kg)) * 100)}%` }}
              ></div>
            </div>
            
            <p className={`text-xs mt-2 font-medium ${isNeutralOrPositive ? 'text-emerald-100' : 'text-stone-600'}`}>
              Status: {metrics.net_carbon_status}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-6">Daily Carbon Breakdown</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Emitted" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Offset" fill="#34D399" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
