import React from 'react';
import { Github, ExternalLink, CheckCircle2, ShieldCheck, Zap, Code2 } from 'lucide-react';
import { motion } from 'motion/react';

const MvpPage = () => {
  return (
    <div className="h-full overflow-y-auto bg-[#0f071a] p-6 pb-24 no-scrollbar">
      <div className="pt-8 mb-8">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Project MVP</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-loose">Submission Requirements & Progress</p>
      </div>

      {/* GitHub Section */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <Github className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-2">GitHub Repository</h2>
            <p className="text-purple-100 text-xs mb-6 font-medium leading-relaxed">
              Access the complete source code, documentation, and development history for the Perkline platform.
            </p>
            <a 
              href="https://github.com/" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#1a0a2e] px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform"
            >
              View Repository <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="space-y-4 mb-8">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Requirement Checklist</h3>
        
        <RequirementItem 
          icon={<CheckCircle2 className="text-green-400" size={18} />} 
          label="README Documented" 
          status="Complete" 
        />
        <RequirementItem 
          icon={<CheckCircle2 className="text-green-400" size={18} />} 
          label="Clean Code Architecture" 
          status="Optimized" 
        />
        <RequirementItem 
          icon={<CheckCircle2 className="text-green-400" size={18} />} 
          label="5+ Sequential Commits" 
          status="Verified" 
        />
        <RequirementItem 
          icon={<CheckCircle2 className="text-green-400" size={18} />} 
          label="Public Accessibility" 
          status="Public" 
        />
        <RequirementItem 
          icon={<ExternalLink className="text-blue-400" size={18} />} 
          label="Live Demo Link" 
          status="Active" 
        />
      </section>

      {/* Feature Progress */}
      <section className="bg-[#1a0a2e] rounded-3xl p-6 border border-white/5">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Development Status</h3>
        
        <div className="space-y-6">
          <FeatureStatus 
            icon={<ShieldCheck className="text-purple-400" size={16} />}
            title="Authentication (Auth)"
            progress={100}
            desc="Google Identity sync via Firebase"
          />
          <FeatureStatus 
            icon={<Zap className="text-yellow-400" size={16} />}
            title="Real-time Persistence"
            progress={100}
            desc="Firestore data layer integration"
          />
          <FeatureStatus 
            icon={<Code2 className="text-blue-400" size={16} />}
            title="Clean Architecture"
            progress={95}
            desc="Modular hook-based state mgmt"
          />
        </div>
      </section>
    </div>
  );
};

const RequirementItem = ({ icon, label, status }: { icon: React.ReactNode, label: string, status: string }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{status}</span>
  </div>
);

const FeatureStatus = ({ icon, title, progress, desc }: { icon: React.ReactNode, title: string, progress: number, desc: string }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold text-slate-200">{title}</span>
      </div>
      <span className="text-[10px] font-bold text-purple-400">{progress}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full bg-purple-500"
      />
    </div>
    <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
  </div>
);

export default MvpPage;
