// src/hooks/useSellerVerification.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkSellerVerification, getSellerBankTransferEligibilityMessage } from '../utils/sellerVerification';

export function useSellerVerification() {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const verified = await checkSellerVerification(user.uid);
        setIsVerified(verified);
      } catch (error) {
        console.error('Error checking seller verification status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user?.uid]);

  const bankTransferEligibility = getSellerBankTransferEligibilityMessage(isVerified);

  return {
    isVerified,
    loading,
    bankTransferEligibility,
    canUseBankTransfer: isVerified,
    refresh: async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const verified = await checkSellerVerification(user.uid);
          setIsVerified(verified);
        } catch (error) {
          console.error('Error refreshing seller verification status:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  };
}
