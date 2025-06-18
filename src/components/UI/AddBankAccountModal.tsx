import { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";

interface BankAccount {
    id: string;
    accountNumber: string;
    branch: string;
    bankName: string;
    fullName: string;
    isDefault: boolean;
    createdAt: Date;
}

interface AddBankAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBankAccountAdded: (bankAccounts: BankAccount[]) => void;
}

export default function AddBankAccountModal({ isOpen, onClose, onBankAccountAdded }: AddBankAccountModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        accountNumber: '',
        branch: '',
        bankName: '',
        fullName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateBankAccountId = () => {
        return `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setLoading(true);
        setError(null);

        try {
            // Get current user data
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};
            const currentBankAccounts = userData.bankAccounts || [];

            // Create new bank account
            const newAccount: BankAccount = {
                id: generateBankAccountId(),
                accountNumber: formData.accountNumber,
                branch: formData.branch,
                bankName: formData.bankName,
                fullName: formData.fullName,
                isDefault: currentBankAccounts.length === 0, // First account is default
                createdAt: new Date(),
            };

            const updatedAccounts = [...currentBankAccounts, newAccount];

            // Update user document
            await updateDoc(userDocRef, {
                bankAccounts: updatedAccounts
            });

            // Call the callback to update parent component
            onBankAccountAdded(updatedAccounts);

            // Reset form and close modal
            setFormData({ accountNumber: '', branch: '', bankName: '', fullName: '' });
            onClose();
        } catch (err) {
            console.error('Error adding bank account:', err);
            setError('Failed to add bank account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ accountNumber: '', branch: '', bankName: '', fullName: '' });
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200"
                style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-[#0d0a0b]">
                            Add Bank Account
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-red-800 text-sm">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#0d0a0b] mb-2">
                                Full Name (Account Holder)
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0d0a0b] mb-2">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                value={formData.bankName}
                                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                                placeholder="e.g., Commercial Bank, People's Bank"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0d0a0b] mb-2">
                                Account Number
                            </label>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0d0a0b] mb-2">
                                Branch
                            </label>
                            <input
                                type="text"
                                value={formData.branch}
                                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                                placeholder="e.g., Colombo, Kandy, Galle"
                                required
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-[#72b01d] hover:bg-[#3f7d20] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Bank Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
