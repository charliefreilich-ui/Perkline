import { useState, useEffect } from 'react';
import { initialDeals, upcomingDeals, type Deal } from '../data/mockData';

export const useDealRefresh = () => {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newDealIds, setNewDealIds] = useState<string[]>([]);

  // Simulation of verifying pin locations via Nominatim
  useEffect(() => {
    const verifyPins = async () => {
      setIsVerifying(true);
      // Simulate network delay for verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setDeals(prev => prev.map(deal => ({
        ...deal,
        locationVerified: true
      })));
      setIsVerifying(false);
    };

    verifyPins();
  }, []);

  const refreshDeals = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Pick 1 random deal from upcoming pool
      const randomUpcoming = upcomingDeals[Math.floor(Math.random() * upcomingDeals.length)];
      
      if (!deals.some(d => d.id === randomUpcoming.id)) {
        const newDeal = { ...randomUpcoming, isNew: true };
        setDeals(prev => [newDeal, ...prev]);
        setNewDealIds(prev => [newDeal.id, ...prev]);
        
        // Clear "new" badge after 30s
        setTimeout(() => {
          setNewDealIds(prev => prev.filter(id => id !== newDeal.id));
        }, 30000);
      }

      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshDeals, 300000);
    return () => clearInterval(interval);
  }, []);

  return {
    deals,
    isVerifying,
    isRefreshing,
    lastRefreshed,
    newDealIds,
    refreshDeals
  };
};
