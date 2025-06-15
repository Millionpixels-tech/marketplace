// src/components/UI/CreateCustomOrderModalWizard.tsx
import { useState, useEffect } from "react";
import { FiX, FiMinus, FiSend, FiPackage, FiEdit3, FiShoppingCart, FiTruck, FiCreditCard } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { createCustomOrder, getSellerActiveListingsCount, getSellerActiveListings } from "../../utils/customOrders";
import { sendMessage } from "../../utils/messaging";
import { useResponsive } from "../../hooks/useResponsive";
import type { CustomOrderItem, SellerListing } from "../../utils/customOrders";

interface CreateCustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  buyerId: string;
  buyerName: string;
}

export default function CreateCustomOrderModal({
  isOpen,
  onClose,
  conversationId,
  buyerId,
  buyerName
}: CreateCustomOrderModalProps) {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasActiveListings, setHasActiveListings] = useState(false);
  const [checkingListings, setCheckingListings] = useState(true);
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  
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
          getSellerActiveListings(user.uid)
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
    }
  }, [isOpen]);

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof CustomOrderItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
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
    // Convert selected listings to items
    const selectedItems = sellerListings
      .filter(listing => selectedListings.includes(listing.id))
      .map((listing) => ({
        id: listing.id, // Use the actual listing ID for better tracking
        name: listing.name,
        description: `From ${listing.shopName}`,
        quantity: 1,
        unitPrice: listing.price,
        imageUrl: listing.imageUrl
      }));
    
    setItems(selectedItems);
    setCurrentStep(2);
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
  };

  const proceedToStep3 = () => {
    setCurrentStep(3);
  };

  const goBackToStep2 = () => {
    setCurrentStep(2);
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return itemsTotal + shippingCost;
  };

  const isFormValid = () => {
    return items.every(item => item.name.trim() && item.unitPrice > 0 && item.quantity > 0) &&
           shippingCost >= 0;
  };

  const handleSubmit = async () => {
    if (!user || !isFormValid()) return;

    setLoading(true);
    try {
      // Create the custom order
      const orderId = await createCustomOrder(
        user.uid,
        user.displayName || "Seller",
        buyerId,
        buyerName,
        conversationId,
        items,
        shippingCost,
        paymentMethod,
        notes.trim() || undefined
      );

      // Send message with custom order link
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
    } catch (error) {
      console.error("Error creating custom order:", error);
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${isMobile ? 'max-w-sm max-h-[90vh]' : 'max-w-2xl max-h-[80vh]'} overflow-hidden flex flex-col`}>
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
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step < currentStep ? 'bg-[#72b01d] text-white' 
                        : step === currentStep ? 'bg-[#72b01d] text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 3 && (
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
                  <h4 className="text-lg font-medium text-gray-900">Step 1: Select Items</h4>
                  <p className="text-sm text-gray-600">Choose items from your listings to include in this custom order.</p>
                  
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

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">Step 2: Configure Items</h4>
                    <button
                      onClick={goBackToStep1}
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
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] text-sm"
                                    />
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
                      {/* Shipping Cost */}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] text-sm"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiCreditCard className="w-4 h-4" />
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            paymentMethod === 'COD' 
                              ? 'border-[#72b01d] bg-[#72b01d]/5' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="COD"
                              checked={paymentMethod === 'COD'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                              className="mr-3"
                              style={{ accentColor: '#72b01d' }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Cash on Delivery</div>
                              <div className="text-xs text-gray-600">Pay when received</div>
                            </div>
                          </label>
                          <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            paymentMethod === 'BANK_TRANSFER' 
                              ? 'border-[#72b01d] bg-[#72b01d]/5' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="BANK_TRANSFER"
                              checked={paymentMethod === 'BANK_TRANSFER'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'BANK_TRANSFER')}
                              className="mr-3"
                              style={{ accentColor: '#72b01d' }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Bank Transfer</div>
                              <div className="text-xs text-gray-600">Pay via bank</div>
                            </div>
                          </label>
                        </div>
                      </div>

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

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">Step 3: Review & Submit</h4>
                    <button
                      onClick={goBackToStep2}
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
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <FiTruck className="w-3 h-3" />
                            Shipping:
                          </span>
                          <span className="font-medium">LKR {shippingCost.toLocaleString()}</span>
                        </div>
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
                    disabled={selectedListings.length === 0}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next ({selectedListings.length} selected)
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
                    disabled={!isFormValid()}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Review Order
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
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid()}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiSend className="w-4 h-4" />
                    )}
                    Send Custom Order
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
