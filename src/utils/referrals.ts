import { db } from './firebase';
import { 
  collection, 
  doc,
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  addDoc,
  increment,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type DocumentData 
} from 'firebase/firestore';

// Constants
export const REFERRAL_EARNING_PER_SIGNUP = 20; // LKR
export const MINIMUM_WITHDRAWAL_AMOUNT = 1000; // LKR

export interface ReferralUser {
  id?: string;
  userId: string;
  referralCode: string;
  totalSignups: number;
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
  createdAt: any;
  updatedAt: any;
}

export interface ReferralSignup {
  id?: string;
  referralCode: string;
  referrerUserId: string;
  newUserId: string;
  newUserEmail: string;
  newUserName?: string;
  signupMethod: 'email' | 'google';
  earningsPaid: number;
  createdAt: any;
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestedAt: any;
  processedAt?: any;
  adminNotes?: string;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    fullName: string;
    branch?: string;
  };
}

/**
 * Generate a unique referral code for a user
 */
export const generateReferralCode = (userId: string): string => {
  // Create a 6-character code using user ID and random characters
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  const userPart = userId.substring(0, 3).toUpperCase();
  return `${userPart}${randomPart}`;
};

/**
 * Initialize referral system for a new user
 */
export const initializeUserReferral = async (userId: string): Promise<string> => {
  try {
    const referralCode = generateReferralCode(userId);
    
    const referralData: Omit<ReferralUser, 'id'> = {
      userId,
      referralCode,
      totalSignups: 0,
      totalEarnings: 0,
      availableBalance: 0,
      totalWithdrawn: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'referrals', userId), referralData);
    return referralCode;
  } catch (error) {
    console.error('Error initializing user referral:', error);
    throw error;
  }
};

/**
 * Get user's referral data
 */
export const getUserReferralData = async (userId: string): Promise<ReferralUser | null> => {
  try {
    const docRef = doc(db, 'referrals', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ReferralUser;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user referral data:', error);
    throw error;
  }
};

/**
 * Generate referral URL for a user
 */
export const generateReferralUrl = (referralCode: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sina.lk';
  return `${baseUrl}/auth?ref=${referralCode}`;
};

/**
 * Process a referral signup
 */
export const processReferralSignup = async (
  referralCode: string,
  newUserId: string,
  newUserEmail: string,
  signupMethod: 'email' | 'google',
  newUserName?: string
): Promise<void> => {
  try {
    // Find the referrer by referral code
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referralCode', '==', referralCode)
    );
    
    const querySnapshot = await getDocs(referralsQuery);
    
    if (querySnapshot.empty) {
      console.warn('Invalid referral code:', referralCode);
      return;
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerUserId = referrerDoc.data().userId;

    // Don't allow self-referral
    if (referrerUserId === newUserId) {
      console.warn('User attempted to refer themselves');
      return;
    }

    // Check if this user was already referred
    const existingSignupQuery = query(
      collection(db, 'referralSignups'),
      where('newUserId', '==', newUserId)
    );
    const existingSignups = await getDocs(existingSignupQuery);
    
    if (!existingSignups.empty) {
      console.warn('User already has a referral signup record');
      return;
    }

    // Create referral signup record
    const signupData: Omit<ReferralSignup, 'id'> = {
      referralCode,
      referrerUserId,
      newUserId,
      newUserEmail,
      newUserName,
      signupMethod,
      earningsPaid: REFERRAL_EARNING_PER_SIGNUP,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'referralSignups'), signupData);

    // Update referrer's earnings
    const referrerDocRef = doc(db, 'referrals', referrerUserId);
    await updateDoc(referrerDocRef, {
      totalSignups: increment(1),
      totalEarnings: increment(REFERRAL_EARNING_PER_SIGNUP),
      availableBalance: increment(REFERRAL_EARNING_PER_SIGNUP),
      updatedAt: serverTimestamp()
    });

    console.log(`Referral processed: ${newUserEmail} referred by ${referrerUserId}`);
  } catch (error) {
    console.error('Error processing referral signup:', error);
    throw error;
  }
};

/**
 * Get user's referral signups
 */
export const getUserReferralSignups = async (userId: string): Promise<ReferralSignup[]> => {
  try {
    const signupsQuery = query(
      collection(db, 'referralSignups'),
      where('referrerUserId', '==', userId)
    );
    
    const querySnapshot = await getDocs(signupsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReferralSignup));
  } catch (error) {
    console.error('Error getting user referral signups:', error);
    throw error;
  }
};

/**
 * Get user's referral signups with pagination
 */
export const getUserReferralSignupsPaginated = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ signups: ReferralSignup[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    let signupsQuery = query(
      collection(db, 'referralSignups'),
      where('referrerUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      signupsQuery = query(
        collection(db, 'referralSignups'),
        where('referrerUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(signupsQuery);
    
    const signups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReferralSignup));
    
    const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    return { signups, lastDoc: lastDocument };
  } catch (error) {
    console.error('Error getting user referral signups with pagination:', error);
    throw error;
  }
};

/**
 * Get total count of user's referral signups
 */
export const getUserReferralSignupsCount = async (userId: string): Promise<number> => {
  try {
    const signupsQuery = query(
      collection(db, 'referralSignups'),
      where('referrerUserId', '==', userId)
    );
    
    const countSnapshot = await getCountFromServer(signupsQuery);
    return countSnapshot.data().count;
  } catch (error) {
    console.error('Error getting user referral signups count:', error);
    throw error;
  }
};

/**
 * Check if user can withdraw (minimum balance requirement)
 */
export const canWithdraw = (availableBalance: number): boolean => {
  return availableBalance >= MINIMUM_WITHDRAWAL_AMOUNT;
};

/**
 * Calculate maximum withdrawal amount
 */
export const getMaxWithdrawalAmount = (availableBalance: number): number => {
  return Math.floor(availableBalance / MINIMUM_WITHDRAWAL_AMOUNT) * MINIMUM_WITHDRAWAL_AMOUNT;
};

/**
 * Request withdrawal
 */
export const requestWithdrawal = async (
  userId: string,
  amount: number,
  bankAccount: WithdrawalRequest['bankAccount']
): Promise<void> => {
  try {
    // Validate amount
    if (amount < MINIMUM_WITHDRAWAL_AMOUNT || amount % MINIMUM_WITHDRAWAL_AMOUNT !== 0) {
      throw new Error(`Withdrawal amount must be in multiples of LKR ${MINIMUM_WITHDRAWAL_AMOUNT}`);
    }

    // Get current user referral data
    const userReferralData = await getUserReferralData(userId);
    if (!userReferralData) {
      throw new Error('User referral data not found');
    }

    if (userReferralData.availableBalance < amount) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // Create withdrawal request
    const withdrawalData: Omit<WithdrawalRequest, 'id'> = {
      userId,
      amount,
      status: 'pending',
      requestedAt: serverTimestamp(),
      bankAccount
    };

    await addDoc(collection(db, 'withdrawalRequests'), withdrawalData);

    // Update user's available balance
    const referralDocRef = doc(db, 'referrals', userId);
    await updateDoc(referralDocRef, {
      availableBalance: increment(-amount),
      updatedAt: serverTimestamp()
    });

    console.log(`Withdrawal request created: ${userId} - LKR ${amount}`);
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    throw error;
  }
};

/**
 * Get user's withdrawal requests
 */
export const getUserWithdrawalRequests = async (userId: string): Promise<WithdrawalRequest[]> => {
  try {
    const withdrawalsQuery = query(
      collection(db, 'withdrawalRequests'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(withdrawalsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WithdrawalRequest));
  } catch (error) {
    console.error('Error getting user withdrawal requests:', error);
    throw error;
  }
};

/**
 * Get referral code from URL params or storage
 */
export const getReferralCodeFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    // Store in sessionStorage for later use during signup
    sessionStorage.setItem('referralCode', refCode);
    return refCode;
  }
  
  // Check if we have a stored referral code
  return sessionStorage.getItem('referralCode');
};

/**
 * Clear stored referral code
 */
export const clearStoredReferralCode = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('referralCode');
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
