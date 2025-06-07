import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Optimized database query utilities for better performance
 */

// Type definitions
interface ListingData {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    subcategory?: string;
    deliveryType?: string;
    createdAt?: any;
    shopId?: string;
    [key: string]: any;
}

interface ShopData {
    id: string;
    name?: string;
    owner?: string;
    [key: string]: any;
}

interface OrderData {
    id: string;
    buyerId?: string;
    sellerId?: string;
    createdAt?: any;
    [key: string]: any;
}

interface UserData {
    displayName?: string | null;
    isVerified?: string | null;
    verification?: {
        isVerified?: string;
    };
    [key: string]: any;
}

// Cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch fresh if cache is expired
 */
function getCachedData(key: string): any | null {
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

/**
 * Set data in cache
 */
function setCachedData(key: string, data: any): void {
    queryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Batch fetch user's shops and listings
 */
export async function fetchUserShopsAndListings(userId: string) {
    const cacheKey = `user-shops-listings-${userId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
        // Fetch shops first
        const shopsQuery = query(
            collection(db, "shops"),
            where("owner", "==", userId)
        );
        const shopsSnapshot = await getDocs(shopsQuery);
        const shops = shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShopData[];
        
        let listings: ListingData[] = [];
        if (shops.length > 0) {
            const shopIds = shops.map(shop => shop.id);
            // Use "in" query for efficient batch fetching
            const listingsQuery = query(
                collection(db, "listings"),
                where("shopId", "in", shopIds),
                orderBy("createdAt", "desc"),
                limit(100) // Reasonable limit
            );
            const listingsSnapshot = await getDocs(listingsQuery);
            listings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ListingData[];
        }

        const result = { shops, listings };
        setCachedData(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Error fetching user shops and listings:", error);
        return { shops: [], listings: [] };
    }
}

/**
 * Batch fetch user's orders (buyer and seller)
 */
export async function fetchUserOrders(userId: string) {
    const cacheKey = `user-orders-${userId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
        const [buyerSnapshot, sellerSnapshot] = await Promise.all([
            getDocs(query(
                collection(db, "orders"),
                where("buyerId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(50)
            )),
            getDocs(query(
                collection(db, "orders"),
                where("sellerId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(50)
            ))
        ]);

        const result = {
            buyerOrders: buyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderData[],
            sellerOrders: sellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderData[]
        };

        setCachedData(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return { buyerOrders: [], sellerOrders: [] };
    }
}

/**
 * Fetch paginated listings with filters
 */
export async function fetchPaginatedListings(filters: {
    category?: string;
    subcategory?: string;
    deliveryType?: string;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
    sortBy?: "newest" | "price-asc" | "price-desc";
    pageSize?: number;
}) {
    try {
        const {
            category,
            subcategory,
            deliveryType,
            sortBy = "newest",
            pageSize = 20
        } = filters;

        let baseQuery = collection(db, "listings");
        const conditions: any[] = [];

        // Add Firestore-compatible filters
        if (category) {
            conditions.push(where("category", "==", category));
        }
        if (subcategory) {
            conditions.push(where("subcategory", "==", subcategory));
        }
        if (deliveryType) {
            conditions.push(where("deliveryType", "==", deliveryType));
        }

        // Add sorting
        let orderByField = "createdAt";
        let direction: "asc" | "desc" = "desc";
        
        if (sortBy === "price-asc") {
            orderByField = "price";
            direction = "asc";
        } else if (sortBy === "price-desc") {
            orderByField = "price";
            direction = "desc";
        }

        const q = query(
            baseQuery,
            ...conditions,
            orderBy(orderByField, direction),
            limit(pageSize * 2) // Fetch extra for client-side filtering
        );

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ListingData[];

        // Apply client-side filters that can't be done efficiently server-side
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            results = results.filter(item => 
                item.name?.toLowerCase().includes(term) ||
                item.description?.toLowerCase().includes(term)
            );
        }

        if (filters.minPrice !== undefined) {
            results = results.filter(item => Number(item.price) >= filters.minPrice!);
        }

        if (filters.maxPrice !== undefined) {
            results = results.filter(item => Number(item.price) <= filters.maxPrice!);
        }

        return {
            items: results.slice(0, pageSize),
            hasMore: results.length > pageSize,
            totalCount: results.length
        };
    } catch (error) {
        console.error("Error fetching paginated listings:", error);
        return { items: [], hasMore: false, totalCount: 0 };
    }
}

/**
 * Fetch wishlist items efficiently using array-contains
 */
export async function fetchWishlistItems(userId?: string, userIp?: string) {
    if (!userId && !userIp) {
        return [];
    }

    try {
        const results: any[] = [];

        // Query by user ID if available
        if (userId) {
            const userQuery = query(
                collection(db, "listings"),
                where("wishlist", "array-contains", { ownerId: userId })
            );
            const userSnapshot = await getDocs(userQuery);
            userSnapshot.docs.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
        }

        // Query by IP if available and no user results
        if (userIp && (!userId || results.length === 0)) {
            const ipQuery = query(
                collection(db, "listings"),
                where("wishlist", "array-contains", { ip: userIp })
            );
            const ipSnapshot = await getDocs(ipQuery);
            ipSnapshot.docs.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                // Avoid duplicates
                if (!results.find(existing => existing.id === item.id)) {
                    results.push(item);
                }
            });
        }

        return results;
    } catch (error) {
        console.error("Error fetching wishlist items:", error);
        return [];
    }
}

/**
 * Clear specific cache entries
 */
export function clearCache(pattern?: string) {
    if (pattern) {
        for (const key of queryCache.keys()) {
            if (key.includes(pattern)) {
                queryCache.delete(key);
            }
        }
    } else {
        queryCache.clear();
    }
}

/**
 * Preload common data for better UX
 */
export async function preloadCommonData() {
    try {
        // Preload popular categories/listings
        const popularQuery = query(
            collection(db, "listings"),
            orderBy("createdAt", "desc"),
            limit(20)
        );
        await getDocs(popularQuery);
    } catch (error) {
        console.error("Error preloading data:", error);
    }
}

/**
 * Get user data with caching to reduce repeated queries
 */
export async function fetchUserData(userId: string): Promise<UserData | null> {
    const cacheKey = `user-data-${userId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
        const userQuery = query(
            collection(db, "users"),
            where("uid", "==", userId)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            const result: UserData = {
                displayName: userData.displayName || null,
                isVerified: userData.verification?.isVerified || null,
                ...userData
            };
            setCachedData(cacheKey, result);
            return result;
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}
