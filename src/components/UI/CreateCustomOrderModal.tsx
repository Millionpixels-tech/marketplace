// src/components/UI/CreateCustomOrderModalWizard.tsx
import { useState, useEffect } from "react";
import { FiX, FiMinus, FiSend, FiPackage, FiEdit3, FiShoppingCart, FiTruck, FiCreditCard, FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { createCustomOrder, getSellerActiveListingsCount, getSellerActiveListings } from "../../utils/customOrders";
import { sendMessage } from "../../utils/messaging";
import { useResponsive } from "../../hooks/useResponsive";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { ItemType } from "../../utils/categories";
import type { CustomOrderItem, SellerListing } from "../../utils/customOrders";

interface BankAccount {
  id: string;
  accountNumber: string;
  branch: string;
  bankName: string;
  fullName: string;
  isDefault: boolean;
  createdAt: Date;
}

interface CreateCustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  buyerId?: string;
  buyerName?: string;
  source?: 'messages' | 'dashboard';
}

export default function CreateCustomOrderModal({
  isOpen,
  onClose,
  conversationId,
  buyerId,
  buyerName,
  source = 'messages'
}: CreateCustomOrderModalProps) {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasActiveListings, setHasActiveListings] = useState(false);
  const [checkingListings, setCheckingListings] = useState(true);
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  
  // Bank account state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState({
    accountNumber: '',
    branch: '',
    bankName: '',
    fullName: ''
  });
  const [bankAccountLoading, setBankAccountLoading] = useState(false);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null);
  
  // Form state
  const [items, setItems] = useState<CustomOrderItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [notes, setNotes] = useState('');

  // Check if seller has active listings and fetch them
  useEffect(() => {
    const checkActiveListings = async () => {
      if (!user || !isOpen) return;
      
      setCheckingListings(true);
      try {
        const [count, listings] = await Promise.all([
          getSellerActiveListingsCount(user.uid),
          getSellerActiveListings(user.uid, selectedItemType || undefined)
        ]);
        setHasActiveListings(count > 0);
        setSellerListings(listings);
      } catch (error) {
        console.error("Error checking active listings:", error);
        setHasActiveListings(false);
        setSellerListings([]);
      } finally {
        setCheckingListings(false);
      }
    };

    checkActiveListings();
  }, [user, isOpen, selectedItemType]);

  // Check if seller has bank accounts
  useEffect(() => {
    const checkBankAccounts = async () => {
      if (!user || !isOpen) return;
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.bankAccounts && Array.isArray(userData.bankAccounts)) {
            setBankAccounts(userData.bankAccounts);
          }
        }
      } catch (error) {
        console.error("Error checking bank accounts:", error);
        setBankAccounts([]);
      }
    };

    checkBankAccounts();
  }, [user, isOpen]);

  // Reset wizard when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedListings([]);
      setItems([]);
      setShippingCost(0);
      setPaymentMethod('COD');
      setNotes('');
      setCreatedOrderId(null);
      setShowAddBankAccount(false);
      setSelectedItemType(null);
      setBankAccountForm({ accountNumber: '', branch: '', bankName: '', fullName: '' });
      setBankAccountError(null);
    }
  }, [isOpen]);

  // Bank account management functions
  const generateBankAccountId = () => {
    return `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setBankAccountLoading(true);
    setBankAccountError(null);

    try {
      // Get current user data
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      const currentBankAccounts = userData.bankAccounts || [];

      // Create new bank account
      const newAccount: BankAccount = {
        id: generateBankAccountId(),
        accountNumber: bankAccountForm.accountNumber,
        branch: bankAccountForm.branch,
        bankName: bankAccountForm.bankName,
        fullName: bankAccountForm.fullName,
        isDefault: currentBankAccounts.length === 0, // First account is default
        createdAt: new Date(),
      };

      const updatedAccounts = [...currentBankAccounts, newAccount];

      // Update user document
      await updateDoc(userDocRef, {
        bankAccounts: updatedAccounts
      });

      // Update local state
      setBankAccounts(updatedAccounts);

      // Reset form and close add bank account section
      setBankAccountForm({ accountNumber: '', branch: '', bankName: '', fullName: '' });
      setShowAddBankAccount(false);

      // Auto-select bank transfer now that we have an account
      setPaymentMethod('BANK_TRANSFER');

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Bank account added successfully! Bank transfer is now available.';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);

    } catch (err) {
      console.error('Error adding bank account:', err);
      setBankAccountError('Failed to add bank account. Please try again.');
    } finally {
      setBankAccountLoading(false);
    }
  };

  const handlePaymentMethodChange = (method: 'COD' | 'BANK_TRANSFER') => {
    if (method === 'BANK_TRANSFER' && bankAccounts.length === 0) {
      // Show the add bank account form
      setShowAddBankAccount(true);
      return;
    }
    setPaymentMethod(method);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Handle item type selection with side effects
  const handleItemTypeSelect = (itemType: ItemType) => {
    setSelectedItemType(itemType);
    
    // If switching to digital, reset quantity to 1 for all items and clear shipping
    if (itemType === ItemType.DIGITAL) {
      setItems(items.map(item => ({ ...item, quantity: 1 })));
      setShippingCost(0);
      // Also force bank transfer for digital products
      setPaymentMethod('BANK_TRANSFER');
    }
  };

  const updateItem = (id: string, field: keyof CustomOrderItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // For digital products, prevent quantity changes and keep it at 1
        if (selectedItemType === ItemType.DIGITAL && field === 'quantity') {
          return { ...item, quantity: 1 };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Wizard functions
  const handleListingSelect = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const proceedToStep2 = () => {
    setCurrentStep(2);
  };

  const proceedToStep3 = () => {
    // Convert selected listings to items
    const selectedItems = sellerListings
      .filter(listing => selectedListings.includes(listing.id))
      .map((listing) => ({
        id: listing.id, // Use the actual listing ID for better tracking
        name: listing.name,
        description: `From ${listing.shopName}`,
        quantity: selectedItemType === ItemType.DIGITAL ? 1 : 1, // Digital products default to 1
        unitPrice: listing.price,
        imageUrl: listing.imageUrl,
        itemType: selectedItemType || ItemType.PHYSICAL
      }));
    
    setItems(selectedItems);
    
    // Auto-set payment method for digital products
    if (selectedItemType === ItemType.DIGITAL) {
      setPaymentMethod('BANK_TRANSFER');
      setShippingCost(0); // Digital products have no shipping cost
    }
    
    setCurrentStep(3);
  };

  const proceedToStep4 = () => {
    setCurrentStep(4);
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
  };

  const goBackToStep2 = () => {
    setCurrentStep(2);
  };

  const goBackToStep3 = () => {
    setCurrentStep(3);
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return itemsTotal + shippingCost;
  };

  const isFormValid = () => {
    return selectedItemType !== null && // Must have selected an item type
           items.length > 0 && // Must have at least one item
           items.every(item => item.name.trim() && item.unitPrice > 0 && item.quantity > 0) &&
           shippingCost >= 0 &&
           paymentMethod; // Must have selected a payment method
  };

  const handleSubmit = async () => {
    
    if (!user || !isFormValid()) {
      return;
    }

    setLoading(true);
    try {
      // Create the custom order
      const orderId = await createCustomOrder(
        user.uid,
        user.displayName || "Seller",
        buyerId || 'manual-entry',
        buyerName || 'Manual Order',
        conversationId || '',
        items,
        shippingCost,
        paymentMethod,
        selectedItemType || ItemType.PHYSICAL,
        notes.trim() || undefined
      );

      if (source === 'messages' && conversationId && buyerId) {
        // Send message with custom order link (original behavior)
        const orderLink = `${window.location.origin}/custom-order/${orderId}`;
        const messageText = `🛒 Custom Order Created!\n\nI've prepared a special order just for you with ${items.length} item${items.length > 1 ? 's' : ''} totaling LKR ${calculateTotal().toLocaleString()}.\n\nClick the link below to review and checkout:\n${orderLink}`;
        
        await sendMessage(
          conversationId,
          user.uid,
          user.displayName || "Seller",
          messageText,
          buyerId
        );

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Custom order sent successfully! Message delivered to buyer.';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 3000);

        // Close modal
        onClose();
      } else {
        // From dashboard - show step 5 with order link (success page)
        setCreatedOrderId(orderId);
        setCurrentStep(5);
      }
    } catch (error) {
      console.error("❌ Error creating custom order:", error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to create custom order. Please try again.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full ${isMobile ? 'max-w-sm max-h-[90vh]' : 'max-w-2xl max-h-[80vh]'} overflow-hidden flex flex-col border border-gray-200`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiPackage className="w-5 h-5 text-[#72b01d]" />
            <h3 className="text-lg font-semibold text-gray-900">Create Custom Order</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {checkingListings ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Checking your listings...</span>
            </div>
          ) : !hasActiveListings ? (
            <div className="text-center py-8">
              <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Listings</h4>
              <p className="text-gray-600 mb-4">You need at least one active listing to create custom orders.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] transition-colors"
              >
                Add a Listing First
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step < currentStep ? 'bg-[#72b01d] text-white' 
                        : step === currentStep ? 'bg-[#72b01d] text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`w-8 h-0.5 ml-2 transition-colors ${
                          step < currentStep ? 'bg-[#72b01d]' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order for */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Creating custom order for:</p>
                <p className="font-medium text-gray-900">{buyerName}</p>
              </div>

              {/* Step Content */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Step 1: Select Item Type</h4>
                  <p className="text-sm text-gray-600">Choose whether you want to create a custom order for digital or physical products.</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      type="button"
                      onClick={() => handleItemTypeSelect(ItemType.PHYSICAL)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-left ${
                        selectedItemType === ItemType.PHYSICAL
                          ? 'border-[#72b01d] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">📦</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Physical Products</h5>
                          <p className="text-sm text-gray-600">Tangible items that need shipping</p>
                          <p className="text-xs text-gray-500 mt-1">Supports both COD and Bank Transfer</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleItemTypeSelect(ItemType.DIGITAL)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-left ${
                        selectedItemType === ItemType.DIGITAL
                          ? 'border-[#72b01d] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">💾</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Digital Products</h5>
                          <p className="text-sm text-gray-600">Digital files for instant download</p>
                          <p className="text-xs text-gray-500 mt-1">Only Bank Transfer payment method</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Step 2: Select Items</h4>
                  <p className="text-sm text-gray-600">
                    Choose {selectedItemType === ItemType.DIGITAL ? 'digital' : 'physical'} items from your listings to include in this custom order.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {sellerListings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedListings.includes(listing.id)
                            ? 'border-[#72b01d] bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleListingSelect(listing.id)}
                      >
                        <div className="flex items-center gap-3">
                          {listing.imageUrl && (
                            <img 
                              src={listing.imageUrl} 
                              alt={listing.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{listing.name}</h5>
                            <p className="text-sm text-gray-600">{listing.shopName}</p>
                            <p className="text-sm font-medium text-[#72b01d]">LKR {listing.price.toLocaleString()}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedListings.includes(listing.id)
                              ? 'border-[#72b01d] bg-[#72b01d]'
                              : 'border-gray-300'
                          }`}>
                            {selectedListings.includes(listing.id) && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">Step 3: Configure Items</h4>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-sm text-[#72b01d] hover:underline"
                    >
                      Back to selection
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Adjust quantities, prices, or remove items as needed.</p>
                  
                  {/* Items List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FiShoppingCart className="w-5 h-5 text-[#72b01d]" />
                      <h5 className="font-medium text-gray-900">Selected Items ({items.length})</h5>
                    </div>
                    
                    {items.map((item, index) => {
                      return (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Item Image */}
                            <div className="flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <FiPackage className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 space-y-3">
                              {/* Header with remove button */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#72b01d]/10 text-[#72b01d]">
                                    Item {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    Total: LKR {(item.quantity * item.unitPrice).toLocaleString()}
                                  </span>
                                </div>
                                {items.length > 1 && (
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove item"
                                  >
                                    <FiMinus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              
                              {/* Item Form Fields */}
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                  <input
                                    type="text"
                                    placeholder="Item name"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                  <textarea
                                    placeholder="Item description..."
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] resize-none text-sm"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                      disabled={selectedItemType === ItemType.DIGITAL}
                                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] text-sm ${
                                        selectedItemType === ItemType.DIGITAL ? 'bg-gray-100 cursor-not-allowed' : ''
                                      }`}
                                    />
                                    {selectedItemType === ItemType.DIGITAL && (
                                      <p className="text-xs text-gray-500 mt-1">Digital products have fixed quantity of 1</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (LKR)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unitPrice}
                                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Details */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FiEdit3 className="w-5 h-5 text-[#72b01d]" />
                      <h5 className="font-medium text-gray-900">Order Details</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Shipping Cost - disabled for digital products */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiTruck className="w-4 h-4" />
                          Shipping Cost (LKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                          disabled={selectedItemType === ItemType.DIGITAL}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] text-sm ${
                            selectedItemType === ItemType.DIGITAL ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder="0.00"
                        />
                        {selectedItemType === ItemType.DIGITAL && (
                          <p className="text-xs text-gray-500 mt-1">Digital products have no shipping cost</p>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiCreditCard className="w-4 h-4" />
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`flex items-center p-3 border-2 rounded-lg transition-all ${
                            selectedItemType === ItemType.DIGITAL
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                              : paymentMethod === 'COD' 
                                ? 'border-[#72b01d] bg-[#72b01d]/5 cursor-pointer' 
                                : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="COD"
                              checked={paymentMethod === 'COD'}
                              onChange={() => handlePaymentMethodChange('COD')}
                              disabled={selectedItemType === ItemType.DIGITAL}
                              className="mr-3"
                              style={{ accentColor: '#72b01d' }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Cash on Delivery</div>
                              <div className="text-xs text-gray-600">
                                {selectedItemType === ItemType.DIGITAL ? 'Not available for digital products' : 'Pay when received'}
                              </div>
                            </div>
                          </label>
                          <label className={`flex items-center p-3 border-2 rounded-lg transition-all ${
                            bankAccounts.length === 0 
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                              : paymentMethod === 'BANK_TRANSFER' 
                                ? 'border-[#72b01d] bg-[#72b01d]/5 cursor-pointer' 
                                : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="BANK_TRANSFER"
                              checked={paymentMethod === 'BANK_TRANSFER'}
                              onChange={() => handlePaymentMethodChange('BANK_TRANSFER')}
                              disabled={bankAccounts.length === 0}
                              className="mr-3"
                              style={{ accentColor: '#72b01d' }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Bank Transfer</div>
                              <div className="text-xs text-gray-600">
                                {bankAccounts.length === 0 ? 'Requires bank account' : 
                                 selectedItemType === ItemType.DIGITAL ? 'Required for digital products' : 'Pay via bank'}
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        {/* Digital Product Payment Notice */}
                        {selectedItemType === ItemType.DIGITAL && (
                          <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-blue-800">Digital Product Payment</div>
                                <div className="text-xs text-blue-700 mt-1">
                                  Digital products require bank transfer payment for secure delivery and instant download access after payment confirmation.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bank Account Required Message */}
                        {bankAccounts.length === 0 && (
                          <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4" style={{ color: '#72b01d' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="text-sm" style={{ color: '#454955' }}>
                                <div className="font-medium mb-1" style={{ color: '#0d0a0b' }}>Bank account required for bank transfer</div>
                                <div style={{ color: '#454955' }}>
                                  To offer bank transfer as a payment option, you need to add at least one bank account. 
                                  This allows customers to transfer money directly to you.
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowAddBankAccount(true)}
                                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline transition-colors"
                                  style={{ color: '#72b01d' }}
                                >
                                  <FiPlus className="w-4 h-4" />
                                  Add Bank Account
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Inline Add Bank Account Form */}
                      {showAddBankAccount && (
                        <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                          <div className="flex items-center gap-2 mb-4">
                            <FiPlus className="w-5 h-5" style={{ color: '#72b01d' }} />
                            <h4 className="text-lg font-medium" style={{ color: '#0d0a0b' }}>Add Bank Account</h4>
                            <button
                              type="button"
                              onClick={() => setShowAddBankAccount(false)}
                              className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <FiX className="w-4 h-4" style={{ color: '#454955' }} />
                            </button>
                          </div>
                          
                          <form onSubmit={handleAddBankAccount} className="space-y-4">
                            {bankAccountError && (
                              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(211, 47, 47, 0.05)', borderColor: 'rgba(211, 47, 47, 0.2)' }}>
                                <div className="text-sm" style={{ color: '#d32f2f' }}>{bankAccountError}</div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                                  Bank Name *
                                </label>
                                <input
                                  type="text"
                                  value={bankAccountForm.bankName}
                                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                                  placeholder="e.g., Commercial Bank"
                                  required
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-opacity-100 text-sm transition-colors"
                                  style={{ 
                                    borderColor: 'rgba(114, 176, 29, 0.3)',
                                    color: '#0d0a0b'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                                  onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                                  Branch (optional)
                                </label>
                                <input
                                  type="text"
                                  value={bankAccountForm.branch}
                                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, branch: e.target.value })}
                                  placeholder="e.g., Colombo"
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-opacity-100 text-sm transition-colors"
                                  style={{ 
                                    borderColor: 'rgba(114, 176, 29, 0.3)',
                                    color: '#0d0a0b'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                                  onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                                Account Number *
                              </label>
                              <input
                                type="text"
                                value={bankAccountForm.accountNumber}
                                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                                placeholder="Your bank account number"
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-opacity-100 text-sm transition-colors"
                                style={{ 
                                  borderColor: 'rgba(114, 176, 29, 0.3)',
                                  color: '#0d0a0b'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                                Account Holder Full Name *
                              </label>
                              <input
                                type="text"
                                value={bankAccountForm.fullName}
                                onChange={(e) => setBankAccountForm({ ...bankAccountForm, fullName: e.target.value })}
                                placeholder="Full name as per bank records"
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-opacity-100 text-sm transition-colors"
                                style={{ 
                                  borderColor: 'rgba(114, 176, 29, 0.3)',
                                  color: '#0d0a0b'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                              />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={bankAccountLoading || !bankAccountForm.bankName || !bankAccountForm.accountNumber || !bankAccountForm.fullName}
                                className="flex-1 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                style={{ backgroundColor: '#72b01d' }}
                              >
                                {bankAccountLoading ? 'Adding...' : 'Add Bank Account'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddBankAccount(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                style={{ 
                                  borderColor: 'rgba(114, 176, 29, 0.3)',
                                  color: '#454955'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes for Buyer (optional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          placeholder="Any additional notes for the buyer..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] resize-none text-sm"
                          maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {notes.length}/500 characters
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">Step 4: Review & Submit</h4>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-sm text-[#72b01d] hover:underline"
                    >
                      Back to edit
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Review your custom order before sending it to the buyer.</p>
                  
                  {/* Order Summary Card */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8c17] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <FiPackage className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-white">Custom Order Summary</h5>
                          <p className="text-green-100 text-sm">For {buyerName}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Items List */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FiShoppingCart className="w-5 h-5 text-[#72b01d]" />
                        <h6 className="font-medium text-gray-900">Items ({items.length})</h6>
                      </div>
                      
                      {items.map((item) => {
                        return (
                          <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            {/* Item Image */}
                            <div className="flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <FiPackage className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0 pr-2">
                                  <h6 className="font-medium text-gray-900 leading-5 mb-1" 
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word'
                                      }}>
                                    {item.name}
                                  </h6>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-1" 
                                       style={{
                                         display: '-webkit-box',
                                         WebkitLineClamp: 2,
                                         WebkitBoxOrient: 'vertical',
                                         overflow: 'hidden'
                                       }}>
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 flex-wrap">
                                    <span className="whitespace-nowrap">Qty: {item.quantity}</span>
                                    <span>•</span>
                                    <span className="whitespace-nowrap">Unit Price: LKR {item.unitPrice.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right min-w-[120px]">
                                  <p className="font-semibold text-gray-900 whitespace-nowrap">
                                    LKR {(item.quantity * item.unitPrice).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Order Totals */}
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">LKR {items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toLocaleString()}</span>
                        </div>
                        {selectedItemType !== ItemType.DIGITAL && (
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <FiTruck className="w-3 h-3" />
                              Shipping:
                            </span>
                            <span className="font-medium">LKR {shippingCost.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedItemType === ItemType.DIGITAL && (
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Digital Delivery:
                            </span>
                            <span className="font-medium text-green-600">FREE</span>
                          </div>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Total:</span>
                            <span className="text-xl font-bold text-[#72b01d]">
                              LKR {calculateTotal().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Details */}
                    <div className="border-t border-gray-200 px-6 py-4 space-y-3">
                      <h6 className="font-medium text-gray-900 flex items-center gap-2">
                        <FiEdit3 className="w-4 h-4" />
                        Order Details
                      </h6>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Product Type:
                          </span>
                          <span className="font-medium">
                            {selectedItemType === ItemType.DIGITAL ? 'Digital Product' : 'Physical Product'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-gray-600">
                            <FiCreditCard className="w-4 h-4" />
                            Payment Method:
                          </span>
                          <span className="font-medium">
                            {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                          </span>
                        </div>
                        
                        {notes && (
                          <div className="border-t pt-3">
                            <p className="text-gray-600 text-sm mb-2">Notes for buyer:</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Notice */}
                  {source === 'messages' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FiSend className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h6 className="font-medium text-blue-900">Ready to Send</h6>
                          <p className="text-sm text-blue-700 mt-1">
                            Once you submit this custom order, {buyerName} will receive a message with a link to review and checkout this order.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FiSend className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h6 className="font-medium text-green-900">Ready to Create</h6>
                          <p className="text-sm text-green-700 mt-1">
                            Once you create this custom order, you'll get a link that you can share with any buyer through your preferred method.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">Step 5: Custom Order Created!</h4>
                  </div>
                  <p className="text-sm text-gray-600">Your custom order has been created successfully. Copy the link below and share it with your buyer.</p>
                  
                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-green-900 mb-2">Custom Order Created Successfully!</h5>
                        <p className="text-green-700 text-sm mb-4">
                          Your custom order with {items.length} item{items.length > 1 ? 's' : ''} totaling LKR {calculateTotal().toLocaleString()} has been created.
                        </p>
                        
                        {/* Order Link */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-green-900">Custom Order Link:</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={createdOrderId ? `${window.location.origin}/custom-order/${createdOrderId}` : ''}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono"
                              id="orderLinkInput"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById('orderLinkInput') as HTMLInputElement;
                                input.select();
                                document.execCommand('copy');
                                
                                // Show copied feedback
                                const button = event?.target as HTMLButtonElement;
                                const originalText = button.textContent;
                                button.textContent = 'Copied!';
                                button.className = button.className.replace('bg-green-600', 'bg-green-700');
                                
                                setTimeout(() => {
                                  button.textContent = originalText;
                                  button.className = button.className.replace('bg-green-700', 'bg-green-600');
                                }, 2000);
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              Copy Link
                            </button>
                          </div>
                        </div>
                        
                        {/* Instructions */}
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <h6 className="font-medium text-green-900 text-sm mb-2">How to share this order:</h6>
                          <ul className="text-green-700 text-sm space-y-1">
                            <li>• Copy the link above and send it to your buyer via WhatsApp, email, or any messaging app</li>
                            <li>• The buyer can click the link to view and purchase the custom order</li>
                            <li>• You'll receive notifications when the buyer views or purchases the order</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasActiveListings && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              {currentStep === 1 && (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={proceedToStep2}
                    disabled={!selectedItemType}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </>
              )}
              
              {currentStep === 2 && (
                <>
                  <button
                    onClick={goBackToStep1}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={proceedToStep3}
                    disabled={selectedListings.length === 0}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next ({selectedListings.length} selected)
                  </button>
                </>
              )}
              
              {currentStep === 3 && (
                <>
                  <button
                    onClick={goBackToStep2}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={proceedToStep4}
                    disabled={!isFormValid()}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Review Order
                  </button>
                </>
              )}
              
              {currentStep === 4 && (
                <>
                  <button
                    onClick={goBackToStep3}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid()}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiSend className="w-4 h-4" />
                    )}
                    {source === 'messages' ? 'Send Custom Order' : 'Create Custom Order'}
                  </button>
                </>
              )}
              
              {currentStep === 5 && (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
