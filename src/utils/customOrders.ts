// src/utils/customOrders.ts
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { createCustomOrderNotification } from "./notifications";
import { ItemType } from "./categories";

export interface CustomOrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  itemType?: ItemType;
}

export interface CustomOrder {
  id: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  conversationId: string;
  items: CustomOrderItem[];
  totalAmount: number;
  shippingCost: number;
  grandTotal: number;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  status: 'PENDING' | 'ACCEPTED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  validUntil: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  itemType?: ItemType; // Digital or Physical
  // Order processing details
  buyerAddress?: string;
  buyerPhone?: string;
  trackingNumber?: string;
}

export interface SellerListing {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  shopName: string;
  itemType?: ItemType;
}

// Create a custom order
export async function createCustomOrder(
  sellerId: string,
  sellerName: string,
  buyerId: string,
  buyerName: string,
  conversationId: string,
  items: CustomOrderItem[],
  shippingCost: number,
  paymentMethod: 'COD' | 'BANK_TRANSFER',
  itemType: ItemType, // New parameter to specify if this is for digital or physical items
  notes?: string
): Promise<string> {
  const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const grandTotal = totalAmount + shippingCost;
  
  // Valid for 7 days
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);
  
  const customOrder: Omit<CustomOrder, 'id'> = {
    sellerId,
    sellerName,
    buyerId,
    buyerName,
    conversationId,
    items,
    totalAmount,
    shippingCost,
    grandTotal,
    paymentMethod,
    status: 'PENDING',
    itemType, // Store the item type
    validUntil: Timestamp.fromDate(validUntil),
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    ...(notes && notes.trim() && { notes: notes.trim() }) // Only include notes if it has content
  };
  
  const docRef = await addDoc(collection(db, "customOrders"), customOrder);
  
  // Create notification for seller about new custom order request
  try {
    const itemsDescription = items.map(item => item.name).join(', ');
    await createCustomOrderNotification(
      sellerId,
      'custom_order_request',
      buyerName,
      itemsDescription
    );
    //console.log('📨 Custom order notification sent to seller');
  } catch (notificationError) {
    console.error('❌ Failed to create custom order notification:', notificationError);
  }
  
  return docRef.id;
}

// Get custom order by ID
export async function getCustomOrder(orderId: string): Promise<CustomOrder | null> {
  try {
    const docRef = doc(db, "customOrders", orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CustomOrder;
    }
    return null;
  } catch (error) {
    console.error("Error fetching custom order:", error);
    return null;
  }
}

// Update custom order status
export async function updateCustomOrderStatus(
  orderId: string,
  status: CustomOrder['status'],
  additionalData?: Partial<CustomOrder>
): Promise<void> {
  const docRef = doc(db, "customOrders", orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
    ...additionalData
  });
}

// Accept custom order (buyer)
export async function acceptCustomOrder(
  orderId: string,
  buyerAddress: string,
  buyerPhone: string
): Promise<void> {
  // First get the custom order details for notifications
  const customOrder = await getCustomOrder(orderId);
  
  await updateCustomOrderStatus(orderId, 'ACCEPTED', {
    buyerAddress,
    buyerPhone
  });
  
  // Create notification for seller about accepted custom order
  if (customOrder) {
    try {
      const itemsDescription = customOrder.items.map(item => item.name).join(', ');
      await createCustomOrderNotification(
        customOrder.sellerId,
        'custom_order_accepted',
        customOrder.buyerName,
        itemsDescription
      );
      //console.log('📨 Custom order acceptance notification sent to seller');
    } catch (notificationError) {
      console.error('❌ Failed to create custom order acceptance notification:', notificationError);
    }
  }
}

// Mark custom order as paid
export async function markCustomOrderPaid(orderId: string): Promise<void> {
  await updateCustomOrderStatus(orderId, 'PAID');
}

// Update buyer ID for custom order (when a different user accepts the order)
export async function updateCustomOrderBuyer(
  orderId: string, 
  newBuyerId: string,
  buyerName: string
): Promise<void> {
  await updateCustomOrderStatus(orderId, 'PENDING', {
    buyerId: newBuyerId,
    buyerName: buyerName
  });
}

// Get seller's active listings count
export async function getSellerActiveListingsCount(sellerId: string): Promise<number> {
  try {
    const listingsRef = collection(db, "listings");
    const q = query(
      listingsRef,
      where("owner", "==", sellerId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting active listings count:", error);
    return 0;
  }
}

// Get seller's active listings for reference in custom order modal
export async function getSellerActiveListings(sellerId: string, itemType?: ItemType): Promise<SellerListing[]> {
  try {
    const listingsRef = collection(db, "listings");
    let q = query(
      listingsRef,
      where("owner", "==", sellerId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    // Get shop names for display
    const shopIds = [...new Set(snapshot.docs.map(doc => doc.data().shopId))];
    let shopNames: Record<string, string> = {};
    
    if (shopIds.length > 0) {
      const shopsQuery = query(
        collection(db, "shops"),
        where("__name__", "in", shopIds)
      );
      const shopsSnapshot = await getDocs(shopsQuery);
      shopNames = shopsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data().name;
        return acc;
      }, {} as Record<string, string>);
    }
    
    let listings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        price: data.price,
        imageUrl: data.images?.[0],
        quantity: data.quantity || 0,
        shopName: shopNames[data.shopId] || 'Unknown Shop',
        itemType: data.itemType || ItemType.PHYSICAL
      };
    });

    // Filter by itemType if specified
    if (itemType) {
      listings = listings.filter(listing => listing.itemType === itemType);
    }
    
    return listings;
  } catch (error) {
    console.error("Error getting seller listings:", error);
    return [];
  }
}

// Get custom orders for a user (buyer or seller)
export async function getCustomOrdersForUser(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<CustomOrder[]> {
  try {
    const customOrdersRef = collection(db, "customOrders");
    const field = role === 'buyer' ? 'buyerId' : 'sellerId';
    const q = query(
      customOrdersRef,
      where(field, "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    const orders: CustomOrder[] = [];
    
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() } as CustomOrder);
    });
    
    return orders;
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    return [];
  }
}

// Check if custom order is expired
export function isCustomOrderExpired(order: CustomOrder): boolean {
  const now = new Date();
  const validUntil = order.validUntil.toDate();
  return now > validUntil;
}

// Generate custom order link
export function generateCustomOrderLink(orderId: string): string {
  return `${window.location.origin}/custom-order/${orderId}`;
}
