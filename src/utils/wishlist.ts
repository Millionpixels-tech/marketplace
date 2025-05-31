// src/utils/wishlist.ts
import { db } from "./firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getUserIP } from "./ipUtils";

// Wishlist record type
export interface WishlistUser {
    ownerId?: string | null;
    ip?: string | null;
    createdAt: number;
}

// Get wishlist array from a listing document
export function getWishlistArray(listing: any): WishlistUser[] {
    return Array.isArray(listing.wishlist) ? listing.wishlist : [];
}

// Add to wishlist (updates listing doc)
export async function addToWishlist(itemId: string, ownerId?: string | null): Promise<void> {
    const ip = await getUserIP();
    if (!itemId || (!ownerId && !ip)) return;
    const docRef = doc(db, "listings", itemId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    let prevWishlist: WishlistUser[] = getWishlistArray(docSnap.data());

    // If user is logged in, update any existing IP-only record for this item to have ownerId
    if (ownerId && ip) {
        let updated = false;
        prevWishlist = prevWishlist.map(w => {
            if (!w.ownerId && w.ip === ip) {
                updated = true;
                return { ...w, ownerId };
            }
            return w;
        });
        if (updated) {
            await updateDoc(docRef, { wishlist: prevWishlist });
            return;
        }
    }

    // Prevent duplicate by IP or ownerId
    const exists = prevWishlist.some(
        w =>
            (ownerId && w.ownerId === ownerId) ||
            (!ownerId && ip && w.ip === ip)
    );
    if (exists) return;
    // Add
    await updateDoc(docRef, {
        wishlist: arrayUnion({
            ownerId: ownerId ?? null,
            ip: ip ?? null,
            createdAt: Date.now(),
        }),
    });
}

// Remove from wishlist (updates listing doc)
export async function removeFromWishlist(itemId: string, ownerId?: string | null): Promise<void> {
    const ip = await getUserIP();
    if (!itemId || (!ownerId && !ip)) return;
    const docRef = doc(db, "listings", itemId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const prevWishlist: WishlistUser[] = getWishlistArray(docSnap.data());
    // Remove matching by ownerId or IP (if user is logged in, remove both their ownerId and any IP-only record for this IP)
    const filtered = prevWishlist.filter(w => {
        if (ownerId) {
            // Remove if matches ownerId or (no ownerId but matches IP)
            return !(w.ownerId === ownerId || (!w.ownerId && ip && w.ip === ip));
        } else {
            // Remove if matches IP
            return !(ip && w.ip === ip);
        }
    });
    await updateDoc(docRef, { wishlist: filtered });
}

// Returns true if this listing is wishlisted by this user/ip
export function isWishlisted(listing: any, ownerId?: string | null, ip?: string | null): boolean {
    const arr = getWishlistArray(listing);
    if (ownerId && arr.some(w => w.ownerId === ownerId)) return true;
    if (ip && arr.some(w => w.ip === ip)) return true;
    return false;
}

// For fetching all wishlisted item IDs for current user or IP (for a page with all listings, you just filter client-side)
export function getWishlistedIdsFromListings(
    listings: any[],
    ownerId?: string | null,
    ip?: string | null
): string[] {
    return listings
        .filter(l => isWishlisted(l, ownerId, ip))
        .map(l => l.id);
}
