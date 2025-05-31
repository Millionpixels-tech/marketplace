import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiBox } from "react-icons/fi";
import Header from "../components/UI/Header";

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
};

// Dummy getUserIP if you don't have one (replace with your implementation)
async function getUserIP(): Promise<string | null> {
    // You could call an API or return a hardcoded IP for dev/testing.
    // For now, return null if you don't want IP-based wishlist.
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip;
    } catch {
        return null;
    }
}

export default function WishlistPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWishlist() {
            setLoading(true);
            let userIp: string | null = null;
            if (!user) {
                // Try to use IP address if user not logged in
                userIp = await getUserIP();
                if (!userIp) {
                    setItems([]);
                    setLoading(false);
                    return;
                }
            } else {
                userIp = await getUserIP(); // Could still be useful to show IP-based items for logged in users
            }

            // Fetch all listings, then filter client-side by wishlist
            const snap = await getDocs(collection(db, "listings"));
            const results: Listing[] = [];
            snap.docs.forEach(doc => {
                const listing = { id: doc.id, ...doc.data() } as Listing;
                if (Array.isArray(listing.wishlist)) {
                    const hasOwner = user && listing.wishlist.some(w => w.ownerId === user.uid);
                    const hasIp = userIp && listing.wishlist.some(w => w.ip === userIp);
                    if (hasOwner || hasIp) {
                        results.push(listing);
                    }
                }
            });
            setItems(results);
            setLoading(false);
        }
        fetchWishlist();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400">
                Loading...
            </div>
        );
    }

    if (!user && items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400">
                Please log in to view your wishlist.
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-white w-full">
                <div className="w-full py-12 px-4">
                    <h1 className="text-3xl font-black mb-2 text-center">Your Wishlist</h1>
                    <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
                        Here you’ll find all the items you’ve added to your wishlist. Save your favorites and come back anytime to shop or keep track of what you love!
                    </p>
                    {items.length === 0 ? (
                        <div className="text-gray-400 text-center py-16">
                            No items in your wishlist yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
                            {items.map(item => (
                                <Link
                                    to={`/listing/${item.id}`}
                                    key={item.id}
                                    className="flex flex-col border border-black bg-gray-50 rounded-xl shadow-sm p-6 min-h-[220px] hover:bg-gray-100 transition cursor-pointer"
                                    style={{ textDecoration: "none", color: "inherit" }}
                                >
                                    <div className="w-full h-32 bg-gray-200 mb-4 rounded overflow-hidden flex items-center justify-center">
                                        {item.images && item.images.length > 0 ? (
                                            <img
                                                src={item.images[0]}
                                                alt={item.name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <FiBox className="text-3xl text-gray-400" />
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2 truncate">
                                        {item.name}
                                    </h3>
                                    <p className="text-sm font-light mb-2 text-gray-700 line-clamp-2">
                                        {item.description}
                                    </p>
                                    <span className="font-bold text-black mt-auto">
                                        Rs. {item.price?.toLocaleString("en-LK") || "0.00"}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
