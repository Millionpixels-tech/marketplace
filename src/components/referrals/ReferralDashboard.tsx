import React, { useState, useEffect } from 'react';
import { FiCopy, FiShare2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResponsive } from '../../hooks/useResponsive';
import { Pagination, AddBankAccountModal } from '../UI';
import {
  getUserReferralData,
  getUserReferralSignupsPaginated,
  getUserReferralSignupsCount,
  getUserWithdrawalRequests,
  generateReferralUrl,
  requestWithdrawal,
  canWithdraw,
  getMaxWithdrawalAmount,
  formatCurrency,
  MINIMUM_WITHDRAWAL_AMOUNT,
  REFERRAL_EARNING_PER_SIGNUP,
  initializeUserReferral,
  type ReferralUser,
  type ReferralSignup,
  type WithdrawalRequest
} from '../../utils/referrals';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface ReferralDashboardProps {
  profileUid: string | null;
}

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ profileUid }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isMobile } = useResponsive();
  
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralUser | null>(null);
  const [referralSignups, setReferralSignups] = useState<ReferralSignup[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState(MINIMUM_WITHDRAWAL_AMOUNT);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  
  // Pagination state for referral signups
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSignupsCount, setTotalSignupsCount] = useState(0);
  const [lastDocMap, setLastDocMap] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(new Map());
  const [signupsLoading, setSignupsLoading] = useState(false);
  const itemsPerPage = 10;

  const isOwner = user && profileUid === user?.uid;

  useEffect(() => {
    if (!profileUid || !isOwner) return;
    
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        
        // Get or initialize referral data
        let userData = await getUserReferralData(profileUid);
        
        if (!userData) {
          // Initialize referral system for this user
          await initializeUserReferral(profileUid);
          userData = await getUserReferralData(profileUid);
        }
        
        if (userData) {
          setReferralData(userData);
          
          // Fetch withdrawal requests
          const withdrawals = await getUserWithdrawalRequests(profileUid);
          setWithdrawalRequests(withdrawals);
          
          // Fetch total count for pagination
          const totalCount = await getUserReferralSignupsCount(profileUid);
          setTotalSignupsCount(totalCount);
          
          // Fetch first page of signups
          if (totalCount > 0) {
            await fetchSignupsPage(1);
          }
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
        showToast('error', 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [profileUid, isOwner]);

  // Function to fetch signups for a specific page
  const fetchSignupsPage = async (page: number) => {
    if (!profileUid) return;
    
    try {
      setSignupsLoading(true);
      
      // Get the last document for the previous page
      const lastDoc = lastDocMap.get(page - 1) || undefined;
      
      // Fetch signups for this page
      const { signups, lastDoc: newLastDoc } = await getUserReferralSignupsPaginated(
        profileUid,
        itemsPerPage,
        lastDoc
      );
      
      setReferralSignups(signups);
      
      // Store the last document for this page (for next page navigation)
      if (newLastDoc) {
        setLastDocMap(prev => new Map(prev).set(page, newLastDoc));
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching signups page:', error);
      showToast('error', 'Failed to load referral signups');
    } finally {
      setSignupsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchSignupsPage(page);
  };

  const handleCopyReferralUrl = async () => {
    if (!referralData) return;
    
    const referralUrl = generateReferralUrl(referralData.referralCode);
    
    try {
      await navigator.clipboard.writeText(referralUrl);
      showToast('success', 'Referral URL copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('success', 'Referral URL copied to clipboard!');
    }
  };

  const handleShare = async () => {
    if (!referralData) return;
    
    const referralUrl = generateReferralUrl(referralData.referralCode);
    const shareText = `Join Sina.lk using my referral link and discover amazing Sri Lankan products! ${referralUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Sina.lk Marketplace',
          text: shareText,
          url: referralUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          handleCopyReferralUrl();
        }
      }
    } else {
      handleCopyReferralUrl();
    }
  };

  const loadUserBankAccounts = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const accounts = userData.bankAccounts || [];
        setBankAccounts(accounts);
        
        // Set default bank account as selected
        const defaultAccount = accounts.find((acc: any) => acc.isDefault);
        if (defaultAccount) {
          setSelectedBankAccount(defaultAccount.id);
        } else if (accounts.length > 0) {
          setSelectedBankAccount(accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      showToast('error', 'Failed to load bank accounts');
    }
  };

  const handleWithdrawal = async () => {
    if (!referralData || !user) return;
    
    try {
      setSubmittingWithdrawal(true);
      
      // Find the selected bank account
      const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccount);
      
      if (!selectedAccount) {
        showToast('error', 'Please select a bank account');
        return;
      }
      
      await requestWithdrawal(user.uid, withdrawalAmount, {
        accountNumber: selectedAccount.accountNumber,
        bankName: selectedAccount.bankName,
        fullName: selectedAccount.fullName,
        branch: selectedAccount.branch
      });
      
      showToast('success', 'Withdrawal request submitted successfully!');
      setShowWithdrawalModal(false);
      
      // Refresh data
      if (profileUid) {
        const [updatedReferralData, updatedWithdrawals] = await Promise.all([
          getUserReferralData(profileUid),
          getUserWithdrawalRequests(profileUid)
        ]);
        
        setReferralData(updatedReferralData);
        setWithdrawalRequests(updatedWithdrawals);
      }
      
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      showToast('error', error.message || 'Failed to request withdrawal');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Referral information is only visible to the account owner.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isMobile ? 'py-12' : 'py-16'}`}>
        <div className={`animate-spin rounded-full ${isMobile ? 'h-8 w-8' : 'h-12 w-12'} border-b-2 border-green-600`}></div>
        <span className={`ml-3 text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Loading referral data...</span>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load referral data. Please try again later.</p>
      </div>
    );
  }

  const referralUrl = generateReferralUrl(referralData.referralCode);
  const canRequestWithdrawal = canWithdraw(referralData.availableBalance);
  const maxWithdrawalAmount = getMaxWithdrawalAmount(referralData.availableBalance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} mb-6`}>
        <div>
          <h2 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'} text-gray-900 mb-2`}>
            Referral Program
          </h2>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
            Earn {formatCurrency(REFERRAL_EARNING_PER_SIGNUP)} for each friend who signs up using your referral link
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 lg:grid-cols-4 gap-4'}`}>
        {/* Total Signups */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="text-center">
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-2`}>
              {referralData.totalSignups}
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium`}>
              Total Signups
            </p>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="text-center">
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-green-600 mb-2`}>
              {formatCurrency(referralData.totalEarnings)}
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium`}>
              Total Earnings
            </p>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="text-center">
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-blue-600 mb-2`}>
              {formatCurrency(referralData.availableBalance)}
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium`}>
              Available Balance
            </p>
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="text-center">
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-purple-600 mb-2`}>
              {formatCurrency(referralData.totalWithdrawn)}
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium`}>
              Total Withdrawn
            </p>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-3'}`}>
          <div className="flex-1">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
            />
          </div>
          <div className={`flex ${isMobile ? 'gap-2' : 'gap-3'}`}>
            <button
              onClick={handleCopyReferralUrl}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FiCopy className="w-4 h-4" />
              {isMobile ? 'Copy' : 'Copy Link'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiShare2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this link with friends to earn {formatCurrency(REFERRAL_EARNING_PER_SIGNUP)} when they sign up
        </p>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Withdraw Earnings</h3>
          {canRequestWithdrawal && (
            <button
              onClick={() => {
                setShowWithdrawalModal(true);
                loadUserBankAccounts();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Request Withdrawal
            </button>
          )}
        </div>
        
        {!canRequestWithdrawal ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Minimum withdrawal amount is {formatCurrency(MINIMUM_WITHDRAWAL_AMOUNT)}. 
              You need {formatCurrency(MINIMUM_WITHDRAWAL_AMOUNT - referralData.availableBalance)} more to withdraw.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              You can withdraw up to {formatCurrency(maxWithdrawalAmount)} in multiples of {formatCurrency(MINIMUM_WITHDRAWAL_AMOUNT)}.
            </p>
          </div>
        )}

        {/* Recent Withdrawal Requests */}
        {withdrawalRequests.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Recent Withdrawal Requests</h4>
            <div className="space-y-3">
              {withdrawalRequests.slice(0, 3).map((withdrawal) => (
                <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {withdrawal.requestedAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    withdrawal.status === 'paid' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Signups */}
      {totalSignupsCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Referral Signups</h3>
            <span className="text-sm text-gray-500">
              {totalSignupsCount} total signup{totalSignupsCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {signupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600 text-sm">Loading signups...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {referralSignups.map((signup, index) => (
                  <div key={signup.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{signup.newUserName || signup.newUserEmail}</p>
                      <p className="text-sm text-gray-500">
                        {signup.signupMethod === 'google' ? 'Google Sign-up' : 'Email Sign-up'} • 
                        {signup.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                      </p>
                    </div>
                    <span className="text-green-600 font-medium">
                      +{formatCurrency(signup.earningsPaid)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {Math.ceil(totalSignupsCount / itemsPerPage) > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalSignupsCount / itemsPerPage)}
                    onPageChange={handlePageChange}
                    showInfo={false}
                    showJumpTo={false}
                    maxVisiblePages={3}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state for signups */}
      {totalSignupsCount === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referral Signups</h3>
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No referral signups yet. Share your referral link to start earning!
            </p>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Withdrawal</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <select
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Array.from(
                  { length: Math.floor(maxWithdrawalAmount / MINIMUM_WITHDRAWAL_AMOUNT) },
                  (_, i) => {
                    const amount = (i + 1) * MINIMUM_WITHDRAWAL_AMOUNT;
                    return (
                      <option key={amount} value={amount}>
                        {formatCurrency(amount)}
                      </option>
                    );
                  }
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Withdrawals are processed in multiples of {formatCurrency(MINIMUM_WITHDRAWAL_AMOUNT)}
              </p>
            </div>

            {/* Bank Account Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account
              </label>
              {bankAccounts.length > 0 ? (
                <select
                  value={selectedBankAccount}
                  onChange={(e) => setSelectedBankAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber.slice(-4)} 
                      {account.isDefault && ' (Default)'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 text-sm mb-2">No bank accounts found</p>
                  <button
                    onClick={() => setShowAddBankModal(true)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Add Bank Account
                  </button>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                Withdrawal will be processed to your selected bank account within 3-7 business days.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submittingWithdrawal}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={submittingWithdrawal || (bankAccounts.length === 0)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submittingWithdrawal ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddBankModal && (
        <AddBankAccountModal
          isOpen={showAddBankModal}
          onClose={() => setShowAddBankModal(false)}
          onBankAccountAdded={(updatedAccounts) => {
            // Update the bank accounts list with the new accounts
            setBankAccounts(updatedAccounts);
            
            // Set the new account as selected (it should be the default one)
            const defaultAccount = updatedAccounts.find(acc => acc.isDefault);
            if (defaultAccount) {
              setSelectedBankAccount(defaultAccount.id);
            }
            
            // Close the modal
            setShowAddBankModal(false);
            
            // Show success message
            showToast('success', 'Bank account added successfully!');
          }}
        />
      )}
    </div>
  );
};

export default ReferralDashboard;
