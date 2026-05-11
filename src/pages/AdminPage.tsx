import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dbService, Business, FlatDeal } from '../services/db';
import { initialDeals, upcomingDeals } from '../data/mockData';
import { 
  Building2, 
  Tag, 
  Trash2, 
  Edit3, 
  Plus, 
  Database, 
  CheckCircle2, 
  Image as ImageIcon,
  Save,
  X,
  ShieldCheck,
  Upload,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LogoImage } from '../components/LogoImage';

const AdminPage = () => {
  const { user, isAdmin, isMerchant } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [deals, setDeals] = useState<FlatDeal[]>([]);
  const [activeTab, setActiveTab] = useState<'businesses' | 'deals'>('businesses');
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingDeal, setEditingDeal] = useState<FlatDeal | null>(null);
  const [isAddingDeal, setIsAddingDeal] = useState(false);

  useEffect(() => {
    if (!isMerchant) return;
    const unsubB = dbService.getBusinesses(setBusinesses);
    const unsubD = dbService.getDeals(setDeals);
    return () => {
      unsubB();
      unsubD();
    };
  }, [isMerchant]);

  // Filter content based on access level
  // For now, clfreilich@ucdavis.edu only sees Rocknasium
  const isSpecificMerchant = !isAdmin && user?.email?.toLowerCase() === 'clfreilich@ucdavis.edu';
  
  const displayedBusinesses = isAdmin 
    ? businesses 
    : businesses.filter(b => b.id === 'rocknasium');
    
  const displayedDeals = isAdmin
    ? deals
    : deals.filter(d => d.businessId === 'rocknasium');

  const totalRevenue = displayedBusinesses.reduce((acc, b) => acc + (b.totalFeaturedRevenue || 0), 0);
  const featuredDealsCount = displayedDeals.filter(d => d.isFeatured).length;

  const handleSeed = async () => {
    if (!confirm('This will seed the database with mock data. Continue?')) return;
    setIsSeeding(true);
    try {
      const allDeals = [...initialDeals, ...upcomingDeals];
      const uniqueDeals = allDeals.filter((d, index, self) =>
        index === self.findIndex((t) => t.title === d.title && t.business === d.business)
      );
      await dbService.seedData(uniqueDeals);
      alert('Database seeded! Logos restored.');
    } catch (error) {
      console.error('Seeding failed:', error);
      alert('Seeding failed: ' + error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isMerchant) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#0f071a] text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6">
          <X size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
          This area is restricted to merchants and administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f071a] overflow-hidden">
      <header className="p-6 bg-[#1a0a2e] border-b border-white/5 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase italic leading-none mb-1">
                {isAdmin ? 'Admin Portal' : 'Merchant Portal'}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-purple-400 font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Scan Revenue</p>
              <p className="text-xl font-black text-green-400 leading-none">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
            <a 
              href="/" 
              className="px-3 sm:px-4 py-2 bg-purple-600 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-transform flex items-center gap-2"
            >
              Feed
            </a>
            {isAdmin && (
              <button 
                onClick={handleSeed}
                disabled={isSeeding}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 flex items-center gap-2"
              >
                <Database size={14} />
                {isSeeding ? 'Seeding...' : 'Seed Data'}
              </button>
            )}
          </div>
        </div>
      </div>

        <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5 max-w-xs">
          <TabButton active={activeTab === 'businesses'} onClick={() => setActiveTab('businesses')} icon={<Building2 size={14} />}>Businesses</TabButton>
          <TabButton active={activeTab === 'deals'} onClick={() => setActiveTab('deals')} icon={<Tag size={14} />}>Deals</TabButton>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
        {businesses.length === 0 && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-0.5">Firebase Quota Alert</p>
              <p className="text-[9px] text-orange-300/70 font-medium leading-tight">
                Firestore free tier limit reached. Using mock data for display. Edits will not persist until quota resets.
              </p>
            </div>
          </div>
        )}
        {activeTab === 'businesses' ? (
          <BusinessList 
            businesses={displayedBusinesses} 
            onEdit={setEditingBusiness} 
          />
        ) : (
          <DealList 
            deals={displayedDeals} 
            onRemove={dbService.removeDeal} 
            onEdit={setEditingDeal}
            onAdd={() => setIsAddingDeal(true)}
          />
        )}
      </main>

      <AnimatePresence>
        {editingBusiness && (
          <BusinessEditModal 
            business={editingBusiness} 
            onClose={() => setEditingBusiness(null)} 
            onSave={(data: any) => {
              dbService.updateBusiness(editingBusiness.id, data);
              setEditingBusiness(null);
            }}
          />
        )}
        {editingDeal && (
          <DealEditModal 
            deal={editingDeal}
            onClose={() => setEditingDeal(null)}
            onSave={(data: any) => {
              dbService.updateDeal(editingDeal.id, data);
              setEditingDeal(null);
            }}
          />
        )}
        {isAddingDeal && (
          <DealAddModal 
            businesses={displayedBusinesses}
            onClose={() => setIsAddingDeal(false)}
            onSave={(deal: any) => {
              dbService.addDeal(deal);
              setIsAddingDeal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, children, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
      active ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
    )}
  >
    {icon}
    {children}
  </button>
);

const BusinessList = ({ businesses, onEdit }: any) => (
  <div className="grid gap-4">
    {businesses.map((b: Business) => (
      <div key={b.id} className="bg-[#1a0a2e] border border-white/10 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between group gap-4">
        <div className="flex items-center gap-4 w-full">
          <LogoImage src={b.logo} website={b.website} alt={b.name} emoji={b.emoji} className="w-16 h-16 shrink-0 rounded-2xl drop-shadow-lg" />
          <div className="overflow-hidden flex-1">
            <h4 className="text-white font-bold text-sm mb-1 truncate">{b.name}</h4>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest truncate">{b.address}</p>
            <div className="flex gap-2 mt-1.5">
               <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded border", b.logo ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-red-400 border-red-500/20 bg-red-500/5")}>
                 {b.logo ? 'Logo OK' : 'No Logo'}
               </span>
               <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded border", b.image ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-slate-500 border-white/10 bg-white/5")}>
                 {b.image ? 'Hero OK' : 'No Hero'}
               </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onEdit(b)}
          className="w-full sm:w-auto px-6 h-12 bg-purple-600/10 text-purple-400 rounded-xl hover:bg-purple-600/20 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Edit3 size={16} />
          Edit Assets
        </button>
      </div>
    ))}
  </div>
);

const DealList = ({ deals, onRemove, onEdit, onAdd }: any) => (
  <div className="space-y-4">
    <button 
      onClick={onAdd}
      className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
    >
      <Plus size={20} />
      Add New Deal
    </button>
    <div className="grid gap-4">
      {deals.map((d: FlatDeal) => (
        <div key={d.id} className="bg-[#1a0a2e] border border-white/10 p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoImage src={d.logo} website={d.website} alt={d.business} emoji={d.emoji} className="w-12 h-12 rounded-xl shrink-0 drop-shadow-md" />
            <div className="overflow-hidden flex-1">
              <h4 className="text-white font-bold text-sm truncate">{d.title}</h4>
              <p className="text-purple-400 text-[10px] uppercase font-bold tracking-widest truncate">{d.business}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(d)}
              className="p-3 bg-purple-600/10 text-purple-400 rounded-xl hover:bg-purple-600/20 active:scale-95 transition-all"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => {
                if (confirm('Delete this deal?')) onRemove(d.id);
              }}
              className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ImageEditModal = ({ business, onClose, onSave }: any) => {
  const [logo, setLogo] = useState(business.logo || '');
  const [image, setImage] = useState(business.image || '');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f071a]/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#1a0a2e] p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-8"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Edit Business</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Business Name</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 flex items-center text-white/50 text-sm font-medium">
              {business.name}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Logo URL</label>
            <input 
              type="url" 
              value={logo} 
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Hero Image URL</label>
            <input 
              type="url" 
              value={image} 
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Previews */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Logo Preview</p>
            <div className="h-20 bg-slate-100 rounded-2xl flex items-center justify-center p-2 overflow-hidden shadow-inner">
              <LogoImage src={logo} alt="Preview" emoji="🏢" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Hero Preview</p>
            <div className="h-20 bg-[#0f071a] rounded-2xl overflow-hidden shadow-inner">
              {image ? <img src={image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="h-full flex items-center justify-center text-slate-700">No Image</div>}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave({ logo, image })}
          className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>
      </motion.div>
    </motion.div>
  );
};

const DealAddModal = ({ businesses, onClose, onSave }: any) => {
  const [form, setForm] = useState({
    businessId: '',
    title: '',
    description: '',
    discount: '',
    originalPrice: '',
    dealPrice: '',
    category: 'food',
    activeStart: '16:00',
    activeEnd: '18:00',
    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dealUrl: '',
    sourceType: 'merchant',
    isFeatured: false
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day]
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f071a]/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-[#1a0a2e] p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] no-scrollbar"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">New Deal</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Business</label>
            <select 
              value={form.businessId}
              onChange={(e) => setForm({ ...form, businessId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            >
              <option value="">Select a business</option>
              {businesses.map((b: Business) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Title</label>
              <input 
                type="text" 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. $5 Slices"
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Discount Text</label>
              <input 
                type="text" 
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="e.g. 50% OFF"
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Original Price ($)</label>
              <input 
                type="number" 
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Deal Price ($)</label>
              <input 
                type="number" 
                value={form.dealPrice}
                onChange={(e) => setForm({ ...form, dealPrice: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Category</label>
            <div className="flex gap-2">
              {['food', 'drinks', 'activities'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setForm({...form, category: cat})}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    form.category === cat ? "bg-purple-600 text-white shadow-lg" : "bg-white/5 text-slate-500 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Description</label>
            <textarea 
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-24 p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Start Time</label>
              <input 
                type="time" 
                value={form.activeStart}
                onChange={(e) => setForm({ ...form, activeStart: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">End Time</label>
              <input 
                type="time" 
                value={form.activeEnd}
                onChange={(e) => setForm({ ...form, activeEnd: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Active Days</label>
            <div className="flex flex-wrap gap-2">
              {days.map(day => (
                <button 
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                    form.activeDays.includes(day) 
                      ? "bg-purple-600 border-purple-500 text-white" 
                      : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Source URL</label>
            <input 
              type="url" 
              value={form.dealUrl}
              onChange={(e) => setForm({ ...form, dealUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20">
            <div>
              <p className="text-xs font-bold text-white mb-0.5">Featured Boost</p>
              <p className="text-[9px] text-purple-400 font-medium uppercase tracking-wider">Pay-per-scan enabled ($0.25/scan)</p>
            </div>
            <button 
              onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative flex items-center px-1",
                form.isFeatured ? "bg-purple-600" : "bg-white/10"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full transition-transform",
                form.isFeatured ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => {
            const deal = {
              ...form,
              originalPrice: parseFloat(form.originalPrice),
              dealPrice: parseFloat(form.dealPrice),
              savings: parseFloat(form.originalPrice) - parseFloat(form.dealPrice),
              expiresAt: '2026-12-31'
            };
            onSave(deal);
          }}
          disabled={!form.businessId || !form.title || !form.dealPrice}
          className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={18} />
          Create Deal
        </button>
      </motion.div>
    </motion.div>
  );
};

const BusinessEditModal = ({ business, onClose, onSave }: { business: Business, onClose: () => void, onSave: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: business.name,
    address: business.address || '',
    website: business.website || '',
    logo: business.logo || '',
    image: business.image || ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Limit to 400px for logos to save space
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG for small footprint
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, logo: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f071a]/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-[#1a0a2e] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8 space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Edit Business</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{business.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Business Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Address</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Website URL (for Auto-Logo)</label>
            <input 
              type="text" 
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              placeholder="e.g. coffee.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Logo URL or Upload</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1 hover:text-purple-300 transition-colors"
                >
                  <Upload size={10} />
                  Upload Screenshot
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <input 
                type="text" 
                value={formData.logo}
                onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                placeholder="Paste URL or upload..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Cover Image URL</label>
              <input 
                type="text" 
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Live Preview</span>
               <div className="w-full h-24 bg-gradient-to-br from-[#2d1b4e] to-[#0f071a] rounded-2xl border border-white/10 flex items-center justify-center p-4">
                <LogoImage src={formData.logo} website={formData.website} alt="Preview" emoji="🏢" className="w-12 h-12 drop-shadow-xl" />
             </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave(formData)}
          className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <Save size={20} />
          Save Business
        </button>
      </motion.div>
    </motion.div>
  );
};

const DealEditModal = ({ deal, onClose, onSave }: any) => {
  const [form, setForm] = useState({
    businessId: deal.businessId,
    title: deal.title || '',
    description: deal.description || '',
    discount: deal.discount || '',
    originalPrice: deal.originalPrice?.toString() || '',
    dealPrice: deal.dealPrice?.toString() || '',
    category: deal.category || 'food',
    activeStart: deal.activeStart || '16:00',
    activeEnd: deal.activeEnd || '18:00',
    activeDays: deal.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dealUrl: deal.dealUrl || '',
    isFeatured: deal.isFeatured || false,
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day]
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f071a]/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-[#1a0a2e] p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] no-scrollbar"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Edit Deal</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Title</label>
              <input 
                type="text" 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Discount Text</label>
              <input 
                type="text" 
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Original Price ($)</label>
              <input 
                type="number" 
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Deal Price ($)</label>
              <input 
                type="number" 
                value={form.dealPrice}
                onChange={(e) => setForm({ ...form, dealPrice: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Start Time</label>
              <input 
                type="time" 
                value={form.activeStart}
                onChange={(e) => setForm({ ...form, activeStart: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">End Time</label>
              <input 
                type="time" 
                value={form.activeEnd}
                onChange={(e) => setForm({ ...form, activeEnd: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Active Days</label>
            <div className="flex flex-wrap gap-2">
              {days.map(day => (
                <button 
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                    form.activeDays.includes(day) 
                      ? "bg-purple-600 border-purple-500 text-white" 
                      : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Category</label>
            <div className="flex gap-2">
              {['food', 'drinks', 'activities'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setForm({...form, category: cat})}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    form.category === cat ? "bg-purple-600 text-white shadow-lg" : "bg-white/5 text-slate-500 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Description</label>
            <textarea 
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-24 p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Source URL</label>
            <input 
              type="url" 
              value={form.dealUrl}
              onChange={(e) => setForm({ ...form, dealUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20">
            <div>
              <p className="text-xs font-bold text-white mb-0.5">Featured Boost</p>
              <p className="text-[9px] text-purple-400 font-medium uppercase tracking-wider">Pay-per-scan enabled ($0.25/scan)</p>
            </div>
            <button 
              onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative flex items-center px-1",
                form.isFeatured ? "bg-purple-600" : "bg-white/10"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full transition-transform",
                form.isFeatured ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => {
            const originalPrice = parseFloat(form.originalPrice);
            const dealPrice = parseFloat(form.dealPrice);
            onSave({
              ...form,
              originalPrice,
              dealPrice,
              savings: originalPrice - dealPrice,
            });
          }}
          disabled={!form.title || !form.dealPrice}
          className="w-full h-16 bg-white text-[#1a0a2e] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          Save Changes
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AdminPage;
