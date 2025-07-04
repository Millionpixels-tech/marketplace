// src/utils/sellerVerification.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check if a seller is verified (has verification badge)
 * This checks if the seller has completed the verification process
 */
export async function checkSellerVerification(sellerId: string): Promise<boolean> {
  try {
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('uid', '==', sellerId)
    ));
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      // Check both the old verified field and new verification structure
      return userData.verified === true || userData.verification?.isVerified === 'COMPLETED';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking seller verification:', error);
    return false;
  }
}

/**
 * Get verification status message for sellers specifically about bank transfer eligibility
 */
export function getSellerBankTransferEligibilityMessage(isVerified: boolean): {
  type: 'warning' | 'error' | 'info';
  message: string;
  canUseBankTransfer: boolean;
} {
  if (!isVerified) {
    return {
      type: 'warning',
      message: 'You need to verify your account to enable bank transfer payment option. You can still add bank account details, but customers won\'t be able to select bank transfer for your listings until you\'re verified.',
      canUseBankTransfer: false
    };
  }

  return {
    type: 'info',
    message: 'Your account is verified ✓ You can enable bank transfer payments for your listings.',
    canUseBankTransfer: true
  };
}
