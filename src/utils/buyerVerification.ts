// src/utils/buyerVerification.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface BuyerReportStatus {
  hasReports: boolean;
  reportCount: number;
  isBlocked: boolean;
  needsVerification: boolean;
}

/**
 * Check if a buyer has any reports against them
 */
export async function checkBuyerReports(buyerId: string): Promise<BuyerReportStatus> {
  try {
    // Query all reports for this buyer
    const reportsQuery = query(
      collection(db, 'buyerReports'),
      where('buyerId', '==', buyerId)
    );
    
    const reportsSnapshot = await getDocs(reportsQuery);
    const reportCount = reportsSnapshot.size;
    
    // If buyer has any reports, they need verification
    const hasReports = reportCount > 0;
    const needsVerification = hasReports;
    
    // Blocking logic depends on verification status:
    // - Unverified buyers: blocked with 1+ reports
    // - Verified buyers: blocked with 3+ reports
    // Note: This will be checked against verification status in the UI
    const isBlocked = reportCount >= 1; // Will be refined based on verification status
    
    return {
      hasReports,
      reportCount,
      isBlocked,
      needsVerification
    };
  } catch (error) {
    console.error('Error checking buyer reports:', error);
    return {
      hasReports: false,
      reportCount: 0,
      isBlocked: false,
      needsVerification: false
    };
  }
}

/**
 * Check if a buyer is verified (has verification badge)
 * This would check a user's verification status in their profile
 */
export async function checkBuyerVerification(buyerId: string): Promise<boolean> {
  try {
    // You can implement verification logic here
    // For now, we'll check if they have a verified field in their user document
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('uid', '==', buyerId)
    ));
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      return userData.verified === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking buyer verification:', error);
    return false;
  }
}

/**
 * Get human-readable message for buyer status
 */
export function getBuyerStatusMessage(reportStatus: BuyerReportStatus, isVerified: boolean): {
  type: 'warning' | 'error' | 'info';
  message: string;
  canProceed: boolean;
} {
  const isBlocked = shouldBlockBuyer(reportStatus, isVerified);

  if (isBlocked && !isVerified) {
    // Unverified buyer with 1+ reports
    return {
      type: 'error',
      message: `Your account has been reported by ${reportStatus.reportCount} seller${reportStatus.reportCount > 1 ? 's' : ''}. You need to get a verification badge to place orders. Go to Settings to submit documents for verification or contact customer support.`,
      canProceed: false
    };
  }

  if (isBlocked && isVerified) {
    // Verified buyer with 3+ reports
    return {
      type: 'error',
      message: `Your account has been reported by ${reportStatus.reportCount} sellers. Please contact customer support to resolve these issues before placing orders.`,
      canProceed: false
    };
  }

  if (reportStatus.hasReports && isVerified && !isBlocked) {
    // Verified buyer with 1-2 reports (can still order)
    return {
      type: 'warning',
      message: `Your account has ${reportStatus.reportCount} report${reportStatus.reportCount > 1 ? 's' : ''} from sellers. You can still place orders with your verification badge, but consider resolving these issues.`,
      canProceed: true
    };
  }
  
  if (isVerified) {
    return {
      type: 'info',
      message: 'Your account is verified ✓',
      canProceed: true
    };
  }
  
  return {
    type: 'info',
    message: '',
    canProceed: true
  };
}

/**
 * Determine if a buyer should be blocked from placing orders
 * based on their verification status and report count
 */
export function shouldBlockBuyer(reportStatus: BuyerReportStatus, isVerified: boolean): boolean {
  if (!reportStatus.hasReports) {
    return false; // No reports = no blocking
  }

  if (!isVerified) {
    // Unverified buyers: blocked with 1+ reports
    return reportStatus.reportCount >= 1;
  } else {
    // Verified buyers: blocked with 3+ reports
    return reportStatus.reportCount >= 3;
  }
}
