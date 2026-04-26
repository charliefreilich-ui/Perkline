import { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useDealRefresh } from '../hooks/useDealRefresh';
import { useUserLocation } from '../hooks/useUserLocation';
import { Crosshair, Filter, ChevronRight, Star, Clock, MapPin, Utensils, Beer, Trophy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { initialDeals, upcomingDeals, type Deal } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { claimDeal } from '../lib/deals';

// Leaflet default icon fix
import 'leaflet/dist/leaflet.css';

const DAVIS_CENTER: [number, number] = [38.5449, -121.7405];

const MapPage = () => {
  const { deals, isVerifying } = useDealRefresh();
  const { userLocation, openDirections } = useUserLocation();
  const { user, signIn } = useAuth();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [filter, setFilter] = useState<'all' | 'food' | 'drinks' | 'activities'>('all');

  // Combine all known deals for the map
  const allKnownDeals = useMemo(() => {
    const combined = [...deals];
    upcomingDeals.forEach((d) => {
      if (!combined.some(existing => existing.id === d.id)) {
        combined.push(d);
      }
    });
    return combined;
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (filter === 'all') return allKnownDeals;
    return allKnownDeals.filter(d => d.category === filter);
  }, [allKnownDeals, filter]);

  const handleClaim = async (deal: Deal) => {
    if (!user) {
      signIn();
      return;
    }
    
    await claimDeal(user.uid, {
      id: deal.id,
      business: deal.business,
      savings: deal.savings
    });
    
    window.open(deal.dealUrl, '_blank');
  };

  const MapController = ({ location, deal }: { location: [number, number] | null, deal: Deal | null }) => {
    const map = useMap();
    
    useEffect(() => {
      if (deal) {
        map.flyTo([deal.lat, deal.lng], 16, { duration: 1.5 });
      } else if (location) {
        map.flyTo(location, 14, { duration: 1.5 });
      }
    }, [deal, location, map]);

    return null;
  };

  const createMarkerIcon = (deal: Deal) => {
    const color = deal.isPlusOnly ? '#eab308' : '#9333ea';
    const emoji = deal.emoji || '📍';
    
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#0f071a] border-2 border-purple-500/30 shadow-2xl transform hover:scale-110 active:scale-95 transition-all">
          <span class="text-xl">${emoji}</span>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-[${color}] rounded-full border-2 border-[#0f071a]"></div>
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  return (
    <div className="h-full relative overflow-hidden bg-[#f3e8ff]">
      <MapContainer 
        center={DAVIS_CENTER} 
        zoom={14} 
        zoomControl={false}
        className="h-full w-full z-0 filter brightness-110 contrast-90 saturate-150 hue-rotate-[260deg]"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {filteredDeals.map(deal => (
          <Marker 
            key={deal.id} 
            position={[deal.lat, deal.lng]}
            icon={createMarkerIcon(deal)}
            eventHandlers={{
              click: () => setSelectedDeal(deal)
            }}
          />
        ))}

        {userLocation && (
          <>
            <Marker 
              position={userLocation} 
              icon={L.divIcon({
                html: '<div class="w-6 h-6 bg-purple-600 border-4 border-white rounded-full shadow-lg ring-4 ring-purple-600/20 animate-pulse"></div>',
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })} 
            />
            <Circle 
              center={userLocation} 
              radius={200} 
              pathOptions={{ fillColor: '#9333ea', fillOpacity: 0.1, color: 'transparent' }} 
            />
          </>
        )}

        <MapController location={userLocation} deal={selectedDeal} />
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-6 left-6 right-6 z-10 flex gap-2 overflow-x-auto no-scrollbar">
        <MapNavButton active={filter === 'all'} onClick={() => setFilter('all')}>All</MapNavButton>
        <MapNavButton active={filter === 'food'} onClick={() => setFilter('food')}>🍕 Food</MapNavButton>
        <MapNavButton active={filter === 'drinks'} onClick={() => setFilter('drinks')}>🍹 Drinks</MapNavButton>
        <MapNavButton active={filter === 'activities'} onClick={() => setFilter('activities')}>🎯 Fun</MapNavButton>
      </div>

      <button 
        onClick={() => {
          setSelectedDeal(null);
        }}
        className="absolute bottom-36 right-6 z-10 w-12 h-12 bg-[#1a0a2e] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
      >
        <Crosshair size={20} className="text-purple-400" />
      </button>

      {/* Quick Carousel */}
      <div className="absolute bottom-6 left-0 right-0 z-10 p-6 flex gap-3 overflow-x-auto no-scrollbar">
        <AnimatePresence>
          {filteredDeals.map(deal => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedDeal(deal)}
              className={cn(
                "shrink-0 w-64 bg-[#1a0a2e]/95 backdrop-blur-xl rounded-[28px] p-3 flex gap-3 border shadow-2xl transition-all cursor-pointer",
                selectedDeal?.id === deal.id ? "border-purple-600/50" : "border-white/5 opacity-90"
              )}
            >
              <div className="w-16 h-16 rounded-xl bg-[#0f071a] flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                {deal.image ? (
                  <img src={deal.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-2xl opacity-60 grayscale">
                    {deal.emoji}
                  </div>
                )}
              </div>
              <div className="overflow-hidden flex flex-col justify-center">
                <h4 className="font-bold text-xs truncate text-white">{deal.title}</h4>
                <p className="text-[10px] text-purple-400 font-bold mb-1.5 truncate uppercase tracking-widest">{deal.business}</p>
                <div className="bg-purple-600 px-2 py-0.5 rounded-full inline-block text-[9px] font-black uppercase tracking-tighter w-fit">
                   {deal.discount}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Verification overlay */}
      {isVerifying && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center p-12">
          <div className="bg-[#1a0a2e] rounded-[32px] p-8 border border-white/10 shadow-2xl max-w-sm w-full text-center">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="font-bold text-lg mb-2 text-white">Verifying Activity</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Matching real-time datasets with business pins.</p>
          </div>
        </div>
      )}

      {/* Selection Sheet */}
      <AnimatePresence>
        {selectedDeal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeal(null)}
              className="fixed inset-0 bg-black/40 z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 h-[70vh] bg-[#1a0a2e] rounded-t-[40px] z-[70] p-6 pt-2 overflow-y-auto border-t border-white/10 shadow-2xl no-scrollbar"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-4" />
              
              <div className="h-44 w-full rounded-3xl overflow-hidden mb-6 bg-[#0f071a] flex items-center justify-center border border-white/5 relative">
                {selectedDeal.image ? (
                  <img src={selectedDeal.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-5xl opacity-40">{selectedDeal.emoji}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a2e] to-transparent"></div>
              </div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-1 text-white">{selectedDeal.title}</h2>
                  <p className="text-purple-400 font-bold uppercase tracking-widest text-[10px]">{selectedDeal.business}</p>
                </div>
                <div className="bg-purple-600 px-4 py-2 rounded-full text-[10px] font-black italic tracking-widest shadow-lg shadow-purple-900/40">
                  {selectedDeal.discount}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-[#2d1b4e] p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                  <Star size={14} className="fill-yellow-400 text-yellow-400 mb-1" />
                  <span className="text-[10px] font-bold text-white">{selectedDeal.rating}</span>
                </div>
                <div className="bg-[#2d1b4e] p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                  <Clock size={14} className="text-purple-400 mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase truncate w-full text-center">
                    {(() => {
                      const isAlwaysOn = selectedDeal.activeStart === '00:00' && selectedDeal.activeEnd === '23:59';
                      if (isAlwaysOn) return 'Daily';
                      const [h, m] = selectedDeal.activeStart.split(':').map(Number);
                      const start = h * 60 + m;
                      const current = new Date().getHours() * 60 + new Date().getMinutes();
                      if (current >= start) return 'Active';
                      let diff = start - current;
                      if (diff < 0) diff += 1440;
                      return `${Math.floor(diff/60)}h ${diff%60}m`;
                    })()}
                  </span>
                </div>
                <div className="bg-[#2d1b4e] p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                  <MapPin size={14} className="text-cyan-400 mb-1" />
                  <span className="text-[10px] font-bold text-white">Davis</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#2d1b4e] p-5 rounded-3xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Potential Savings</p>
                  <p className="text-2xl font-bold text-white">${selectedDeal.savings.toFixed(2)}</p>
                </div>
                <div className="bg-[#2d1b4e] p-5 rounded-3xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Special Price</p>
                  <p className="text-2xl font-bold text-white">${selectedDeal.dealPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <div>
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Deal Information</h4>
                   <p className="text-sm text-slate-300 leading-relaxed font-medium">{selectedDeal.description}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <MapPin size={16} className="text-purple-400" />
                  <span className="font-bold text-xs text-slate-200">{selectedDeal.address}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-12">
                <button 
                  onClick={() => handleClaim(selectedDeal)}
                  className="w-full bg-white text-[#1a0a2e] h-14 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  Claim Deal
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => openDirections(selectedDeal.lat, selectedDeal.lng)}
                    className="flex-1 bg-[#2d1b4e] text-purple-400 border border-white/10 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-3"
                  >
                    <Crosshair size={18} />
                    Directions
                  </button>
                  <button 
                    onClick={() => setSelectedDeal(null)}
                    className="flex-1 bg-[#2d1b4e] text-slate-400 border border-white/10 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const MapNavButton = ({ active, children, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
      active 
        ? "bg-purple-600 text-white shadow-xl shadow-purple-900/40" 
        : "bg-[#1a0a2e]/90 border border-white/10 text-slate-400 backdrop-blur-xl"
    )}
  >
    {children}
  </button>
);

export default MapPage;
