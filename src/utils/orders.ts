import { db } from "./firebase";
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../types/enums";
import type { OrderStatus as OrderStatusType } from "../types/enums";
import { sendOrderConfirmationEmails } from "./emailServiceFrontend";

export interface BuyerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
}

export interface Order {
    itemId?: string;
    itemName: string;
    itemImage: string;
    buyerId: string | null;
    buyerEmail: string | null;
    buyerInfo?: BuyerInfo;
    buyerNotes?: string;
    sellerId: string;
    sellerShopId: string;
    sellerShopName: string;
    price: number;
    quantity: number;
    shipping: number;
    total: number;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    status?: OrderStatusType;
    orderId?: string; // PayHere order ID
    createdAt: any;
}

// Helper function to get seller email from users collection
async function getSellerEmail(sellerId: string): Promise<string | null> {
    try {
        const userDoc = await getDoc(doc(db, "users", sellerId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.email || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching seller email:", error);
        return null;
    }
}

export async function createOrder(order: Omit<Order, "createdAt">) {
    const docRef = await addDoc(collection(db, "orders"), {
        ...order,
        status: OrderStatus.PENDING, // Set default status using enum
        createdAt: Timestamp.now(),
    });
    
    // Send order confirmation emails only for COD orders
    // For Pay Now orders, emails will be sent after payment completion
    if (order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
        console.log("� COD order - sending emails immediately");
        await sendOrderConfirmationEmailsHelper(order, docRef.id);
    } else {
        console.log("💳 Pay Now order - emails will be sent after payment completion");
    }
    
    return docRef.id;
}

// Helper function to send order confirmation emails
async function sendOrderConfirmationEmailsHelper(order: Omit<Order, "createdAt">, orderId: string) {
    try {
        console.log("�🔄 Starting email notification process for order:", orderId);
        console.log("Order data:", {
            buyerId: order.buyerId,
            buyerEmail: order.buyerEmail,
            sellerId: order.sellerId,
            itemName: order.itemName,
            total: order.total
        });
        
        const sellerEmail = await getSellerEmail(order.sellerId);
        console.log("📧 Seller email retrieved:", sellerEmail);
        
        if (sellerEmail) {
            const orderWithId = { 
                ...order, 
                id: orderId,
                createdAt: Timestamp.now()
            };
            
            console.log("📤 Calling sendOrderConfirmationEmails...");
            const emailResult = await sendOrderConfirmationEmails(orderWithId, sellerEmail);
            console.log("📧 Email result:", emailResult);
            
            if (emailResult.success) {
                console.log("✅ Order confirmation emails sent successfully");
            } else {
                console.warn("⚠️ Failed to send order confirmation emails:", emailResult.error);
            }
        } else {
            console.warn("❌ Could not find seller email, skipping email notifications");
        }
    } catch (error) {
        console.error("❌ Error sending order confirmation emails:", error);
        // Don't throw error here - order creation should still succeed even if emails fail
    }
}

// Update order payment status
export async function updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: PaymentStatus
): Promise<void> {
    try {
        // Find the order by orderId field (PayHere order ID)
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("orderId", "==", orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            const orderData = orderDoc.data() as Order;
            
            await updateDoc(doc(db, "orders", orderDoc.id), {
                paymentStatus: paymentStatus,
                updatedAt: Timestamp.now()
            });
            console.log(`💳 Order ${orderId} status updated to ${paymentStatus}`);
            
            // Send emails when payment is completed for Pay Now orders
            if (paymentStatus === PaymentStatus.COMPLETED && orderData.paymentMethod === PaymentMethod.PAY_NOW) {
                console.log("💳 Payment completed - sending order confirmation emails");
                await sendOrderConfirmationEmailsHelper(orderData, orderDoc.id);
            }
        } else {
            console.error(`Order with ID ${orderId} not found`);
        }
    } catch (error) {
        console.error("Error updating order payment status:", error);
        throw error;
    }
}

// Get order by PayHere order ID
export async function getOrderByPayHereId(orderId: string): Promise<any | null> {
    try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("orderId", "==", orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            return { id: orderDoc.id, ...orderDoc.data() };
        }
        
        return null;
    } catch (error) {
        console.error("Error getting order by PayHere ID:", error);
        return null;
    }
}

// Delete order by PayHere order ID
export async function deleteOrderByPayHereId(orderId: string): Promise<boolean> {
    try {
        // Find the order by orderId field (PayHere order ID)
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("orderId", "==", orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            await deleteDoc(doc(db, "orders", orderDoc.id));
            console.log(`Order ${orderId} deleted from database`);
            return true;
        } else {
            console.error(`Order with ID ${orderId} not found for deletion`);
            return false;
        }
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
}

// Delete order by database document ID
export async function deleteOrderById(docId: string): Promise<boolean> {
    try {
        await deleteDoc(doc(db, "orders", docId));
        console.log(`Order document ${docId} deleted from database`);
        return true;
    } catch (error) {
        console.error("Error deleting order by document ID:", error);
        throw error;
    }
}

// Get seller email by user ID
export async function getSellerEmailById(sellerId: string): Promise<string | null> {
    try {
        const sellerDoc = await getDoc(doc(db, "users", sellerId));
        if (sellerDoc.exists()) {
            const sellerData = sellerDoc.data();
            return sellerData?.email || null;
        }
        return null;
    } catch (error) {
        console.error("Error getting seller email:", error);
        return null;
    }
}
