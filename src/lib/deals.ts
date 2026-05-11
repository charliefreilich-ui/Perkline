import { doc, collection, addDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';

export async function claimDeal(userId: string, deal: { id: string, business: string, savings: number }) {
  const userRef = doc(db, 'users', userId);
  const activityRef = collection(db, 'users', userId, 'activity');

  try {
    await runTransaction(db, async (transaction) => {
      // 0. Get business ID
      const businessId = deal.business.toLowerCase().replace(/\s+/g, '-');
      const businessRef = doc(db, 'businesses', businessId);
      const businessSnap = await transaction.get(businessRef);
      const businessData = businessSnap.data();

      // 1. Add activity record
      const newActivity = {
        dealId: deal.id,
        business: deal.business,
        businessId: businessId,
        logo: businessData?.logo || null,
        emoji: businessData?.emoji || '🎫',
        savings: deal.savings,
        date: new Date().toISOString()
      };
      
      // Note: addDoc can't be used directly in transaction, must specify ID or use doc()
      const newActivityRef = doc(activityRef);
      transaction.set(newActivityRef, newActivity);

      // 2. Update user totals
      transaction.update(userRef, {
        totalSavings: increment(deal.savings),
        dealsUsedCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      // 3. Update business total savings provided
      transaction.update(businessRef, {
        totalSavingsProvided: increment(deal.savings)
      });

      // 4. Update deal usage count
      const dealRef = doc(db, 'deals', deal.id);
      const dealSnap = await transaction.get(dealRef);
      const dealData = dealSnap.data();
      
      const scanUpdate: any = {
        usageCount: increment(1)
      };

      // If deal is featured, increment featured scan count and business revenue
      if (dealData?.isFeatured) {
        const SCAN_FEE = 0.25; // $0.25 per scan
        scanUpdate.featuredScanCount = increment(1);
        transaction.update(businessRef, {
          totalFeaturedRevenue: increment(SCAN_FEE)
        });
      }

      transaction.update(dealRef, scanUpdate);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/activity`);
  }
}
