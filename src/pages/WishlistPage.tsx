import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Header from "../components/UI/Header";
import ListingTile from "../components/UI/ListingTile";
import { getUserIP as getIP } from "../utils/ipUtils";
import type { DeliveryType as DeliveryTypeType } from "../types/enums";

// --- Type Definitions ---
type WishlistEntry = {
    ip?: string;
    ownerId?: string;
};

type Listing = {
    id: string;
    name?: string;
    price?: number;
    images?: string[];
    description?: string;
    wishlist?: WishlistEntry[];
    reviews?: any[];
    deliveryType?: DeliveryTypeType;
    cashOnDelivery?: boolean;
};

// Get user IP using the imported function
async function getUserIP(): Promise<string | null> {
    return await getIP();
}

export default function WishlistPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [ip, setIp] = useState<string | null>(null);
    
    // Cache for wishlist items to avoid repeated fetches
    const cacheRef = useRef<{ data: Listing[], timestamp: number } | null>(null);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Memoized user identifier for caching
    const userIdentifier = useMemo(() => {
        return user?.uid || ip || 'anonymous';
    }, [user?.uid, ip]);

    // Function to refresh listings (after wishlist update) - optimized with useCallback
    const refreshListings = useCallback(async () => {
        // Clear cache when refreshing to ensure fresh data
        cacheRef.current = null;
        
        const snap = await getDocs(collection(db, "listings"));
        const results: Listing[] = [];
        snap.docs.forEach(doc => {
            const listing = { id: doc.id, ...doc.data(), __client_ip: ip } as Listing;
            if (Array.isArray(listing.wishlist)) {
                const hasOwner = user && listing.wishlist.some(w => w.ownerId === user.uid);
                const hasIp = ip && listing.wishlist.some(w => w.ip === ip);
                if (hasOwner || hasIp) {
                    results.push(listing);
                }
            }
        });
        
        // Update cache
        cacheRef.current = { data: results, timestamp: Date.now() };
        setItems(results);
    }, [user, ip]);

    // Optimized fetch function with caching
    const fetchWishlist = useCallback(async () => {
        setLoading(true);
        const userIp = await getUserIP();
        setIp(userIp);

        if (!user && !userIp) {
            setItems([]);
            setLoading(false);
            return;
        }

        // Check cache first
        if (cacheRef.current && (Date.now() - cacheRef.current.timestamp < CACHE_DURATION)) {
            setItems(cacheRef.current.data);
            setLoading(false);
            return;
        }

        try {
            // Fetch all listings, then filter client-side by wishlist
            // Note: Firestore doesn't support efficient queries for array contains with OR conditions
            // across different user identifiers, so client-side filtering is necessary here
            const snap = await getDocs(collection(db, "listings"));
            const results: Listing[] = [];
            snap.docs.forEach(doc => {
                const listing = { id: doc.id, ...doc.data() } as Listing;
                // Add client IP to each listing for WishlistButton to use
                if (userIp) {
                    (listing as any).__client_ip = userIp;
                }
                if (Array.isArray(listing.wishlist)) {
                    const hasOwner = user && listing.wishlist.some(w => w.ownerId === user.uid);
                    const hasIp = userIp && listing.wishlist.some(w => w.ip === userIp);
                    if (hasOwner || hasIp) {
                        results.push(listing);
                    }
                }
            });
            
            // Cache the results
            cacheRef.current = { data: results, timestamp: Date.now() };
            setItems(results);
        } catch (error) {
            console.error("Error fetching wishlist:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user, userIdentifier]);

    // Fetch wishlist items on component mount - optimized dependencies
    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    // Memoized loading component for better performance
    const loadingComponent = useMemo(() => (
        <div className="min-h-screen flex items-center justify-center text-[#454955]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-[#72b01d] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg font-medium">Loading your wishlist...</p>
            </div>
        </div>
    ), []);

    // Memoized empty state for unauthenticated users
    const unauthenticatedEmptyState = useMemo(() => (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center p-8 max-w-lg bg-white rounded-2xl shadow-lg border border-[#45495522]">
                <div className="text-[#72b01d] text-5xl mb-4">❤️</div>
                <h2 className="text-2xl font-bold text-[#0d0a0b] mb-2">Your Wishlist is Empty</h2>
                <p className="text-[#454955] mb-6">Please log in to view your wishlist or start adding some items you love!</p>
                <Link
                    to="/auth"
                    className="px-6 py-3 bg-[#72b01d] text-white rounded-xl font-semibold shadow-md hover:bg-[#3f7d20] transition-colors"
                >
                    Sign In
                </Link>
            </div>
        </div>
    ), []);

    // Memoized empty wishlist state
    const emptyWishlistState = useMemo(() => (
        <div className="text-[#454955] text-center py-16 max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 border border-[#45495522]">
            <div className="text-4xl mb-4">💔</div>
            <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">No items in your wishlist yet</h3>
            <p className="mb-6">Browse our marketplace and click the heart icon to add items to your wishlist!</p>
            <Link
                to="/search"
                className="px-6 py-3 bg-[#72b01d] text-white rounded-xl font-semibold shadow-md hover:bg-[#3f7d20] transition-colors"
            >
                Go Shopping
            </Link>
        </div>
    ), []);

    // Memoized items grid for better performance
    const itemsGrid = useMemo(() => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 w-full max-w-7xl mx-auto">
            {items.map(item => (
                <ListingTile 
                    key={`wishlist-${item.id}`}
                    listing={item}
                    onRefresh={refreshListings}
                />
            ))}
        </div>
    ), [items, refreshListings]);

    if (loading) {
        return loadingComponent;
    }

    if (!user && items.length === 0) {
        return unauthenticatedEmptyState;
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-white w-full">
                <div className="w-full py-12 px-4">
                    <h1 className="text-3xl font-black mb-2 text-center text-[#0d0a0b]">Your Wishlist</h1>
                    <p className="text-center text-[#454955] mb-8 max-w-2xl mx-auto">
                        Here you'll find all the items you've added to your wishlist. Save your favorites and come back anytime to shop or keep track of what you love!
                    </p>
                    {items.length === 0 ? emptyWishlistState : itemsGrid}
                </div>
            </div>
        </>
    );
}
