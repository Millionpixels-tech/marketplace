// src/pages/user/dashboard/MessagesPage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { subscribeToConversations, subscribeToMessages, markMessagesAsRead, sendMessage } from "../../../utils/messaging";
import type { ChatConversation, Message } from "../../../utils/messaging";
import { FiMessageCircle, FiSend, FiUser, FiPackage, FiShoppingBag, FiExternalLink, FiPlus } from "react-icons/fi";
import { useResponsive } from "../../../hooks/useResponsive";
import { Link } from "react-router-dom";
import CreateCustomOrderModal from "../../../components/UI/CreateCustomOrderModal";

function MessagesPageContent() {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("MessagesPage render - conversations:", conversations.length, "messages:", messages.length);

  useEffect(() => {
    if (!user) return;

    // Subscribe to conversations
    try {
      const unsubscribe = subscribeToConversations(user.uid, (convs) => {
        console.log("Conversations updated:", convs.length);
        setConversations(convs);
        setLoading(false);
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && convs.length > 0) {
          setSelectedConversation(convs[0]);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error subscribing to conversations:", error);
      setError("Failed to load conversations");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Subscribe to messages for selected conversation
    try {
      const unsubscribe = subscribeToMessages(selectedConversation.id, (msgs) => {
        console.log("Messages updated:", msgs.length);
        setMessages(msgs);
        
        // Mark messages as read
        if (msgs.length > 0) {
          try {
            markMessagesAsRead(selectedConversation.id, user!.uid);
          } catch (error) {
            console.error("Error marking messages as read:", error);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error subscribing to messages:", error);
      setError("Failed to load messages");
    }
  }, [selectedConversation, user]);

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim() || sendingMessage) return;

    console.log("Sending message:", newMessage.trim());
    setSendingMessage(true);
    setError(null);
    
    try {
      // Get the other participant
      const otherParticipantId = selectedConversation.participants.find(id => id !== user.uid);
      if (!otherParticipantId) {
        throw new Error("No recipient found");
      }

      console.log("Sending to:", otherParticipantId);
      
      await sendMessage(
        selectedConversation.id,
        user.uid,
        user.displayName || "Anonymous User",
        newMessage.trim(),
        otherParticipantId
      );
      
      console.log("Message sent successfully");
      setNewMessage("");
      
      // Dispatch event to update message counts
      window.dispatchEvent(new Event("message-updated"));
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipantName = (conversation: ChatConversation) => {
    const otherParticipantId = conversation.participants.find(id => id !== user?.uid);
    return otherParticipantId ? conversation.participantNames[otherParticipantId] : "Unknown User";
  };

  const getContextIcon = (conversation: ChatConversation) => {
    switch (conversation.contextType) {
      case 'listing':
        return <FiPackage className="w-4 h-4 text-blue-600" />;
      case 'shop':
        return <FiShoppingBag className="w-4 h-4 text-green-600" />;
      case 'user':
        return <FiUser className="w-4 h-4 text-purple-600" />;
      default:
        return <FiMessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Helper function to render message text with clickable links
  const renderMessageWithLinks = (text: string, isOwn: boolean) => {
    if (!text) return text;
    
    try {
      // URL regex pattern
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);
      
      return parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${isOwn ? 'text-green-100 hover:text-white' : 'text-[#72b01d] hover:text-[#5a8c17]'}`}
              onClick={(e) => {
                try {
                  // If it's a custom order link, handle it internally
                  if (part.includes('/custom-order/')) {
                    e.preventDefault();
                    // Use window.open instead of window.location.href to avoid full page reload
                    window.open(part, '_blank');
                  }
                } catch (error) {
                  console.error("Error handling link click:", error);
                }
              }}
            >
              {part.includes('/custom-order/') ? 'View Custom Order →' : part}
            </a>
          );
        }
        return part;
      });
    } catch (error) {
      console.error("Error rendering message links:", error);
      return text;
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) {
      return "Just now";
    }
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Just now";
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiMessageCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading messages</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <FiMessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
        <p className="text-gray-600">Your conversations with buyers and sellers will appear here.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${isMobile ? 'h-[600px]' : 'h-[700px]'}`}>
      <div className="flex h-full">
        {/* Conversations List */}
        <div className={`border-r border-gray-200 ${isMobile ? 'w-full' : 'w-1/3'} ${isMobile && selectedConversation ? 'hidden' : 'block'}`}>
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
          </div>
          <div className="overflow-y-auto h-full">
            {conversations.map((conversation) => {
              const unreadCount = conversation.unreadCount?.[user!.uid] || 0;
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-[#72b01d]/10 border-l-4 border-l-[#72b01d]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#72b01d] flex items-center justify-center text-white font-semibold">
                      {getOtherParticipantName(conversation).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {getOtherParticipantName(conversation)}
                        </h4>
                        {unreadCount > 0 && (
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.contextTitle && (
                        <div className="flex items-center gap-1 mb-1">
                          {getContextIcon(conversation)}
                          <span className="text-xs text-gray-600 truncate">
                            {conversation.contextTitle}
                          </span>
                        </div>
                      )}
                      {conversation.listingDetails && (
                        <Link 
                          to={`/listing/${conversation.listingDetails.id}`}
                          className="flex items-center gap-2 mb-1 p-1 rounded bg-gray-50 hover:bg-gray-100 transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {conversation.listingDetails.image && (
                            <img 
                              src={conversation.listingDetails.image} 
                              alt={conversation.listingDetails.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {conversation.listingDetails.name}
                            </p>
                            <p className="text-xs text-[#72b01d] font-semibold">
                              LKR {conversation.listingDetails.price.toLocaleString()}
                            </p>
                          </div>
                          <FiExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )}
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage || "No messages yet"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation && (
          <div className={`flex flex-col ${isMobile ? 'w-full' : 'w-2/3'}`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    ←
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-[#72b01d] flex items-center justify-center text-white font-semibold">
                  {getOtherParticipantName(selectedConversation).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getOtherParticipantName(selectedConversation)}
                  </h4>
                  {selectedConversation.contextTitle && (
                    <div className="flex items-center gap-1">
                      {getContextIcon(selectedConversation)}
                      <span className="text-xs text-gray-600">
                        {selectedConversation.contextTitle}
                      </span>
                    </div>
                  )}
                  {selectedConversation.listingDetails && (
                    <Link 
                      to={`/listing/${selectedConversation.listingDetails.id}`}
                      className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      {selectedConversation.listingDetails.image && (
                        <img 
                          src={selectedConversation.listingDetails.image} 
                          alt={selectedConversation.listingDetails.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700">
                          {selectedConversation.listingDetails.name}
                        </p>
                        <p className="text-xs text-[#72b01d] font-semibold">
                          LKR {selectedConversation.listingDetails.price.toLocaleString()}
                        </p>
                      </div>
                      <FiExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                // Safety check for message data
                if (!message || !message.id) {
                  return null;
                }
                
                const isOwn = message.senderId === user!.uid;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-[#72b01d] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{renderMessageWithLinks(message.text || '', isOwn)}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                {/* Custom Order Button (Plus) - Only show for sellers */}
                <button
                  onClick={() => setShowCustomOrderModal(true)}
                  className="p-2 text-[#72b01d] hover:bg-[#72b01d]/10 rounded-lg transition-colors"
                  title="Create Custom Order"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d]"
                  maxLength={500}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Order Modal */}
      {selectedConversation && (
        <CreateCustomOrderModal
          isOpen={showCustomOrderModal}
          onClose={() => setShowCustomOrderModal(false)}
          conversationId={selectedConversation.id}
          buyerId={selectedConversation.participants.find(id => id !== user!.uid) || ''}
          buyerName={getOtherParticipantName(selectedConversation)}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  try {
    return <MessagesPageContent />;
  } catch (error) {
    console.error("MessagesPage error:", error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiMessageCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">Unable to load messages</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17]"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
