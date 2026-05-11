import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, HelpCircle, LogOut, ChevronRight, Building, MapPin, Phone, Globe, Info, Heart, LogIn, PieChart, TrendingUp, Eye, BarChart3, Map as MapIcon, Star, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LogoImage } from '../components/LogoImage';

interface ActivityRecord {
  id: string;
  business: string;
  savings: number;
  date: string;
  logo?: string;
  emoji?: string;
}

interface ProfilePageProps {
  onNavigateToSavings: () => void;
}

const ProfilePage = ({ onNavigateToSavings }: ProfilePageProps) => {
  const { user, profile, loading, signIn, signOut, isMerchant } = useAuth();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [isMerchantMode, setIsMerchantMode] = useState(false);

  useEffect(() => {
    // If merchant mode is true but user isn't a merchant, reset it
    if (isMerchantMode && !isMerchant) {
      setIsMerchantMode(false);
    }
  }, [isMerchant, isMerchantMode]);

  const merchantStats = [
    { label: 'Total Impressions', value: '1,284', icon: <Eye size={14} />, trend: '+12%' },
    { label: 'Deal Claims', value: '342', icon: <TrendingUp size={14} />, trend: '+8%' },
    { label: 'Map Clicks', value: '561', icon: <MapPin size={14} />, trend: '+15%' },
  ];

  useEffect(() => {
    if (user) {
      const activityRef = collection(db, 'users', user.uid, 'activity');
      const q = query(activityRef, orderBy('date', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ActivityRecord[];
        setActivities(records.slice(0, 5));

        // Calculate monthly savings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const monthlyTotal = records.reduce((acc, curr) => {
          if (new Date(curr.date) >= thirtyDaysAgo) {
            return acc + curr.savings;
          }
          return acc;
        }, 0);
        setMonthlySavings(monthlyTotal);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setClaimSubmitted(true);
    
    // Update profile in Firestore to make them a merchant
    const { doc, updateDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { isMerchant: true });

    setTimeout(() => {
      setShowClaimModal(false);
      setClaimSubmitted(false);
      setIsMerchantMode(true);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0f071a]">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing Identity...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0f071a] px-8 text-center">
        <div className="w-24 h-24 bg-purple-600 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-purple-900/40">
           <Trophy size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Unlock Exclusive Davis Deals</h2>
        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed max-w-xs">Sign in with Google to start tracking your savings and access exclusive perks across Davis.</p>
        <button 
          onClick={signIn}
          className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0f071a] no-scrollbar">
      {/* Profile Header */}
      <header className="h-16 border-b border-white/5 bg-[#1a0a2e] flex items-center justify-between px-6 shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white uppercase">Account</span>
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 active:bg-white/10 transition-colors">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
          )}
          <span className="text-xs font-semibold text-slate-200">{profile?.displayName?.split(' ')[0]}</span>
        </div>
      </header>

      <div className="px-6 space-y-6 pb-24">
        {/* View Toggle - Only for merchants */}
        {isMerchant && (
          <div className="bg-[#1a0a2e] p-1 rounded-2xl flex border border-white/5">
            <button 
              onClick={() => setIsMerchantMode(false)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                !isMerchantMode ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              User Profile
            </button>
            <button 
              onClick={() => setIsMerchantMode(true)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                isMerchantMode ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Building size={12} />
              Merchant View
            </button>
          </div>
        )}

        {isMerchantMode && isMerchant ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Merchant Dashboard Preview */}
            <div className="bg-[#2d1b4e] rounded-[32px] p-6 border border-white/10 shadow-2xl relative overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-1">Merchant Analytics</h2>
                   <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Prototype Preview</p>
                 </div>
                 <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                   <BarChart3 size={18} className="text-purple-400" />
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-2 mb-8">
                 {merchantStats.map((stat, i) => (
                   <div key={i} className="bg-black/20 p-3 rounded-2xl border border-white/5">
                     <div className="text-purple-400 mb-2">{stat.icon}</div>
                     <p className="text-lg font-bold text-white mb-0.5 leading-none">{stat.value}</p>
                     <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</p>
                     <span className="text-[7px] font-black text-green-400 mt-1 block tracking-tighter">{stat.trend}</span>
                   </div>
                 ))}
               </div>

               {/* Map Heatmap Concept */}
               <div className="space-y-4">
                 <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                   <MapIcon size={12} />
                   Claim Heatmap (Conceptual)
                 </h4>
                 <div className="h-32 bg-[#1a0a2e] rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20"></div>
                    <div className="relative z-10 text-center px-6">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping mx-auto mb-2 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                        Real-time heatmap of user interactions would populate here for partner merchants.
                      </p>
                    </div>
                 </div>
               </div>
            </div>

            <section className="bg-purple-600/10 border border-purple-500/20 rounded-[32px] p-6 text-center">
              <Star size={24} className="mx-auto text-yellow-400 mb-4 fill-yellow-400" />
              <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight italic">Boost Your Visibility</h4>
              <p className="text-[11px] text-purple-200/60 font-medium mb-6 leading-relaxed">Merchants can sponsor their placement to appear first in the "Discover" feed for local Davis residents.</p>
              <button className="w-full bg-white text-[#1a0a2e] py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg">
                Explore Sponsored Slots
              </button>
            </section>
          </motion.div>
        ) : (
          <>
            {/* Savings Card */}
            <div className="bg-[#2d1b4e] rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">Lifetime Savings</p>
              <h2 className="text-4xl font-bold text-white">${profile?.totalSavings.toFixed(2) || '0.00'}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">Monthly</p>
              <p className="text-xl font-bold text-white">${monthlySavings.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <StatSmall label="Deals Used" value={profile?.dealsUsedCount?.toString() || '0'} />
            <div className="w-px h-8 bg-white/10"></div>
            <StatSmall label="Rank" value="--" />
          </div>

          {/* Analytics Entry Button */}
          <button 
            onClick={onNavigateToSavings}
            className="w-full mt-6 bg-white/5 border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors group"
          >
            <PieChart size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">View Savings Analytics</span>
            <ChevronRight size={14} className="text-slate-500 ml-1" />
          </button>
        </div>

        {/* Recent Activity */}
        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</h3>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <div key={activity.id} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d1b4e] to-[#0f071a] border border-white/5 flex items-center justify-center p-2 shadow-inner overflow-hidden">
                    <LogoImage src={activity.logo} alt={activity.business} emoji={activity.emoji || '🎫'} className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{activity.business}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Saved ${activity.savings.toFixed(2)} • {new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto opacity-20 group-active:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1a0a2e] p-8 rounded-3xl border border-white/5 text-center">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">No active history</p>
              <p className="text-[10px] text-slate-500">Claim your first deal to see savings here.</p>
            </div>
          )}
        </section>

        {/* Business Claim - Only for non-merchants */}
        {!isMerchant && (
          <section className="bg-[#1a0a2e] border border-white/10 rounded-[32px] p-6 text-center">
            <Building size={24} className="mx-auto text-purple-500 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Are you a Local Merchant?</h4>
            <p className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed">Partner with Perkline to grow your presence in Davis. List deals and track real-time analytics.</p>
            <button 
              onClick={() => setShowClaimModal(true)}
              className="w-full bg-[#2d1b4e] text-purple-400 border border-purple-500/30 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest active:bg-purple-500 active:text-white transition-all shadow-lg"
            >
              Sign up as Merchant
            </button>
          </section>
        )}

        {/* Menu Items */}
        <div className="space-y-1">
          <MenuItem icon={<Settings size={18} />} label="Security Settings" />
          <MenuItem icon={<Bell size={18} />} label="Notification Center" />
          <MenuItem icon={<HelpCircle size={18} />} label="Customer Support" />
          <MenuItem icon={<LogOut size={18} />} label="Sign Out of Session" danger onClick={signOut} />
        </div>
      </>
    )}
  </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaimModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !claimSubmitted && setShowClaimModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-6 top-10 bottom-10 bg-[#1a0a2e] rounded-[40px] border border-white/10 z-[90] p-8 overflow-y-auto no-scrollbar shadow-2xl"
            >
              {claimSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-900/40 rotate-12">
                    <Building size={40} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tighter">Request Received</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Merchant verification underway.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-white italic tracking-widest uppercase">Merchant Registration</h2>
                    <button onClick={() => setShowClaimModal(false)} className="text-slate-500 hover:text-white transition-colors">
                      <LogOut size={24} className="rotate-180" />
                    </button>
                  </div>
                  <form onSubmit={handleClaimSubmit} className="space-y-6">
                    <div className="bg-purple-600/10 p-4 rounded-2xl border border-purple-500/20 mb-6">
                       <div className="flex items-center gap-3 text-purple-400 mb-2">
                         <Info size={16} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Partner Terms</span>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed">By registering, you agree to our 25¢ per-scan featured boost model. You will receive access to the merchant portal immediately.</p>
                    </div>

                    <InputGroup label="Merchant Name" placeholder="Business name in Davis" icon={<Building size={16} />} />
                    <InputGroup label="Business Address" placeholder="Street Location" icon={<MapPin size={16} />} />
                    <InputGroup label="Contact Info" placeholder="Email or Phone" icon={<Phone size={16} />} />
                    
                    <div className="pt-6">
                      <button type="submit" className="w-full h-14 bg-white text-[#1a0a2e] rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <ShieldCheck size={18} />
                        Become a Partner
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Trophy = ({ size, className }: { size: number, className: string }) => (
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

const StatSmall = ({ label, value }: { label: string, value: string }) => (
  <div className="text-center">
    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">{label}</p>
    <p className="text-base font-bold text-white">{value}</p>
  </div>
);

const MenuItem = ({ icon, label, danger, onClick }: { icon: React.ReactNode, label: string, danger?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-2 py-3 rounded-2xl transition-all active:bg-white/5 group",
      danger ? "text-red-400" : "text-slate-300"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn("p-2.5 rounded-xl transition-colors", danger ? "bg-red-500/10" : "bg-[#1a0a2e] border border-white/5 border-b-white/10 shadow-inner group-active:border-purple-500/30")}>
        {icon}
      </div>
      <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
    </div>
    <ChevronRight size={16} className="opacity-10 group-active:opacity-100 transition-opacity" />
  </button>
);

const InputGroup = ({ label, placeholder, icon }: { label: string, placeholder: string, icon: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-400 opacity-60">
        {icon}
      </div>
      <input 
        required
        type="text" 
        placeholder={placeholder}
        className="w-full bg-[#1a0a2e] border border-white/10 rounded-2xl pl-14 pr-4 h-14 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600 font-medium"
      />
    </div>
  </div>
);

export default ProfilePage;
