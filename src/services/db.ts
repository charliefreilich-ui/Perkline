import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  orderBy,
  limit,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { initialDeals, upcomingDeals, type Deal } from '../data/mockData';

export interface Business {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  image?: string;
  address: string;
  lat: number;
  lng: number;
  businessType: string;
  emoji: string;
  rating: number;
  totalSavingsProvided?: number;
  usageCount?: number;
  isFeatured?: boolean;
  totalFeaturedRevenue?: number;
}

export interface JoinedDeal extends Deal {
  businessId: string;
}

// Flat version for compatibility with existing components
export interface FlatDeal extends Deal {
  businessId: string;
}

export const dbService = {
  // Businesses
  getBusinesses: (callback: (businesses: Business[]) => void) => {
    return onSnapshot(collection(db, 'businesses'), (snap) => {
      let businesses: Business[] = [];
      if (snap.empty) {
        // Fallback: extract businesses from mock data
        const seen = new Set();
        upcomingDeals.forEach(d => {
          const id = d.business.toLowerCase().replace(/\s+/g, '-');
          if (!seen.has(id)) {
            seen.add(id);
            businesses.push({
              id,
              name: d.business,
              logo: d.logo,
              website: d.website,
              image: d.image,
              address: d.address,
              lat: d.lat,
              lng: d.lng,
              businessType: d.businessType,
              emoji: d.emoji,
              rating: d.rating,
              totalSavingsProvided: 0
            });
          }
        });
      } else {
        businesses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
      }
      callback(businesses);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));
  },

  updateBusiness: async (id: string, data: Partial<Business>) => {
    try {
      const ref = doc(db, 'businesses', id);
      await updateDoc(ref, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${id}`);
    }
  },

  // Deals
  getDeals: (callback: (deals: FlatDeal[]) => void) => {
    let businesses: Record<string, Business> = {};
    let deals: any[] = [];
    
    const refresh = () => {
      let finalDeals = deals;
      
      // Fallback: if no deals from Firestore, use mock data
      if (finalDeals.length === 0) {
        finalDeals = upcomingDeals.map(d => ({
          ...d,
          businessId: d.business.toLowerCase().replace(/\s+/g, '-')
        }));
      }

      const joined = finalDeals.map(d => {
        const bus = businesses[d.businessId];
        // If we have the business data from Firestore or derived, use it
        if (!bus) {
           // Fallback business info if still missing
           return d as unknown as FlatDeal;
        }
        return {
          ...d,
          business: bus.name,
          logo: bus.logo,
          website: bus.website,
          image: bus.image,
          lat: bus.lat,
          lng: bus.lng,
          address: bus.address,
          businessType: bus.businessType,
          emoji: bus.emoji,
          rating: bus.rating
        } as FlatDeal;
      }).filter(Boolean) as FlatDeal[];
      callback(joined);
    };

    const unsubBusinesses = onSnapshot(collection(db, 'businesses'), (bSnap) => {
      if (!bSnap.empty) {
        bSnap.docs.forEach(d => {
          businesses[d.id] = { id: d.id, ...d.data() } as Business;
        });
      } else {
        // Build mock businesses
        upcomingDeals.forEach(d => {
          const id = d.business.toLowerCase().replace(/\s+/g, '-');
          if (!businesses[id]) {
            businesses[id] = {
              id, name: d.business, logo: d.logo, website: d.website,
              address: d.address, lat: d.lat, lng: d.lng,
              businessType: d.businessType, emoji: d.emoji, rating: d.rating
            } as Business;
          }
        });
      }
      refresh();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));

    const unsubDeals = onSnapshot(collection(db, 'deals'), (dSnap) => {
      deals = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      refresh();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'deals'));

    return () => {
      unsubBusinesses();
      unsubDeals();
    };
  },

  addDeal: async (deal: any) => {
    try {
      const ref = doc(collection(db, 'deals'));
      await setDoc(ref, { ...deal, id: ref.id, createdAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'deals');
    }
  },

  updateDeal: async (id: string, data: Partial<FlatDeal>) => {
    try {
      const ref = doc(db, 'deals', id);
      await updateDoc(ref, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deals/${id}`);
    }
  },

  removeDeal: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'deals', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `deals/${id}`);
    }
  },

  // Stats
  getTopSavingBusiness: (callback: (business: Business | null) => void) => {
    const q = query(collection(db, 'businesses'), orderBy('totalSavingsProvided', 'desc'), limit(1));
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const b = snap.docs[0];
      callback({ id: b.id, ...b.data() } as Business);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));
  },

  getTopDeals: (callback: (deals: FlatDeal[]) => void) => {
    let deals: any[] = [];
    let businesses: Record<string, Business> = {};

    const refresh = () => {
      let finalDeals = deals;
      if (finalDeals.length === 0) {
        finalDeals = upcomingDeals.slice(0, 3).map(d => ({
          ...d,
          businessId: d.business.toLowerCase().replace(/\s+/g, '-')
        }));
      }

      const joined = finalDeals.map(d => {
        const bus = businesses[d.businessId];
        if (!bus) return d as unknown as FlatDeal;
        return {
          ...d,
          business: bus.name,
          logo: bus.logo,
          website: bus.website,
          emoji: bus.emoji
        } as FlatDeal;
      }).filter(Boolean) as FlatDeal[];
      callback(joined);
    };

    const unsubBusinesses = onSnapshot(collection(db, 'businesses'), (snap) => {
      if (!snap.empty) {
        snap.docs.forEach(d => {
          businesses[d.id] = { id: d.id, ...d.data() } as Business;
        });
      } else {
        upcomingDeals.forEach(d => {
          const id = d.business.toLowerCase().replace(/\s+/g, '-');
          if (!businesses[id]) {
            businesses[id] = {
              id, name: d.business, logo: d.logo, website: d.website,
              emoji: d.emoji
            } as Business;
          }
        });
      }
      refresh();
    });

    const q = query(collection(db, 'deals'), orderBy('usageCount', 'desc'), limit(3));
    const unsubDeals = onSnapshot(q, (snap) => {
      deals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      refresh();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'deals'));

    return () => {
      unsubBusinesses();
      unsubDeals();
    };
  },

  // Seeding
  simulateUsage: async (deals: Deal[]) => {
    if (deals.length === 0) return;
    
    console.log('Starting usage simulation...');
    const dealUsageMap: Record<string, number> = {};
    const businessSavingsMap: Record<string, number> = {};

    // Simulate 100 usages
    for (let i = 0; i < 100; i++) {
      const randomDeal = deals[Math.floor(Math.random() * deals.length)];
      
      // Increment deal usage
      dealUsageMap[randomDeal.id] = (dealUsageMap[randomDeal.id] || 0) + 1;
      
      // Increment business savings
      const businessId = randomDeal.business.toLowerCase().replace(/\s+/g, '-');
      businessSavingsMap[businessId] = (businessSavingsMap[businessId] || 0) + randomDeal.savings;
    }

    const batch = writeBatch(db);

    // Update deals
    for (const [dealId, count] of Object.entries(dealUsageMap)) {
      const dealRef = doc(db, 'deals', dealId);
      batch.set(dealRef, {
        usageCount: increment(count)
      }, { merge: true });
    }

    // Update businesses
    for (const [businessId, savings] of Object.entries(businessSavingsMap)) {
      const businessRef = doc(db, 'businesses', businessId);
      batch.set(businessRef, {
        totalSavingsProvided: increment(savings)
      }, { merge: true });
    }

    try {
      await batch.commit();
      console.log('Simulation complete!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-simulation');
    }
  },

  seedData: async (initialDeals: Deal[]) => {
    // 1. Extract unique businesses
    const businesses: Record<string, Business> = {};
    initialDeals.forEach(d => {
      if (!businesses[d.business]) {
        businesses[d.business] = {
          id: d.business.toLowerCase().replace(/\s+/g, '-'),
          name: d.business,
          logo: d.logo,
          website: d.website,
          image: d.image,
          address: d.address,
          lat: d.lat,
          lng: d.lng,
          businessType: d.businessType,
          emoji: d.emoji,
          rating: d.rating,
          totalSavingsProvided: Math.floor(Math.random() * 500) + 100 // Seed with some initial data for visual effect
        };
      }
    });

    // 2. Upload businesses
    for (const b of Object.values(businesses)) {
      await setDoc(doc(db, 'businesses', b.id), b);
    }

    // 3. Upload deals
    for (const d of initialDeals) {
      const businessId = d.business.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, 'deals', d.id), {
        ...d,
        businessId,
        usageCount: Math.floor(Math.random() * 50) + 10, // Random initial usage
        createdAt: new Date().toISOString()
      });
    }
  }
};
