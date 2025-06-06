// src/components/WishlistButton.tsx
import { useState, useEffect } from "react";
import { FiHeart } from "react-icons/fi";
import { addToWishlist, removeFromWishlist, isWishlisted } from "../../utils/wishlist";
import { useAuth } from "../../context/AuthContext";

type WishlistButtonProps = {
    displayText?: boolean; // Optional prop to control text display
    listing: any;
    refresh: () => void; // Callback to refresh parent data after wish/unwish
};

export default function WishlistButton({ listing, refresh, displayText = false }: WishlistButtonProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Compute wishlisted state based on listing.wishlist

    const [wishlisted, setWishlisted] = useState<boolean>(() =>
        isWishlisted(listing, user?.uid, listing.__client_ip)
    );

    // Sync wishlisted state when listing/user/ip changes
    useEffect(() => {
        setWishlisted(isWishlisted(listing, user?.uid, listing.__client_ip));
    }, [listing, user?.uid, listing.__client_ip]);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        if (wishlisted) {
            await removeFromWishlist(listing.id, user?.uid);
        } else {
            await addToWishlist(listing.id, user?.uid);
        }
        await refresh();
        setLoading(false);
        // No need to manually update wishlisted - parent refresh will do it
        window.dispatchEvent(new Event("wishlist-updated"));
    };

    return (
        <span className="flex items-center gap-2">
            <button
                aria-label={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                disabled={loading}
                onClick={handleClick}
                className={`rounded-full p-2 transition-colors flex items-center justify-center ${wishlisted ? 'bg-[#72b01d15] hover:bg-[#72b01d30]' : 'bg-white hover:bg-gray-50'}`}
            >
                {loading ? (
                    <svg className="animate-spin h-4 w-4 text-[#454955]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                ) : (
                    <FiHeart size={18} fill={wishlisted ? "#72b01d" : "none"} color={wishlisted ? "#72b01d" : "#454955"} />
                )}
            </button>
            {displayText && (
                <span className={wishlisted ? "text-[#72b01d] font-medium" : "text-[#454955]"}>{wishlisted ? 'Added to wishlist' : 'Add to wishlist'}</span>
            )}
        </span>
    );
}
