// src/hooks/useBuyerVerification.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkBuyerReports, checkBuyerVerification, getBuyerStatusMessage, type BuyerReportStatus } from '../utils/buyerVerification';

export function useBuyerVerification() {
  const { user } = useAuth();
  const [buyerReportStatus, setBuyerReportStatus] = useState<BuyerReportStatus>({
    hasReports: false,
    reportCount: 0,
    isBlocked: false,
    needsVerification: false
  });
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
        
        const [reportStatus, verified] = await Promise.all([
          checkBuyerReports(user.uid),
          checkBuyerVerification(user.uid)
        ]);
        
        setBuyerReportStatus(reportStatus);
        setIsVerified(verified);
      } catch (error) {
        console.error('Error checking buyer verification status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user?.uid]);

  const statusMessage = getBuyerStatusMessage(buyerReportStatus, isVerified);

  return {
    buyerReportStatus,
    isVerified,
    loading,
    statusMessage,
    canPlaceOrders: !buyerReportStatus.isBlocked || isVerified,
    refresh: async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const [reportStatus, verified] = await Promise.all([
            checkBuyerReports(user.uid),
            checkBuyerVerification(user.uid)
          ]);
          setBuyerReportStatus(reportStatus);
          setIsVerified(verified);
        } catch (error) {
          console.error('Error refreshing buyer verification status:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  };
}
