import { useState, useEffect } from 'react';
import { type Deal } from '../data/mockData';
import { dbService, FlatDeal } from '../services/db';

export const useDealRefresh = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newDealIds, setNewDealIds] = useState<string[]>([]);

  useEffect(() => {
    // Connect to real-time firestore stream
    const unsubscribe = dbService.getDeals((flatDeals) => {
      setDeals(flatDeals);
      setIsVerifying(false);
      setLastRefreshed(new Date());
    });

    return () => unsubscribe();
  }, []);

  const refreshDeals = () => {
    setIsRefreshing(true);
    // In Firestore, we don't really "refresh" manually since its realtime,
    // but we can simulate the UI feedback.
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }, 800);
  };

  return {
    deals,
    isVerifying,
    isRefreshing,
    lastRefreshed,
    newDealIds,
    refreshDeals
  };
};
