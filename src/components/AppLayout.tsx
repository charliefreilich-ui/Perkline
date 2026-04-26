import React, { useState } from 'react';
import { Flame as FlameIcon, Map as MapIcon, Crown, User } from 'lucide-react';
import DealsPage from '../pages/DealsPage';
import MapPage from '../pages/MapPage';
import PlusPage from '../pages/PlusPage';
import ProfilePage from '../pages/ProfilePage';
import { cn } from '../lib/utils';

type Tab = 'deals' | 'map' | 'plus' | 'profile';

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState<Tab>('deals');

  const renderContent = () => {
    switch (activeTab) {
      case 'deals': return <DealsPage />;
      case 'map': return <MapPage />;
      case 'plus': return <PlusPage />;
      case 'profile': return <ProfilePage />;
      default: return <DealsPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f071a] text-slate-100 overflow-hidden selection:bg-purple-500/30 font-sans">
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      <nav className="h-16 bg-[#1a0a2e] border-t border-white/5 flex justify-around items-center px-4 safe-bottom z-50">
        <TabButton 
          icon={<FlameIcon size={18} className={cn("transition-all duration-300", activeTab === 'deals' ? "scale-110 text-purple-400" : "text-slate-500")} />} 
          label="Discovery" 
          active={activeTab === 'deals'} 
          onClick={() => setActiveTab('deals')} 
        />
        <TabButton 
          icon={<MapIcon size={18} className={cn("transition-all duration-300", activeTab === 'map' ? "scale-110 text-purple-400" : "text-slate-500")} />} 
          label="Map View" 
          active={activeTab === 'map'} 
          onClick={() => setActiveTab('map')} 
        />
        <TabButton 
          icon={<Crown size={18} className={cn("transition-all duration-300", activeTab === 'plus' ? "scale-110 text-purple-400" : "text-slate-500")} />} 
          label="Plus" 
          active={activeTab === 'plus'} 
          onClick={() => setActiveTab('plus')} 
        />
        <TabButton 
          icon={<User size={18} className={cn("transition-all duration-300", activeTab === 'profile' ? "scale-110 text-purple-400" : "text-slate-500")} />} 
          label="Account" 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
        />
      </nav>
    </div>
  );
};

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton = ({ icon, label, active, onClick }: TabButtonProps) => (
  <button 
    onClick={onClick} 
    className={cn(
      "flex flex-col items-center gap-1 transition-all duration-300 px-4 py-1.5",
      active ? "text-purple-400 border-t-2 border-purple-600 mt-[-2px]" : "text-slate-500 hover:text-white"
    )}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default AppLayout;
