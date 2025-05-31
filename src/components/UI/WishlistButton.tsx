// src/components/WishlistButton.tsx
import { useState, useEffect } from "react";
import { FiHeart } from "react-icons/fi";
import {
    addToWishlist,
    removeFromWishlist,
    isItemWishlisted,
} from "../../utils/wishlist";
import { useAuth } from "../../context/AuthContext"; // Your context

type WishlistButtonProps = {
    productId: string;
};

export default function WishlistButton({ productId }: WishlistButtonProps) {
    const { user } = useAuth(); // returns { user: { uid } } or null
    const [wishlisted, setWishlisted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            const res = await isItemWishlisted(productId, user?.uid);
            if (mounted) setWishlisted(res);
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [productId, user?.uid]);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        if (wishlisted) {
            await removeFromWishlist(productId, user?.uid);
            setWishlisted(false);
        } else {
            await addToWishlist(productId, user?.uid);
            setWishlisted(true);
        }
        setLoading(false);
        // Dispatch custom event so header can update count live
        window.dispatchEvent(new Event("wishlist-updated"));
    };

    return (
        <button
            aria-label="Add to Wishlist"
            disabled={loading}
            onClick={handleClick}
            className={`rounded-full p-1.5 transition-colors flex items-center justify-center bg-gray-100 text-black hover:bg-gray-200`}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
            ) : (
                <FiHeart size={16} color="#111" fill={wishlisted ? "#111" : "none"} />
            )}
        </button>
    );
}
