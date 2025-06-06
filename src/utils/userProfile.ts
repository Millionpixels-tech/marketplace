import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface BuyerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    buyerInfo?: BuyerInfo;
    createdAt?: any;
    updatedAt?: any;
}

// Save or update buyer information in user profile
export async function saveBuyerInfo(userId: string, buyerInfo: BuyerInfo): Promise<void> {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            // Update existing user profile with buyer info
            await updateDoc(userRef, {
                buyerInfo: buyerInfo,
                updatedAt: new Date()
            });
        } else {
            // Create new user profile with buyer info
            await setDoc(userRef, {
                uid: userId,
                email: buyerInfo.email,
                buyerInfo: buyerInfo,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    } catch (error) {
        console.error("Error saving buyer info:", error);
        throw error;
    }
}

// Get buyer information from user profile
export async function getBuyerInfo(userId: string): Promise<BuyerInfo | null> {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            return userData.buyerInfo || null;
        }
        
        return null;
    } catch (error) {
        console.error("Error getting buyer info:", error);
        return null;
    }
}

// Initialize or update user profile (can be called on user login/registration)
export async function initializeUserProfile(userId: string, email: string, displayName?: string, photoURL?: string): Promise<void> {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            // Create new user profile
            await setDoc(userRef, {
                uid: userId,
                email: email,
                displayName: displayName || null,
                photoURL: photoURL || null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else {
            // Update existing profile with latest auth info
            await updateDoc(userRef, {
                email: email,
                displayName: displayName || null,
                photoURL: photoURL || null,
                updatedAt: new Date()
            });
        }
    } catch (error) {
        console.error("Error initializing user profile:", error);
        throw error;
    }
}
