import { upcomingDeals } from '../data/mockData';
import { Crown, Zap, Shield, Gift, Star, Utensils, Beer, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

const PlusPage = () => {
  const benefits = [
    { icon: <Zap size={18} />, title: "Early Access", desc: "Claim daily deals 1 hour before everyone else" },
    { icon: <Shield size={18} />, title: "Merchant Guarantee", desc: "Refund protection on all claimed perks" },
    { icon: <Gift size={18} />, title: "Exclusive Rewards", desc: "Unlock premium local events and tastings" }
  ];

  const plusDeals = upcomingDeals.filter(d => d.isPlusOnly);

  return (
    <div className="h-full overflow-y-auto px-6 py-12 bg-[#0f071a] no-scrollbar">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl shadow-2xl shadow-purple-900/40 mb-6 rotate-3"
        >
          <Crown size={32} className="text-white" fill="currentColor" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-white uppercase">Perkline Plus</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Premium Member Benefits • Davis, CA</p>
      </div>

      <div className="bg-gradient-to-br from-purple-900 to-[#1a0a2e] rounded-[40px] p-8 border border-purple-500/30 shadow-2xl shadow-purple-900/20 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-bl-[20px]">
          Priority Access
        </div>
        
        <div className="mb-8">
          <p className="text-[10px] uppercase font-bold text-purple-300 mb-2 tracking-widest">Yearly Membership</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white tracking-tighter">$49.99</span>
            <span className="text-slate-400 font-bold capitalize text-sm">/ year</span>
          </div>
          <p className="text-green-400 text-xs font-bold mt-2 tracking-wide">Save 20% compared to monthly billed</p>
        </div>

        <div className="space-y-5 mb-10">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="shrink-0 text-purple-400">{b.icon}</div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">{b.title}</h4>
                <p className="text-[11px] text-slate-400 leading-tight font-medium">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full h-14 bg-white text-[#1a0a2e] rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform shadow-xl">
          Start Unlimited Access
        </button>
        <p className="text-center text-[10px] text-slate-500 mt-5 leading-relaxed font-bold uppercase tracking-widest italic opacity-60">Zero commitment. Cancel membership anytime.</p>
      </div>

      <section className="mb-24 px-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Plus Catalog Preview</h3>
        </div>

        <div className="space-y-4">
          {plusDeals.map(deal => (
            <div key={deal.id} className="group bg-[#1a0a2e] rounded-[32px] overflow-hidden border border-white/5 flex gap-4 p-3 active:scale-[0.98] transition-all">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                {deal.image ? (
                  <img src={deal.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-purple-400 opacity-40">
                    {deal.category === 'food' ? <Utensils size={28} /> : deal.category === 'drinks' ? <Beer size={28} /> : <Trophy size={28} />}
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <h4 className="font-bold text-white text-base leading-tight mb-1 truncate">{deal.title}</h4>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">{deal.business}</p>
                <div className="flex justify-between items-center">
                  <div className="bg-white/5 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/5">
                    <Star size={10} className="fill-yellow-500 text-yellow-500" />
                    <span className="text-[10px] font-bold text-slate-300">{deal.rating}</span>
                  </div>
                  <div className="text-yellow-500 text-[10px] font-black uppercase tracking-widest italic opacity-80">Plus Exclusive</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PlusPage;
