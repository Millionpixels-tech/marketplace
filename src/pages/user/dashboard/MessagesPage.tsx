// src/pages/user/dashboard/MessagesPage.tsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { subscribeToMessages, markMessagesAsRead, sendMessage, getConversationsPaginated, getRecentMessages, getMessagesPaginated } from "../../../utils/messaging";
import type { ChatConversation, Message } from "../../../utils/messaging";
import { FiMessageCircle, FiSend, FiUser, FiPackage, FiShoppingBag, FiPlus } from "react-icons/fi";
import { useResponsive } from "../../../hooks/useResponsive";
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

  // Pagination state
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const CONVERSATIONS_PER_PAGE = 10;

  // Message pagination state
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesLastDoc, setMessagesLastDoc] = useState<any>(null);
  const [realtimeUnsubscribe, setRealtimeUnsubscribe] = useState<(() => void) | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const MESSAGES_PER_PAGE = 10;
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  //console.log("MessagesPage render - conversations:", conversations.length, "messages:", messages.length);

  // Handle conversation selection and mark messages as read
  const handleConversationSelect = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    
    // Immediately update the unread count to 0 for this conversation in the local state
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unreadCount: { ...conv.unreadCount, [user!.uid]: 0 } }
        : conv
    ));
    
    // Mark messages as read in the database
    try {
      await markMessagesAsRead(conversation.id, user!.uid);
      // Dispatch event to update global unread count
      window.dispatchEvent(new Event("message-updated"));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Load initial conversations
  const loadConversations = async (isLoadMore = false) => {
    if (!user) return;
    
    try {
      if (!isLoadMore) {
        setLoading(true);
        setConversations([]);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }

      const result = await getConversationsPaginated(
        user.uid, 
        CONVERSATIONS_PER_PAGE, 
        isLoadMore ? lastDoc : null
      );

      if (isLoadMore) {
        setConversations(prev => [...prev, ...result.conversations]);
      } else {
        setConversations(result.conversations);
        // Auto-select first conversation if none selected
        if (!selectedConversation && result.conversations.length > 0) {
          handleConversationSelect(result.conversations[0]);
        }
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more conversations when scrolling
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadConversations(true);
    }
  };

  // Scroll event handler for conversations list
  const handleConversationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Load more when user scrolls to 80% of the list
    if (scrollPercentage > 0.8 && hasMore && !loadingMore) {
      handleLoadMore();
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  // Auto-scroll to bottom for new messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    } else if (messagesContainerRef.current) {
      // Fallback: scroll the container to the bottom
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Load recent messages for selected conversation
  const loadRecentMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      setMessages([]);
      setMessagesLastDoc(null);
      setHasMoreMessages(true);
      setShouldScrollToBottom(true); // Flag to scroll after loading

      const result = await getRecentMessages(conversationId, MESSAGES_PER_PAGE);
      setMessages(result.messages);
      setMessagesLastDoc(result.lastDoc);
      
      // Check if there are more messages by trying to load one more batch
      if (result.messages.length < MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      }

      // Mark messages as read
      if (result.messages.length > 0) {
        try {
          markMessagesAsRead(conversationId, user!.uid);
          // Dispatch event to update global unread count
          window.dispatchEvent(new Event("message-updated"));
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }

      setMessagesLoading(false);
      
      // Scroll to bottom after loading recent messages - use immediate scroll
      setTimeout(() => scrollToBottom(false), 50);
      // Then smooth scroll after content is rendered
      setTimeout(() => scrollToBottom(true), 200);
    } catch (error) {
      console.error("Error loading recent messages:", error);
      setError("Failed to load messages");
      setMessagesLoading(false);
    }
  };

  // Load older messages (when scrolling up)
  const loadOlderMessages = async () => {
    if (!selectedConversation || !hasMoreMessages || loadingOlderMessages) return;

    try {
      setLoadingOlderMessages(true);
      
      const result = await getMessagesPaginated(
        selectedConversation.id,
        MESSAGES_PER_PAGE,
        messagesLastDoc
      );

      if (result.messages.length > 0) {
        setMessages(prev => [...result.messages, ...prev]);
        setMessagesLastDoc(result.lastDoc);
      }
      
      setHasMoreMessages(result.hasMore);
      setLoadingOlderMessages(false);
    } catch (error) {
      console.error("Error loading older messages:", error);
      setLoadingOlderMessages(false);
    }
  };

  // Handle scroll in messages area
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    
    // Load older messages when user scrolls near the top
    if (scrollTop < 100 && hasMoreMessages && !loadingOlderMessages) {
      loadOlderMessages();
    }
  };

  useEffect(() => {
    // Cleanup previous realtime subscription
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
      setRealtimeUnsubscribe(null);
    }

    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Load initial messages
    loadRecentMessages(selectedConversation.id);

    // Set up realtime subscription for new messages only
    try {
      const unsubscribe = subscribeToMessages(selectedConversation.id, (msgs) => {
        // Only update if we get new messages (more than current)
        if (msgs.length > messages.length) {
          const newMessages = msgs.slice(messages.length);
          setMessages(prev => [...prev, ...newMessages]);
          
          // Mark new messages as read
          if (newMessages.length > 0) {
            try {
              markMessagesAsRead(selectedConversation.id, user!.uid);
              // Dispatch event to update global unread count
              window.dispatchEvent(new Event("message-updated"));
            } catch (error) {
              console.error("Error marking messages as read:", error);
            }
          }
          
          // Scroll to bottom for new messages
          setShouldScrollToBottom(true);
          setTimeout(() => scrollToBottom(true), 100);
        }
      });

      setRealtimeUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error("Error subscribing to new messages:", error);
      setError("Failed to subscribe to messages");
    }
  }, [selectedConversation, user]);

  // Ensure scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation && messages.length > 0 && !messagesLoading && shouldScrollToBottom) {
      const timer = setTimeout(() => {
        scrollToBottom(false);
        setShouldScrollToBottom(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation?.id, messages.length > 0 && !messagesLoading, shouldScrollToBottom]);

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim() || sendingMessage) return;

    //console.log("Sending message:", newMessage.trim());
    setSendingMessage(true);
    setError(null);
    
    try {
      // Get the other participant
      const otherParticipantId = selectedConversation.participants.find(id => id !== user.uid);
      if (!otherParticipantId) {
        throw new Error("No recipient found");
      }

     // console.log("Sending to:", otherParticipantId);
      
      await sendMessage(
        selectedConversation.id,
        user.uid,
        user.displayName || "Anonymous User",
        newMessage.trim(),
        otherParticipantId
      );
      
      //console.log("Message sent successfully");
      setNewMessage("");
      
      // Scroll to bottom after sending message
      setShouldScrollToBottom(true);
      setTimeout(() => scrollToBottom(true), 100);
      
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
          <div className="overflow-y-auto h-full" onScroll={handleConversationsScroll}>
            {conversations.map((conversation) => {
              const unreadCount = conversation.unreadCount?.[user!.uid] || 0;
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
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
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading more conversations...</p>
              </div>
            )}
            
            {/* End of conversations indicator */}
            {!hasMore && conversations.length > 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No more conversations</p>
              </div>
            )}
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
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4" 
              onScroll={handleMessagesScroll}
            >
              {/* Loading initial messages */}
              {messagesLoading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading messages...</p>
                  </div>
                </div>
              )}
              
              {/* Loading older messages indicator */}
              {loadingOlderMessages && (
                <div className="text-center py-2">
                  <div className="w-4 h-4 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-xs text-gray-600">Loading older messages...</p>
                </div>
              )}
              
              {/* End of messages indicator */}
              {!hasMoreMessages && messages.length > MESSAGES_PER_PAGE && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">Beginning of conversation</p>
                </div>
              )}
              
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
              
              {/* Invisible element for auto-scrolling to bottom */}
              <div ref={messagesEndRef} />
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
