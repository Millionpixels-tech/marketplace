import { db } from "./firebase";
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

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
    sellerId: string;
    sellerShopId: string;
    sellerShopName: string;
    price: number;
    quantity: number;
    shipping: number;
    total: number;
    paymentMethod?: 'cod' | 'paynow';
    paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled';
    orderId?: string; // PayHere order ID
    createdAt: any;
}

export async function createOrder(order: Omit<Order, "createdAt">) {
    const docRef = await addDoc(collection(db, "orders"), {
        ...order,
        status: "PENDING", // Set default status
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

// Update order payment status
export async function updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: 'completed' | 'failed' | 'cancelled'
): Promise<void> {
    try {
        // Find the order by orderId field (PayHere order ID)
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("orderId", "==", orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, "orders", orderDoc.id), {
                paymentStatus: paymentStatus,
                updatedAt: Timestamp.now()
            });
            console.log(`Order ${orderId} status updated to ${paymentStatus}`);
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
