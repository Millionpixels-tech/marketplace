// src/utils/testNotifications.ts
import { 
  createOrderNotification, 
  createMessageNotification, 
  createListingNotification,
  createPaymentNotification,
  createCustomOrderNotification 
} from './notifications';

/**
 * Create test notifications for development/testing
 */
export async function createTestNotifications(userId: string) {
  try {
   // console.log('🧪 Creating test notifications...');
    
    // Test order notification
    await createOrderNotification(
      userId,
      'new_order',
      'test-order-123',
      {
        buyerName: 'John Smith',
        itemName: 'Handcrafted Tea Set',
        amount: 2500
      }
    );
    
    // Test message notification
    await createMessageNotification(
      userId,
      'Sarah Wilson',
      'test-conversation-456'
    );
    
    // Test listing notification
    await createListingNotification(
      userId,
      'listing_approved',
      'Beautiful Ceramic Vase',
      'test-listing-789'
    );
    
    // Test payment notification
    await createPaymentNotification(
      userId,
      'payment_received',
      1850,
      'test-order-321'
    );
    
    // Test custom order notification
    await createCustomOrderNotification(
      userId,
      'custom_order_request',
      'Mike Johnson',
      'Custom wooden furniture piece for living room'
    );
    
   // console.log('✅ Test notifications created successfully!');
  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}
