import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import ResponsiveListingTile from "../components/UI/ResponsiveListingTile";
import { SEOHead } from "../components/SEO/SEOHead";
import { getUserIP as getIP } from "../utils/ipUtils";
import { useResponsive } from "../hooks/useResponsive";
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
    const { isMobile } = useResponsive();
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
        
        if (!user?.uid && !ip) {
            setItems([]);
            return;
        }
        
        let results: Listing[] = [];
        
        try {
            // Since wishlist objects have varying structures (with timestamps),
            // we need to use a more targeted approach rather than exact array-contains matching
            
            // Get all listings with any wishlist items and filter client-side
            // This is more efficient than full collection scan but handles the complex wishlist structure
            const allListingsQuery = query(
                collection(db, "listings"),
                where("wishlist", "!=", null), // Only get listings that have wishlist arrays
                limit(500) // Reasonable limit to prevent excessive reads
            );
            
            const snap = await getDocs(allListingsQuery);
            
            snap.docs.forEach(doc => {
                const listing = { id: doc.id, ...doc.data(), __client_ip: ip } as Listing;
                if (Array.isArray(listing.wishlist)) {
                    const hasOwner = user?.uid && listing.wishlist.some((w: any) => w.ownerId === user.uid);
                    const hasIp = ip && listing.wishlist.some((w: any) => w.ip === ip);
                    if (hasOwner || hasIp) {
                        results.push(listing);
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            results = [];
        }
        
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
            // Optimized wishlist fetch with filtering
            let results: Listing[] = [];
            
            if (user?.uid || userIp) {
                // Get listings that have wishlist items and filter appropriately
                const wishlistQuery = query(
                    collection(db, "listings"),
                    where("wishlist", "!=", null), // Only get listings with wishlist arrays
                    limit(500) // Reasonable limit to prevent excessive reads
                );
                
                const snap = await getDocs(wishlistQuery);
                
                snap.docs.forEach(doc => {
                    const listing = { id: doc.id, ...doc.data() } as Listing;
                    // Add client IP to each listing for WishlistButton to use
                    if (userIp) {
                        (listing as any).__client_ip = userIp;
                    }
                    if (Array.isArray(listing.wishlist)) {
                        const hasOwner = user?.uid && listing.wishlist.some((w: any) => w.ownerId === user.uid);
                        const hasIp = userIp && listing.wishlist.some((w: any) => w.ip === userIp);
                        if (hasOwner || hasIp) {
                            results.push(listing);
                        }
                    }
                });
            }
            
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
        <div className="min-h-screen bg-white w-full">
            <div className={`w-full ${isMobile ? 'py-8 px-4' : 'py-12 px-4'}`}>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 text-center text-[#0d0a0b]`}>Your Wishlist</h1>
                <p className={`text-center text-[#454955] ${isMobile ? 'mb-6 text-sm max-w-sm' : 'mb-8 max-w-2xl'} mx-auto`}>
                    Here you'll find all the items you've added to your wishlist. Save your favorites and come back anytime to shop or keep track of what you love!
                </p>
                <div className="flex items-center justify-center">
                    <div className={`text-center ${isMobile ? 'p-6 max-w-sm' : 'p-8 max-w-lg'} bg-white rounded-2xl shadow-lg border border-[#45495522]`}>
                        <div className={`text-[#72b01d] ${isMobile ? 'text-3xl mb-3' : 'text-5xl mb-4'}`}>❤️</div>
                        <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-[#0d0a0b] mb-2`}>Your Wishlist is Empty</h2>
                        <p className={`text-[#454955] ${isMobile ? 'mb-4 text-sm' : 'mb-6'}`}>Please log in to view your wishlist or start adding some items you love!</p>
                        <Link
                            to="/auth"
                            className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-[#72b01d] text-white rounded-xl font-semibold shadow-md hover:bg-[#3f7d20] transition-colors`}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    ), [isMobile]);

    // Memoized empty wishlist state
    const emptyWishlistState = useMemo(() => (
        <div className={`text-[#454955] text-center ${isMobile ? 'py-12 max-w-xs mx-auto p-6' : 'py-16 max-w-md mx-auto p-8'} bg-white rounded-2xl shadow-md border border-[#45495522]`}>
            <div className={`${isMobile ? 'text-3xl mb-3' : 'text-4xl mb-4'}`}>💔</div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-[#0d0a0b] mb-2`}>No items in your wishlist yet</h3>
            <p className={`${isMobile ? 'mb-4 text-sm' : 'mb-6'}`}>Browse our marketplace and click the heart icon to add items to your wishlist!</p>
            <Link
                to="/search"
                className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-[#72b01d] text-white rounded-xl font-semibold shadow-md hover:bg-[#3f7d20] transition-colors`}
            >
                Go Shopping
            </Link>
        </div>
    ), []);

    // Memoized items grid for better performance
    const itemsGrid = useMemo(() => (
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'} w-full max-w-7xl mx-auto`}>
            {items.map(item => (
                <ResponsiveListingTile 
                    key={`wishlist-${item.id}`}
                    listing={item}
                    onRefresh={refreshListings}
                />
            ))}
        </div>
    ), [items, refreshListings, isMobile]);

    if (loading) {
        return (
            <>
                <SEOHead
                    title="My Wishlist - SinaMarketplace"
                    description="View and manage your saved items on SinaMarketplace. Keep track of your favorite products and never miss out on great deals."
                    keywords="wishlist, saved items, favorites, Sri Lanka marketplace, online shopping, wish list"
                    canonicalUrl="https://sinamarketplace.com/wishlist"
                    noIndex={true}
                />
                <ResponsiveHeader />
                {loadingComponent}
                <Footer />
            </>
        );
    }

    return (
        <>
            <SEOHead
                title="My Wishlist - SinaMarketplace"
                description="View and manage your saved items on SinaMarketplace. Keep track of your favorite products and never miss out on great deals."
                keywords="wishlist, saved items, favorites, Sri Lanka marketplace, online shopping, wish list"
                canonicalUrl="https://sinamarketplace.com/wishlist"
                noIndex={true}
            />
            <ResponsiveHeader />
            {!user && items.length === 0 ? (
                unauthenticatedEmptyState
            ) : (
                <div className="min-h-screen bg-white w-full">
                    <div className={`w-full ${isMobile ? 'py-8 px-4' : 'py-12 px-4'}`}>
                        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 text-center text-[#0d0a0b]`}>Your Wishlist</h1>
                        <p className={`text-center text-[#454955] ${isMobile ? 'mb-6 text-sm max-w-sm' : 'mb-8 max-w-2xl'} mx-auto`}>
                            Here you'll find all the items you've added to your wishlist. Save your favorites and come back anytime to shop or keep track of what you love!
                        </p>
                        {items.length === 0 ? emptyWishlistState : itemsGrid}
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
}
