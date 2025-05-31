// src/utils/wishlist.ts
import { db } from "./firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    doc,
    Query,
} from "firebase/firestore";
import { getUserIP } from "./ipUtils"; // You need to implement this function (returns IP as string)

// --- Wishlist Entry Type ---
export interface WishlistEntry {
    itemId: string;
    ownerId?: string | null;
    ip?: string | null;
    createdAt: number;
}

// --- Add to Wishlist ---
export async function addToWishlist(itemId: string, ownerId?: string | null): Promise<void> {
    const ip = await getUserIP();
    if (!itemId || (!ownerId && !ip)) return;

    // Check if already exists for either ownerId or IP
    let q: Query;
    if (ownerId) {
        q = query(
            collection(db, "wishlists"),
            where("itemId", "==", itemId),
            where("ownerId", "==", ownerId)
        );
    } else {
        q = query(
            collection(db, "wishlists"),
            where("itemId", "==", itemId),
            where("ip", "==", ip)
        );
    }
    const snap = await getDocs(q);
    if (!snap.empty) return;

    await addDoc(collection(db, "wishlists"), {
        itemId,
        ownerId: ownerId ?? null,
        ip: ip ?? null,
        createdAt: Date.now(),
    } as WishlistEntry);
}

// --- Remove from Wishlist ---
export async function removeFromWishlist(itemId: string, ownerId?: string | null): Promise<void> {
    const ip = await getUserIP();
    if (!itemId || (!ownerId && !ip)) return;

    // Remove all wishlist entries for this item, for either ownerId or IP (if both, remove both)
    const queries: Query[] = [];
    if (ownerId) {
        queries.push(
            query(
                collection(db, "wishlists"),
                where("itemId", "==", itemId),
                where("ownerId", "==", ownerId)
            )
        );
    }
    if (ip) {
        queries.push(
            query(
                collection(db, "wishlists"),
                where("itemId", "==", itemId),
                where("ip", "==", ip)
            )
        );
    }
    const allDocs = await Promise.all(queries.map(q => getDocs(q)));
    for (const snap of allDocs) {
        for (const docSnap of snap.docs) {
            await deleteDoc(doc(db, "wishlists", docSnap.id));
        }
    }
}

// --- Get All Wishlisted Item IDs ---
export async function getWishlistedItemIds(ownerId?: string | null): Promise<string[]> {
    const ip = await getUserIP();
    if (!ownerId && !ip) return [];

    const queries: Query[] = [];
    if (ownerId) {
        queries.push(query(collection(db, "wishlists"), where("ownerId", "==", ownerId)));
    }
    if (ip) {
        queries.push(query(collection(db, "wishlists"), where("ip", "==", ip)));
    }

    const allDocs = await Promise.all(queries.map(q => getDocs(q)));
    const idsSet = new Set<string>();
    allDocs.forEach(snap => {
        snap.docs.forEach(docSnap => {
            idsSet.add((docSnap.data() as WishlistEntry).itemId);
        });
    });
    return Array.from(idsSet);
}

// --- Is Item Wishlisted ---
export async function isItemWishlisted(itemId: string, ownerId?: string | null): Promise<boolean> {
    const ip = await getUserIP();
    if (!itemId || (!ownerId && !ip)) return false;

    const queries: Query[] = [];
    if (ownerId) {
        queries.push(
            query(
                collection(db, "wishlists"),
                where("itemId", "==", itemId),
                where("ownerId", "==", ownerId)
            )
        );
    }
    if (ip) {
        queries.push(
            query(
                collection(db, "wishlists"),
                where("itemId", "==", itemId),
                where("ip", "==", ip)
            )
        );
    }
    const allDocs = await Promise.all(queries.map(q => getDocs(q)));
    return allDocs.some(snap => !snap.empty);
}

// --- Merge Guest Wishlist to User On Login (Optional) ---
export async function migrateGuestWishlistToUser(ownerId: string) {
    const ip = await getUserIP();
    if (!ownerId || !ip) return;

    // Get all guest wishlists by IP
    const q = query(collection(db, "wishlists"), where("ip", "==", ip));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        // If not already associated with this user, add as user and delete guest
        if (!data.ownerId) {
            // Check if user already has this item wishlisted
            const already = await getDocs(
                query(
                    collection(db, "wishlists"),
                    where("itemId", "==", data.itemId),
                    where("ownerId", "==", ownerId)
                )
            );
            if (already.empty) {
                await addDoc(collection(db, "wishlists"), {
                    ...data,
                    ownerId,
                    ip: null,
                });
            }
            // Remove guest/IP wishlist entry
            await deleteDoc(doc(db, "wishlists", docSnap.id));
        }
    }
}
