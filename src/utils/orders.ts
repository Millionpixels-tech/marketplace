import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

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
