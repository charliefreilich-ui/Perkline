import React, { useMemo } from 'react';
import { ChevronLeft, TrendingUp, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

const SavingsPage = ({ onBack }: { onBack: () => void }) => {
  const { profile } = useAuth();

  // Mock data for the trend
  const data = useMemo(() => [
    { day: 'Mon', amount: 12 },
    { day: 'Tue', amount: 25 },
    { day: 'Wed', amount: 18 },
    { day: 'Thu', amount: 42 },
    { day: 'Fri', amount: 35 },
    { day: 'Sat', amount: 65 },
    { day: 'Sun', amount: profile?.totalSavings || 85 },
  ], [profile?.totalSavings]);

  return (
    <div className="h-full flex flex-col bg-[#0f071a] no-scrollbar">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#1a0a2e] flex items-center px-6 shrink-0">
        <button onClick={onBack} className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-400 active:bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-white uppercase ml-2">Savings Analytics</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-6 px-6 pb-24 space-y-6">
        {/* Hero Totals */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a0a2e] p-5 rounded-3xl border border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <TrendingUp size={14} className="text-purple-400" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth</span>
             </div>
             <p className="text-2xl font-bold text-white">+24%</p>
             <p className="text-[10px] text-slate-500 font-medium">vs last month</p>
          </div>
          <div className="bg-[#1a0a2e] p-5 rounded-3xl border border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <Calendar size={14} className="text-blue-400" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Best Day</span>
             </div>
             <p className="text-2xl font-bold text-white">Friday</p>
             <p className="text-[10px] text-slate-500 font-medium">$12.50 avg</p>
          </div>
        </section>

        {/* Graph Card */}
        <section className="bg-gradient-to-b from-[#1a0a2e] to-[#0f071a] rounded-[32px] p-6 border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Weekly Trend</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Cumulative savings over 7 days</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-400" />
            </div>
          </div>

          <div className="h-64 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a0a2e', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSavings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Breakdown */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Category Split</h3>
          
          <CategoryItem 
            icon="🍕" 
            label="Food & Dining" 
            amount={profile?.totalSavings ? profile.totalSavings * 0.65 : 45.50} 
            percentage={65}
            color="bg-orange-500"
          />
          <CategoryItem 
            icon="🍹" 
            label="Nightlife" 
            amount={profile?.totalSavings ? profile.totalSavings * 0.25 : 18.25} 
            percentage={25}
            color="bg-purple-500"
          />
          <CategoryItem 
            icon="🎟️" 
            label="Local Events" 
            amount={profile?.totalSavings ? profile.totalSavings * 0.10 : 7.25} 
            percentage={10}
            color="bg-blue-500"
          />
        </section>

        {/* Pro Tip */}
        <div className="bg-purple-600/10 border border-purple-500/20 p-5 rounded-3xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0">
             <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Optimization Goal</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">You're currently in the top 15% of Davis savers. Claim 2 more deals this week to reach the 'Davis Legend' rank.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryItem = ({ icon, label, amount, percentage, color }: { icon: string, label: string, amount: number, percentage: number, color: string }) => (
  <div className="bg-[#1a0a2e] p-4 rounded-3xl border border-white/5">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-xs font-bold text-white tracking-tight">{label}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{percentage}% of total</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">${amount.toFixed(2)}</p>
        <ArrowUpRight size={12} className="text-purple-400 ml-auto" />
      </div>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className={cn("h-full", color)}
      />
    </div>
  </div>
);

export default SavingsPage;
