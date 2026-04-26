import React, { useState, useMemo } from 'react';
import { useDealRefresh } from '../hooks/useDealRefresh';
import { useUserLocation } from '../hooks/useUserLocation';
import { Star, Clock, MapPin, RefreshCw, ChevronRight, Info, Crown, Flame as FlameIcon, Utensils, Beer, Trophy, Coffee, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { initialDeals, upcomingDeals, type Deal } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { claimDeal } from '../lib/deals';

const DealsPage = () => {
  const { deals, isRefreshing, refreshDeals, newDealIds } = useDealRefresh();
  const { profile, user, signIn } = useAuth();
  
  // Combine all known deals for the "All" view
  const allKnownDeals = useMemo(() => {
    const combined = [...deals];
    upcomingDeals.forEach((d) => {
      if (!combined.some(existing => existing.id === d.id)) {
        combined.push(d);
      }
    });
    return combined;
  }, [deals]);

  const { userLocation, haversineKm, distanceLabel, updateLocationByZip, locationError } = useUserLocation();
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'activities'>('all');
  const [zipInput, setZipInput] = useState('');
  const [sortBy, setSortBy] = useState<'proximity' | 'upcoming'>('proximity');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [now, setNow] = useState(new Date());

  // Update clock every minute
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredDeals = useMemo(() => {
    let result = allKnownDeals;
    if (activeCategory !== 'all') {
      result = result.filter(d => d.category === activeCategory);
    }
    
    result = [...result].sort((a, b) => {
      if (sortBy === 'upcoming') {
        const getMinutesToStart = (deal: Deal) => {
          const [h, m] = deal.activeStart.split(':').map(Number);
          const start = h * 60 + m;
          const current = now.getHours() * 60 + now.getMinutes();
          let diff = start - current;
          if (diff < 0) diff += 1440;
          return diff;
        };
        return getMinutesToStart(a) - getMinutesToStart(b);
      } else {
        if (!userLocation) return 0;
        const distA = haversineKm(userLocation[0], userLocation[1], a.lat, a.lng);
        const distB = haversineKm(userLocation[0], userLocation[1], b.lat, b.lng);
        return distA - distB;
      }
    });
    
    return result;
  }, [allKnownDeals, activeCategory, userLocation, haversineKm, sortBy, now]);

  const totalSaved = profile?.totalSavings || 0;

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

  return (
    <div className="h-full flex flex-col bg-[#0f071a]">
      {/* Header */}
      <header className="p-6 pb-2 shrink-0 bg-[#1a0a2e] border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <FlameIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">Perkline</h1>
              <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] uppercase tracking-widest font-semibold text-purple-300">Davis, CA</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortBy(s => s === 'proximity' ? 'upcoming' : 'proximity')}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2"
            >
              {sortBy === 'proximity' ? 'Sort by Proximity' : 'Sort by Upcoming'}
            </button>
            <button 
              onClick={refreshDeals}
              disabled={isRefreshing}
              className="p-2.5 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl active:scale-95 transition-transform"
            >
              <RefreshCw size={18} className={cn("text-purple-400", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Savings Card - Design specific */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#2d1b4e] rounded-3xl p-5 mb-6 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
          <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-widest mb-1">Lifetime Savings</p>
          <h2 className="text-3xl font-bold text-white mb-0">${totalSaved.toFixed(2)}</h2>
          <div className="absolute right-4 bottom-4 opacity-10">
             <Star size={40} className="text-purple-400" />
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          <CategoryTab active={activeCategory === 'all'} label="All" onClick={() => setActiveCategory('all')} />
          <CategoryTab active={activeCategory === 'food'} label="🍕 Food" onClick={() => setActiveCategory('food')} />
          <CategoryTab active={activeCategory === 'drinks'} label="🍹 Drinks" onClick={() => setActiveCategory('drinks')} />
          <CategoryTab active={activeCategory === 'activities'} label="🎯 Activities" onClick={() => setActiveCategory('activities')} />
        </div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20 space-y-6 no-scrollbar">
        {locationError === "GPS Denied" && !userLocation && (
          <div className="bg-[#1a0a2e] border border-red-500/20 rounded-2xl p-4">
            <p className="text-xs text-red-400 font-bold mb-2 uppercase tracking-widest">Location access needed</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Zip Code"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                className="flex-1 bg-[#0f071a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <button 
                onClick={() => updateLocationByZip(zipInput)}
                className="bg-purple-600 px-4 py-2 rounded-xl text-sm font-bold active:scale-95"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {user ? (
          <AnimatePresence mode="popLayout">
            {filteredDeals.map((deal, idx) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                idx={idx}
                now={now}
                userLocation={userLocation}
                haversineKm={haversineKm}
                distanceLabel={distanceLabel}
                isNew={newDealIds.includes(deal.id)}
                onClick={() => setSelectedDeal(deal)}
                onClaim={() => handleClaim(deal)}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-12 px-8 bg-[#1a0a2e] rounded-[40px] border border-white/5 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-900/40">
               <TrophyIcon size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tighter">Personalize Your Perks</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-loose mb-8">Sign in to track savings and see deals near you.</p>
            <button 
              onClick={signIn}
              className="w-full h-14 bg-white text-[#1a0a2e] rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <LogIn size={20} />
              Connect using Google
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {selectedDeal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#1a0a2e] rounded-t-[40px] z-[70] overflow-hidden flex flex-col border-t border-white/10 shadow-2xl"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-4 shrink-0" />
              <div className="overflow-y-auto px-6 pb-24">
                <div className="h-44 rounded-[32px] overflow-hidden mb-6 border border-white/5 shadow-xl bg-[#2d1b4e] flex items-center justify-center">
                  {selectedDeal.image ? (
                    <img src={selectedDeal.image} className="w-full h-full object-cover" alt={selectedDeal.business} />
                  ) : (
                    <div className="text-4xl">{selectedDeal.emoji}</div>
                  )}
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1 text-white">{selectedDeal.title}</h2>
                    <p className="text-purple-400 font-semibold text-sm tracking-tight">{selectedDeal.business}</p>
                  </div>
                  <div className="bg-purple-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-purple-900/40">
                    {selectedDeal.discount}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <DetailMeta icon={<Star size={14} className="fill-yellow-400 text-yellow-400" />} label={selectedDeal.rating.toString()} />
                  <DetailMeta icon={<Clock size={14} />} label={selectedDeal.activeEnd} />
                  <DetailMeta icon={<MapPin size={14} />} label="Davis" />
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Description</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedDeal.description}</p>
                  </div>
                  
                  <div className="bg-[#2d1b4e] rounded-3xl p-6 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-slate-500">Regular Price</span>
                      <span className="text-xs font-semibold line-through text-slate-500">${selectedDeal.originalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-100">Deal Price</span>
                      <span className="text-3xl font-bold text-white tracking-tight">${selectedDeal.dealPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button 
                    onClick={() => handleClaim(selectedDeal)}
                    className="flex-1 bg-white text-[#1a0a2e] h-14 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    Claim Deal
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedDeal(null)}
                      className="flex-1 h-14 bg-[#2d1b4e] rounded-2xl border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-purple-400 font-bold text-xs uppercase tracking-widest"
                    >
                      Back to Feed
                    </button>
                    <button className="w-14 h-14 bg-[#2d1b4e] rounded-2xl border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-purple-400">
                      <MapPin size={20} />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-500 uppercase tracking-[0.2em] mt-2">
                    Official Merchant Site • Verification Required
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const TrophyIcon = ({ size, className }: { size: number, className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const CategoryTab = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "whitespace-nowrap px-6 py-2.5 rounded-xl text-sm transition-all",
      active 
        ? "bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20" 
        : "bg-[#1a0a2e] border border-white/10 text-slate-400 font-medium hover:bg-white/5"
    )}
  >
    {label}
  </button>
);

const DealCard = ({ deal, idx, userLocation, haversineKm, distanceLabel, isNew, onClick, onClaim, now }: any) => {
  const isAlwaysOn = deal.activeStart === '00:00' && deal.activeEnd === '23:59';
  
  const isActive = useMemo(() => {
    if (isAlwaysOn) return true;
    const [startH, startM] = deal.activeStart.split(':').map(Number);
    const [endH, endM] = deal.activeEnd.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    const current = now.getHours() * 60 + now.getMinutes();
    return current >= start && current < end;
  }, [deal, now, isAlwaysOn]);

  const timeLabel = useMemo(() => {
    if (isAlwaysOn) {
      if (deal.activeDays.length < 7) {
        const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
        if (deal.activeDays.includes(today)) {
          return 'Available All Day Today';
        }
        return `Available on ${deal.activeDays.join(', ')}`;
      }
      if (deal.expiresAt !== '2026-12-31') return `Until ${deal.expiresAt}`;
      return 'Available All Week';
    }
    
    const [startH, startM] = deal.activeStart.split(':').map(Number);
    const [endH, endM] = deal.activeEnd.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    const current = now.getHours() * 60 + now.getMinutes();
    
    if (isActive) {
      let diff = end - current;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `Ends in ${h > 0 ? `${h}h ` : ''}${m}m`;
    } else {
      let diff = start - current;
      if (diff < 0) diff += 1440; // Next day
      
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `Starts in ${h > 0 ? `${h}h ` : ''}${m}m`;
    }
  }, [deal, now, isActive, isAlwaysOn]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={() => onClick(deal)}
      className={cn(
        "group bg-[#2d1b4e] rounded-[32px] border border-white/5 flex flex-col overflow-hidden shadow-2xl active:scale-[0.98] transition-transform cursor-pointer",
        !isActive && !isAlwaysOn && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className="h-44 relative overflow-hidden bg-[#1a0a2e] flex items-center justify-center text-4xl">
        {deal.image ? (
          <img src={deal.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={deal.business} />
        ) : deal.emoji}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d1b4e] to-transparent opacity-60"></div>
        
        <div className="absolute top-4 left-4 flex gap-2">
           <span className="bg-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">{deal.discount}</span>
           <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white">{deal.category}</span>
        </div>

        {isNew && (
          <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full shadow-lg">
            New
          </div>
        )}

        <div className="absolute bottom-4 left-5">
          <div className="flex items-center gap-1.5 mb-0.5">
             {timeLabel && <div className={cn("w-1.5 h-1.5 rounded-full", (isActive || isAlwaysOn) ? "bg-green-500" : "bg-slate-500", !isAlwaysOn && "animate-pulse")} />}
             <p className="text-[10px] uppercase font-bold text-purple-300 opacity-80">
               {timeLabel || 'Available All Day'}
             </p>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight leading-none">{deal.title}</h3>
        </div>
        
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg flex items-center gap-1.5">
           <Star size={12} className="text-yellow-400 fill-yellow-400" />
           <span className="text-[10px] font-bold text-white">{deal.rating}</span>
        </div>
      </div>

    <div className="p-5 flex flex-col gap-4 flex-1">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter italic">
              {deal.business.charAt(0)}
           </div>
           <span className="text-sm font-semibold text-slate-300">{deal.business}</span>
         </div>
         <span className="text-[10px] font-medium text-slate-500 tracking-wider">
           {userLocation ? distanceLabel(haversineKm(userLocation[0], userLocation[1], deal.lat, deal.lng)) : '0.4 km'} away
         </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex items-baseline gap-1.5">
           <span className="text-lg font-bold text-white">${deal.dealPrice.toFixed(2)}</span>
           <span className="text-xs text-slate-500 line-through font-medium">${deal.originalPrice.toFixed(2)}</span>
         </div>
         <button 
           onClick={(e) => {
             e.stopPropagation();
             onClaim();
           }}
           className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest active:scale-95 transition-transform"
         >
           Claim Perk
         </button>
      </div>
    </div>
  </motion.div>
  );
};

const DetailMeta = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex flex-col items-center gap-1.5 bg-[#2d1b4e] border border-white/10 px-4 py-3 rounded-2xl flex-1">
    <div className="text-purple-400 opacity-60">{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{label}</span>
  </div>
);

export default DealsPage;
