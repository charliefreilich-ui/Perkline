import React, { useState, useMemo } from 'react';
import { useDealRefresh } from '../hooks/useDealRefresh';
import { useUserLocation } from '../hooks/useUserLocation';
import { Star, Clock, MapPin, RefreshCw, ChevronRight, Info, Flame as FlameIcon, Utensils, Beer, Trophy, Coffee, LogIn, Plus, CheckCircle2, Users, Send, AlertCircle, X, ChevronDown, Database, QrCode, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { initialDeals, upcomingDeals, type Deal } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { claimDeal } from '../lib/deals';
import { dbService, type Business, type JoinedDeal } from '../services/db';
import QRScanner from '../components/QRScanner';
import { LogoImage } from '../components/LogoImage';

const SortChip = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
      active 
        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
        : "bg-white/5 border border-white/10 text-purple-300 hover:bg-white/10"
    )}
  >
    {label}
  </button>
);

const DealsPage = () => {
  const { deals, isRefreshing: hookRefreshing, refreshDeals, newDealIds, isVerifying: hookVerifying } = useDealRefresh();
  const { profile, user, signIn } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use deals from hook (synced with Firestore)
  const allKnownDeals = useMemo(() => deals, [deals]);

  const { userLocation, haversineKm, distanceLabel, updateLocationByZip, locationError, locationSource } = useUserLocation();
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drinks' | 'activities'>('all');
  const [zipInput, setZipInput] = useState('');
  const [sortBy, setSortBy] = useState<'proximity' | 'upcoming' | 'price'>('proximity');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [now, setNow] = useState(new Date());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'new' | 'broken'>('new');
  const [reportUrl, setReportUrl] = useState('');
  const [reportRestaurant, setReportRestaurant] = useState('');
  const [reportDealTitle, setReportDealTitle] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeScannerDeal, setActiveScannerDeal] = useState<Deal | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [topBusiness, setTopBusiness] = useState<Business | null>(null);
  const [topDeals, setTopDeals] = useState<JoinedDeal[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Update clock every minute
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const unsubBusiness = dbService.getTopSavingBusiness(setTopBusiness);
    const unsubDeals = dbService.getTopDeals((deals) => {
      setTopDeals(deals);
    });
    return () => {
      unsubBusiness();
      unsubDeals();
    };
  }, []);

  const handleReportDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportType === 'new' && (!reportUrl || !reportRestaurant || !reportDealTitle)) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportUrl('');
      setReportRestaurant('');
      setReportDealTitle('');
      setReportType('new');
    }, 2000);
  };

  const filteredDeals = useMemo(() => {
    if (!userLocation) return [];

    let result = allKnownDeals.filter(d => {
      const dist = haversineKm(userLocation[0], userLocation[1], d.lat, d.lng);
      return dist <= 16.1; // 10 miles in KM
    });

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
      } else if (sortBy === 'price') {
        return a.dealPrice - b.dealPrice;
      } else {
        if (!userLocation) return 0;
        const distA = haversineKm(userLocation[0], userLocation[1], a.lat, a.lng);
        const distB = haversineKm(userLocation[0], userLocation[1], b.lat, b.lng);
        return distA - distB;
      }
    });
    
    return result;
  }, [allKnownDeals, activeCategory, userLocation, haversineKm, sortBy, now]);

  const categoryGroups = useMemo(() => {
    const groups: { [key: string]: Deal[] } = {};
    filteredDeals.forEach(deal => {
      const cat = deal.category || 'food';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(deal);
    });
    
    // Define ordering for categories
    const order = ['food', 'drinks', 'activities'];
    return Object.entries(groups)
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([category, deals]) => ({
        category,
        deals
      }));
  }, [filteredDeals]);

  const totalSaved = profile?.totalSavings || 0;

  const recordClaim = (deal: Deal) => {
    if (!user) return;
    
    // Fire and forget claim record
    claimDeal(user.uid, {
      id: deal.id,
      business: deal.business,
      savings: deal.originalPrice - deal.dealPrice
    });
  };

  const handleStartScan = (deal: Deal) => {
    if (!user) {
      signIn();
      return;
    }
    setActiveScannerDeal(deal);
    setShowScanner(true);
    setScanStatus('idle');
  };

  const handleScanSuccess = (decodedText: string) => {
    if (!activeScannerDeal) return;

    if (decodedText === activeScannerDeal.qrSecret) {
      setScanStatus('success');
      recordClaim(activeScannerDeal);
      
      // Auto-close after success
      setTimeout(() => {
        setShowScanner(false);
        setActiveScannerDeal(null);
        setScanStatus('idle');
        setSelectedDeal(null); // Close the detail view too if it's open
      }, 2000);
    } else {
      setScanStatus('error');
      // Briefly show error then reset to idle to allow rescan
      setTimeout(() => setScanStatus('idle'), 3000);
    }
  };

  const handleViewSource = (url: string | undefined) => {
    if (!url) return;
    let absoluteUrl = url.trim();
    if (!/^https?:\/\//i.test(absoluteUrl)) {
      absoluteUrl = `https://${absoluteUrl}`;
    }
    console.log("Opening source:", absoluteUrl);
    window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
  };

  const { isAdmin, loading: isAuthLoading } = useAuth();
  const isVerifying = hookVerifying || isAuthLoading;

  const handleSeed = async () => {
    setIsRefreshing(true);
    try {
      const allDeals = [...initialDeals, ...upcomingDeals];
      const uniqueDeals = allDeals.filter((d, index, self) =>
        index === self.findIndex((t) => t.title === d.title && t.business === d.business)
      );
      await dbService.seedData(uniqueDeals);
    } catch (error) {
      console.error("Seeding failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isVerifying && deals.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#0f071a] text-center">
        <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center mb-6">
          <Database size={40} className="text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tighter">No Deals Found</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mb-8">
          The database is currently empty. {isAdmin ? "As an admin, you can initialize the database with Perkline's featured deals." : "Check back later for new deals!"}
        </p>
        {isAdmin && (
          <button 
            onClick={handleSeed}
            disabled={isRefreshing}
            className="px-8 h-14 bg-white text-[#1a0a2e] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {isRefreshing ? "Initializing..." : "Initialize Database"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f071a]">
      {/* Search/Header */}
      <header className="px-6 pt-12 pb-6 shrink-0 z-10 bg-[#0f071a]">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">Discovery</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap flex items-center gap-1 px-2 py-0.5 bg-purple-600 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                {filteredDeals.length} Active Perks
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                {locationSource === 'gps' ? 'Nearby • GPS Active' : 
                 locationSource === 'zipcode' ? 'Nearby • Area Results' :
                 locationError ? 'Location Required' : 'Detecting Location...'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
             <div className="flex gap-2 mb-3 self-end sm:self-auto">
               <button 
                 onClick={() => setShowReportModal(true)}
                 className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
               >
                 Report Deal
               </button>
             </div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1">
              <SortChip active={sortBy === 'proximity'} label="Distance" onClick={() => setSortBy('proximity')} />
              <SortChip active={sortBy === 'price'} label="Price" onClick={() => setSortBy('price')} />
              <SortChip active={sortBy === 'upcoming'} label="Time" onClick={() => setSortBy('upcoming')} />
             </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          <CategoryTab active={activeCategory === 'all'} label="Everything" onClick={() => setActiveCategory('all')} />
          <CategoryTab active={activeCategory === 'food'} label="Food" onClick={() => setActiveCategory('food')} />
          <CategoryTab active={activeCategory === 'drinks'} label="Drinks" onClick={() => setActiveCategory('drinks')} />
          <CategoryTab active={activeCategory === 'activities'} label="Activities" onClick={() => setActiveCategory('activities')} />
        </div>
      </header>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-[#0f071a]/95 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#1a0a2e] border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
              
              <button 
                onClick={() => setShowReportModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>

              {reportSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="text-green-500" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {reportType === 'broken' ? 'Issue Reported!' : 'Deal Submitted!'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {reportType === 'broken' 
                      ? 'Thanks for letting us know. We\'ll verify this immediately.'
                      : 'Thanks for sharing. Our team will verify it shortly.'}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">
                    {reportType === 'broken' ? 'Report Issue' : 'Crowdsource'}
                  </h3>
                  <p className="text-slate-400 text-[10px] mb-6 font-bold uppercase tracking-widest leading-relaxed">
                    {reportType === 'broken' 
                      ? "Found a mistake? Tell us what's wrong with this deal."
                      : "Paste a social media link or website found in public."}
                  </p>
                  
                  {/* Type Toggle */}
                  <div className="bg-black/20 p-1 rounded-xl flex border border-white/5 mb-6">
                    <button 
                      onClick={() => setReportType('new')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        reportType === 'new' ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      New Deal
                    </button>
                    <button 
                      onClick={() => setReportType('broken')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        reportType === 'broken' ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Broken Deal
                    </button>
                  </div>

                  <form onSubmit={handleReportDeal} className="space-y-4">
                    {reportType === 'new' ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Restaurant Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Woodstock's Pizza"
                            value={reportRestaurant}
                            onChange={(e) => setReportRestaurant(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Deal Title</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. $5 Draft Beers"
                            value={reportDealTitle}
                            onChange={(e) => setReportDealTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Source URL</label>
                          <div className="relative">
                            <AlertCircle size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/50" />
                            <input 
                              type="url" 
                              required
                              placeholder="https://instagram.com/p/..."
                              value={reportUrl}
                              onChange={(e) => setReportUrl(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 pl-12 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Describe the Issue</label>
                        <textarea 
                          required
                          placeholder="e.g. This deal has expired, or the price is wrong..."
                          value={reportUrl}
                          onChange={(e) => setReportUrl(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl h-32 p-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                        />
                      </div>
                    )}
                    
                    <button 
                      type="submit"
                      className={cn(
                        "w-full h-14 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2",
                        reportType === 'broken' ? "bg-red-600 text-white" : "bg-white text-[#1a0a2e]"
                      )}
                    >
                      {reportType === 'broken' ? 'Report Issue' : 'Submit Deal'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32 space-y-2 no-scrollbar">
        {/* Quota Error Message */}
        {topDeals.length <= 3 && allKnownDeals.length <= initialDeals.length && (
          <div className="mx-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-0.5">Firebase Limit Reached</p>
                <p className="text-[9px] text-orange-300/70 font-medium leading-tight">
                  The app's daily free database quota has been exceeded. Using cached local data for logos and deals. Claim tracking will resume tomorrow.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MVD Row: Top 3 Most Used Deals - ONLY shown if location is set */}
        {userLocation && topDeals.length > 0 && (
          <div className="px-6 mb-8 mt-2">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="bg-purple-500 p-1.5 rounded-lg shadow-lg">
                  <FlameIcon size={16} className="text-white animate-pulse" />
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Most Valuable Deals</h2>
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-purple-500/20">Trending</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {topDeals.map((deal, index) => (
                <motion.div
                  key={`mvd-${deal.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedDeal(deal as unknown as Deal)}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all active:scale-95 group"
                >
                  <div className="relative">
                    <LogoImage 
                      src={deal.logo} 
                      website={deal.website}
                      alt={deal.business} 
                      emoji={deal.emoji} 
                      className="w-14 h-14 rounded-xl drop-shadow-lg"
                    />
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-purple-900 border-2 border-[#1a1127]">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-sm font-bold text-white leading-tight truncate sm:whitespace-normal">
                      {deal.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">
                      {deal.business}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-purple-400 font-black text-xs">{deal.discount}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{deal.usageCount || 0} Claims</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {locationError === "GPS Denied" && !userLocation && (
          <div className="mx-6 bg-[#1a0a2e] border border-red-500/20 rounded-[32px] p-6 mb-8 max-w-lg md:mx-auto">
            <p className="text-[10px] text-red-400 font-black mb-3 uppercase tracking-widest">Location access needed</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Zip Code"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                className="flex-1 bg-[#0f071a] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <button 
                onClick={() => updateLocationByZip(zipInput)}
                className="bg-purple-600 px-6 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-purple-900/20"
              >
                Find
              </button>
            </div>
          </div>
        )}
        {user ? (
          <div className="space-y-4">
            {categoryGroups.length > 0 ? (
              categoryGroups.map((group, idx) => (
                <CategorySection 
                  key={group.category}
                  group={group}
                  idx={idx}
                  now={now}
                  userLocation={userLocation}
                  haversineKm={haversineKm}
                  distanceLabel={distanceLabel}
                  newDealIds={newDealIds}
                  onDealClick={setSelectedDeal}
                  onClaim={handleStartScan}
                  onViewSource={handleViewSource}
                />
              ))
            ) : (
              <div className="py-20 px-6 text-center">
                <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                   <MapPin size={32} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">No Nearby Perks</h3>
                <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  {!userLocation 
                    ? "We need your location to verify your distance. Please enable GPS or enter a zip code below."
                    : "No perks found within 10 miles of your location. Try a different city or check back later!"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-6 py-20 px-8 bg-[#1a0a2e] rounded-[40px] border border-white/5 text-center flex flex-col items-center max-w-lg md:mx-auto mt-12">
            <div className="w-24 h-24 bg-purple-600 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-purple-900/40">
               <FlameIcon size={48} className="text-white" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">Your Daily Perks</h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-loose mb-10 max-w-xs">Sign in to track savings and see the best deals in Davis.</p>
            <button 
              onClick={signIn}
              className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <LogIn size={20} />
              Connect with Google
            </button>
          </div>
        )}
      </main>

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
                <div className="aspect-[16/9] rounded-[32px] overflow-hidden mb-6 border border-white/5 shadow-xl bg-[#2d1b4e]/30 relative group flex items-center justify-center p-12">
                  <LogoImage 
                    src={selectedDeal.logo} 
                    website={selectedDeal.website}
                    alt={selectedDeal.business} 
                    emoji={selectedDeal.emoji} 
                    className="w-32 h-32 drop-shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a2e] to-transparent opacity-20"></div>
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedDeal.sourceType === 'merchant' ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-400 uppercase tracking-widest">
                          <CheckCircle2 size={10} />
                          Merchant Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-black text-blue-400 uppercase tracking-widest">
                          <Users size={10} />
                          Community Reported
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 text-white break-words">{selectedDeal.title}</h2>
                    <p className="text-purple-400 font-semibold text-xs sm:text-sm tracking-tight break-words">{selectedDeal.business}</p>
                  </div>
                  <div className="bg-purple-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-purple-900/40 shrink-0">
                    {selectedDeal.discount}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <DetailMeta icon={<Star size={14} className="fill-yellow-400 text-yellow-400" />} label={selectedDeal.rating?.toString() || "0"} />
                  <DetailMeta icon={<Clock size={14} />} label={selectedDeal.activeEnd} />
                  <DetailMeta icon={<MapPin size={14} />} label="Davis" />
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Description</h4>
                    <p className="text-slate-300 text-sm leading-relaxed break-words">{selectedDeal.description}</p>
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
                  <div className="flex gap-3">
                    <a 
                      href={selectedDeal.dealUrl.startsWith('http') ? selectedDeal.dealUrl : `https://${selectedDeal.dealUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user) {
                          signIn();
                          return;
                        }
                        handleStartScan(selectedDeal);
                      }}
                      className="flex-[2] bg-white text-[#1a0a2e] h-14 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <QrCode size={20} />
                      Claim Deal
                    </a>
                    <a 
                      href={selectedDeal.dealUrl.startsWith('http') ? selectedDeal.dealUrl : `https://${selectedDeal.dealUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-purple-600/50 text-white h-14 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 px-4 text-center leading-tight hover:bg-purple-600 border border-white/10"
                    >
                      <ExternalLink size={16} />
                      View Source
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedDeal(null)}
                      className="flex-1 h-14 bg-[#2d1b4e] rounded-2xl border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-purple-400 font-bold text-xs uppercase tracking-widest"
                    >
                      Back to Feed
                    </button>
                    <button 
                      onClick={() => {
                        setReportType('broken');
                        setShowReportModal(true);
                      }}
                      className="flex-1 h-14 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center active:scale-95 transition-transform text-red-400 font-bold text-[10px] uppercase tracking-widest px-2 text-center leading-tight"
                    >
                      Report Broken
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

      {showScanner && (
        <QRScanner 
          onScan={handleScanSuccess}
          onClose={() => {
            setShowScanner(false);
            setActiveScannerDeal(null);
            setScanStatus('idle');
          }}
          expectedSecret={activeScannerDeal?.qrSecret}
        />
      )}

      {/* Scan Success/Error Feedback Overlay */}
      <AnimatePresence>
        {scanStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[110] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md"
            style={{ 
              backgroundColor: scanStatus === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              borderColor: scanStatus === 'success' ? 'rgba(74, 222, 128, 0.5)' : 'rgba(248, 113, 113, 0.5)'
            }}
          >
            {scanStatus === 'success' ? (
              <>
                <CheckCircle2 className="text-white" size={24} />
                <div className="text-white">
                  <p className="font-bold text-sm leading-tight tracking-tight uppercase">Redemption Success!</p>
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-widest mt-0.5">Your discount is now active</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="text-white" size={24} />
                <div className="text-white">
                  <p className="font-bold text-sm leading-tight tracking-tight uppercase">Invalid Code</p>
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-widest mt-0.5">Please scan the correct QR code</p>
                </div>
              </>
            )}
          </motion.div>
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
      "whitespace-nowrap px-6 py-2.5 rounded-xl text-sm transition-all shrink-0",
      active 
        ? "bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20" 
        : "bg-[#1a0a2e] border border-white/10 text-slate-400 font-medium hover:bg-white/5"
    )}
  >
    {label}
  </button>
);

const CategorySection = ({ group, idx, now, userLocation, haversineKm, distanceLabel, newDealIds, onDealClick, onClaim, onViewSource }: any) => {
  const { category, deals } = group;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="space-y-4 py-4"
    >
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/20">
             {category === 'food' && <Utensils size={18} className="text-white" />}
             {category === 'drinks' && <Beer size={18} className="text-white" />}
             {category === 'activities' && <Trophy size={18} className="text-white" />}
             {(!['food', 'drinks', 'activities'].includes(category)) && <FlameIcon size={18} className="text-white" />}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">{category}</h3>
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{deals.length} Perks</span>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x snap-mandatory">
        {deals.map((deal: any, dIdx: number) => (
          <div key={deal.id} className="snap-start shrink-0">
            <DealCard 
              deal={deal}
              idx={dIdx}
              now={now}
              userLocation={userLocation}
              haversineKm={haversineKm}
              distanceLabel={distanceLabel}
              isNew={newDealIds.includes(deal.id)}
              onClick={() => onDealClick(deal)}
              onClaim={() => onClaim(deal)}
              onViewSource={() => onViewSource(deal.dealUrl)}
            />
          </div>
        ))}
        {/* Spacer for horizontal scroll */}
        <div className="w-2 shrink-0" />
      </div>
    </motion.div>
  );
};

const DealCard = ({ deal, idx, userLocation, haversineKm, distanceLabel, isNew, onClick, onClaim, onViewSource, now }: any) => {
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
          return 'Live Now';
        }
        return `Coming ${deal.activeDays[0]}`;
      }
      return 'Live Today';
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
      return `${h > 0 ? `${h}h ` : ''}${m}m left`;
    } else {
      let diff = start - current;
      if (diff < 0) diff += 1440;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `at ${deal.activeStart}`;
    }
  }, [deal, now, isActive, isAlwaysOn]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      onClick={() => onClick(deal)}
      className={cn(
        "group w-48 bg-[#1a0a2e] rounded-[32px] border flex flex-col overflow-hidden shadow-xl active:scale-[0.98] transition-all cursor-pointer relative",
        deal.isFeatured ? "border-purple-500/50 shadow-purple-900/20" : "border-white/5",
        !isActive && !isAlwaysOn && "opacity-60 grayscale-[0.3]"
      )}
    >
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-[#2d1b4e] to-[#1a0a2e] flex items-center justify-center p-8">
        <LogoImage 
          src={deal.logo} 
          website={deal.website}
          alt={deal.business} 
          emoji={deal.emoji} 
          className="w-24 h-24 group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-[#0f071a]/5 to-transparent opacity-60"></div>
        
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
           <span className="bg-purple-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl self-start">{deal.discount}</span>
           {deal.isFeatured && (
             <span className="bg-yellow-400 text-purple-900 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter shadow-lg self-start">
               Sponsored
             </span>
           )}
        </div>

        {/* Small Logo removed as it's now central */}

        <div className="absolute bottom-4 left-4 right-4 text-left">
          <div className="flex items-center gap-1.5 mb-1.5">
             <div className={cn("w-1 h-1 rounded-full", (isActive || isAlwaysOn) ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-500")} />
             <p className="text-[8px] uppercase font-black text-purple-400 tracking-widest">
               {timeLabel}
             </p>
          </div>
          <h3 className="text-base font-black text-white tracking-tighter uppercase leading-tight mb-1 group-hover:text-purple-300 transition-colors line-clamp-2">{deal.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{deal.business}</span>
            <span className="text-sm font-black text-white tracking-tighter">${deal.dealPrice.toFixed(2)}</span>
          </div>
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
