// src/components/UI/MobileNotificationDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiPackage, FiMessageSquare, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../../hooks/useNotifications';
import { type Notification } from '../../utils/notifications';

interface MobileNotificationDropdownProps {
  className?: string;
}

const MobileNotificationDropdown = ({ className = '' }: MobileNotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format time ago
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
      case 'new_order':
      case 'order_status_change':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_cancelled':
        return <FiPackage className="w-3 h-3" />;
      case 'message':
      case 'new_message':
        return <FiMessageSquare className="w-3 h-3" />;
      case 'payment':
      case 'payment_received':
      case 'payment_released':
        return <FiDollarSign className="w-3 h-3" />;
      default:
        return <FiAlertCircle className="w-3 h-3" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
      case 'new_order':
      case 'order_status_change':
      case 'order_shipped':
      case 'order_delivered':
        return 'text-green-600 bg-green-100';
      case 'order_cancelled':
        return 'text-red-600 bg-red-100';
      case 'message':
      case 'new_message':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
      case 'payment_received':
      case 'payment_released':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // Don't navigate - notifications are just informational
  };

  // Truncate long messages for mobile
  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <FiBell size={16} className="sm:hidden" style={{ color: '#72b01d' }} />
        <FiBell size={18} className="hidden sm:block" style={{ color: '#72b01d' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 top-10 sm:top-12 w-72 max-w-xs rounded-lg shadow-lg z-50 border bg-white"
          style={{
            // Ensure it doesn't go off-screen on very small devices
            transform: window.innerWidth < 300 ? 'translateX(-20px)' : 'none',
            maxHeight: '80vh'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium px-2 py-1 rounded transition-colors"
                  style={{ color: '#72b01d' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
                aria-label="Close"
              >
                <FiX size={14} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto"></div>
                <span className="text-xs text-gray-600 mt-2 block">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <FiBell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-xs">No notifications yet</p>
                <p className="text-gray-500 text-xs mt-1">You'll see important updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Icon */}
                      <div className={`p-1.5 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full ml-1 flex-shrink-0"></span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                          {truncateMessage(notification.message)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Showing {notifications.length} most recent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileNotificationDropdown;
