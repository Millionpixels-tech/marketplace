// src/utils/notifications.ts
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  serverTimestamp, 
  Timestamp,
  limit,
  writeBatch
} from "firebase/firestore";

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'message' | 'listing' | 'shop' | 'system' | 'payment';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  // Optional context data
  orderId?: string;
  listingId?: string;
  shopId?: string;
  buyerId?: string;
  sellerId?: string;
  data?: Record<string, any>;
}

export type NotificationType = 
  | 'new_order'
  | 'order_status_change'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_released'
  | 'new_message'
  | 'listing_approved'
  | 'listing_rejected'
  | 'shop_approved'
  | 'shop_suspended'
  | 'stock_low'
  | 'custom_order_request'
  | 'custom_order_accepted'
  | 'custom_order_declined';

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  context?: {
    orderId?: string;
    listingId?: string;
    shopId?: string;
    buyerId?: string;
    sellerId?: string;
    data?: Record<string, any>;
  }
): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      ...context
    });
    
    // Trigger UI update
    triggerNotificationUpdate();
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user (optimized query)
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 20
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for a user (optimized)
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    // Use batch for better performance
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Helper functions to create specific types of notifications
 */

// Order notifications
export async function createOrderNotification(
  userId: string,
  type: 'new_order' | 'order_status_change' | 'order_shipped' | 'order_delivered' | 'order_cancelled',
  orderId: string,
  orderDetails: { buyerName?: string; sellerName?: string; itemName?: string; amount?: number }
) {
  const titles = {
    new_order: 'New Order Received',
    order_status_change: 'Order Status Updated',
    order_shipped: 'Order Shipped',
    order_delivered: 'Order Delivered',
    order_cancelled: 'Order Cancelled'
  };

  const messages = {
    new_order: `You have a new order from ${orderDetails.buyerName} for ${orderDetails.itemName}`,
    order_status_change: `Your order status for ${orderDetails.itemName} has been updated`,
    order_shipped: `Your order for ${orderDetails.itemName} has been shipped`,
    order_delivered: `Your order for ${orderDetails.itemName} has been delivered`,
    order_cancelled: `Order for ${orderDetails.itemName} has been cancelled`
  };

  return createNotification(
    userId,
    type,
    titles[type],
    messages[type],
    { orderId, data: orderDetails }
  );
}

// Message notifications
export async function createMessageNotification(
  userId: string,
  senderName: string,
  conversationId: string
) {
  return createNotification(
    userId,
    'new_message',
    'New Message',
    `You have a new message from ${senderName}`,
    { data: { conversationId, senderName } }
  );
}

// Listing notifications
export async function createListingNotification(
  userId: string,
  type: 'listing_approved' | 'listing_rejected' | 'stock_low',
  listingName: string,
  listingId?: string
) {
  const titles = {
    listing_approved: 'Listing Approved',
    listing_rejected: 'Listing Rejected',
    stock_low: 'Low Stock Alert'
  };

  const messages = {
    listing_approved: `Your listing "${listingName}" has been approved and is now live`,
    listing_rejected: `Your listing "${listingName}" was rejected. Please review and resubmit`,
    stock_low: `Stock is running low for "${listingName}". Consider restocking`
  };

  return createNotification(
    userId,
    type,
    titles[type],
    messages[type],
    { listingId, data: { listingName } }
  );
}

// Payment notifications
export async function createPaymentNotification(
  userId: string,
  type: 'payment_received' | 'payment_released',
  amount: number,
  orderId: string
) {
  const titles = {
    payment_received: 'Payment Received',
    payment_released: 'Payment Released'
  };

  const messages = {
    payment_received: `You received a payment of Rs. ${amount.toLocaleString()}`,
    payment_released: `Payment of Rs. ${amount.toLocaleString()} has been released to the seller`
  };

  return createNotification(
    userId,
    type,
    titles[type],
    messages[type],
    { orderId, data: { amount } }
  );
}

// Custom order notifications
export async function createCustomOrderNotification(
  userId: string,
  type: 'custom_order_request' | 'custom_order_accepted' | 'custom_order_declined',
  customerName: string,
  details: string
) {
  const titles = {
    custom_order_request: 'Custom Order Request',
    custom_order_accepted: 'Custom Order Accepted',
    custom_order_declined: 'Custom Order Declined'
  };

  const messages = {
    custom_order_request: `${customerName} has requested a custom order: ${details}`,
    custom_order_accepted: `Your custom order request has been accepted`,
    custom_order_declined: `Your custom order request has been declined`
  };

  return createNotification(
    userId,
    type,
    titles[type],
    messages[type],
    { data: { customerName, details } }
  );
}

/**
 * Helper function to trigger notification UI updates
 */
export function triggerNotificationUpdate() {
  // Dispatch custom event to update notification UI components
  const event = new CustomEvent('notification-updated');
  window.dispatchEvent(event);
}
