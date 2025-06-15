// src/components/UI/ContactSellerButton.tsx
import { useState, useEffect } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateConversation, sendMessage } from "../../utils/messaging";
import { useResponsive } from "../../hooks/useResponsive";

interface ContactSellerButtonProps {
  sellerId: string;
  sellerName: string;
  context?: {
    type: 'listing' | 'shop' | 'user';
    id: string;
    title: string;
    listingDetails?: {
      id: string;
      name: string;
      price: number;
      image?: string;
      shopName?: string;
    };
  };
  buttonText?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export default function ContactSellerButton({
  sellerId,
  sellerName,
  context,
  buttonText = "Contact Seller",
  buttonStyle = 'outline',
  size = 'md'
}: ContactSellerButtonProps) {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Set default message for listing context
  useEffect(() => {
    if (context?.type === 'listing' && context.listingDetails) {
      setMessage(`Hi! I'm interested in "${context.listingDetails.name}". Could you please provide more details?`);
    }
  }, [context]);

  const handleSendMessage = async () => {
    if (!user || !message.trim() || sending) return;
    
    setSending(true);
    try {
      const conversationId = await getOrCreateConversation(
        user.uid,
        sellerId,
        user.displayName || "Anonymous User",
        sellerName,
        context
      );
      
      await sendMessage(
        conversationId,
        user.uid,
        user.displayName || "Anonymous User",
        message.trim(),
        sellerId
      );
      
      setMessage("");
      setShowModal(false);
      
      // Dispatch event to update message counts
      window.dispatchEvent(new Event("message-updated"));
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Message sent successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to send message. Please try again.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 3000);
    } finally {
      setSending(false);
    }
  };

  if (!user || user.uid === sellerId) {
    return null; // Don't show button for non-logged-in users or seller viewing their own content
  }

  const getButtonClasses = () => {
    const baseClasses = "flex items-center gap-2 font-medium rounded-lg transition-colors";
    
    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base"
    };
    
    const styleClasses = {
      primary: "bg-[#72b01d] text-white hover:bg-[#5a8c17] border-2 border-[#72b01d]",
      secondary: "bg-gray-600 text-white hover:bg-gray-700 border-2 border-gray-600",
      outline: "bg-white text-[#72b01d] hover:bg-[#72b01d] hover:text-white border-2 border-[#72b01d]"
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${styleClasses[buttonStyle]}`;
  };

  return (
    <>
      <button
        onClick={() => {
          setShowModal(true);
          // Reset message with default template when opening modal
          if (context?.type === 'listing' && context.listingDetails) {
            setMessage(`Hi! I'm interested in "${context.listingDetails.name}". Could you please provide more details?`);
          } else {
            setMessage("");
          }
        }}
        className={getButtonClasses()}
      >
        <FiMessageCircle className="w-4 h-4" />
        {buttonText}
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} max-h-[90vh] overflow-hidden border border-gray-200`}
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200`}>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contact Seller</h3>
                <p className="text-sm text-gray-600">{sellerName}</p>
                {context && (
                  <p className="text-xs text-gray-500 mt-1">
                    Re: {context.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Product Preview (for listing context) */}
            {context?.type === 'listing' && context.listingDetails && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {context.listingDetails.image && (
                    <img 
                      src={context.listingDetails.image} 
                      alt={context.listingDetails.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {context.listingDetails.name}
                    </h4>
                    <p className="text-sm text-[#72b01d] font-semibold">
                      LKR {context.listingDetails.price.toLocaleString()}
                    </p>
                    {context.listingDetails.shopName && (
                      <p className="text-xs text-gray-500">
                        from {context.listingDetails.shopName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {message.length}/500
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#72b01d] text-white hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
