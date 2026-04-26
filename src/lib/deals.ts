import { doc, collection, addDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';

export async function claimDeal(userId: string, deal: { id: string, business: string, savings: number }) {
  const userRef = doc(db, 'users', userId);
  const activityRef = collection(db, 'users', userId, 'activity');

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Add activity record
      const newActivity = {
        dealId: deal.id,
        business: deal.business,
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
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/activity`);
  }
}
