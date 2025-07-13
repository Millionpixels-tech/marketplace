import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { categories } from "../../utils/categories";
import { FiChevronDown, FiChevronRight, FiX, FiMenu, FiLogOut, FiUser } from "react-icons/fi";
import { getWishlistCount } from "../../utils/wishlist";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../utils/firebase";
import { FiSearch, FiHeart } from "react-icons/fi";
import MobileNotificationDropdown from "./MobileNotificationDropdown";

const MobileHeader = () => {
    const [catOpen, setCatOpen] = useState(false);
    const [subCatOpen, setSubCatOpen] = useState<number | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [wishlistCount, setWishlistCount] = useState(0);

    // Fetch wishlist count on mount and when user changes
    useEffect(() => {
        let mounted = true;
        
        async function fetchWishlistCount() {
            try {
                const count = await getWishlistCount(user?.uid);
                if (mounted) setWishlistCount(count);
            } catch (error) {
                console.error("Error fetching wishlist count:", error);
                if (mounted) setWishlistCount(0);
            }
        }
        
        fetchWishlistCount();

        // Listen for custom event to update count live
        const handler = () => fetchWishlistCount();
        window.addEventListener("wishlist-updated", handler);
        return () => {
            mounted = false;
            window.removeEventListener("wishlist-updated", handler);
        };
    }, [user]);

    const handleLogout = async () => {
        await auth.signOut();
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        navigate("/");
    };

    const getInitials = (nameOrEmail?: string | null) => {
        if (!nameOrEmail) return "👤";
        const parts = nameOrEmail.split(" ");
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    };

    return (
        <>
            {/* Main Mobile Header */}
            <header className="sticky top-0 z-30 w-full border-b bg-white">
                <div className="flex items-center justify-between px-3 py-2">
                    {/* Left: Menu Button and Logo */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                            aria-label="Open menu"
                        >
                            <FiMenu size={20} style={{ color: '#72b01d' }} />
                        </button>
                        
                        <Link to="/" state={{ fromInternal: true }} className="flex items-center -ml-2" style={{ color: '#0d0a0b' }}>
                            <img src="/logo.svg" alt="Sina.lk Logo" className="h-6 sm:h-7 w-auto hover:opacity-80 transition-opacity" />
                        </Link>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        {/* Search Button */}
                        <button
                            onClick={() => navigate('/search')}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100"
                            aria-label="Search"
                        >
                            <FiSearch size={16} className="sm:hidden" style={{ color: '#72b01d' }} />
                            <FiSearch size={18} className="hidden sm:block" style={{ color: '#72b01d' }} />
                        </button>

                        {/* Wishlist */}
                        {user && (
                            <Link
                                to="/wishlist"
                                className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100"
                                aria-label="Wishlist"
                            >
                                <FiHeart size={16} className="sm:hidden" style={{ color: '#72b01d' }} />
                                <FiHeart size={18} className="hidden sm:block" style={{ color: '#72b01d' }} />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                        {wishlistCount > 99 ? '99+' : wishlistCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Notifications - Only show for logged in users */}
                        {user && <MobileNotificationDropdown className="flex-shrink-0" />}

                        {/* User Menu */}
                        {!loading && (
                            user ? (
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="relative p-0.5 sm:p-1 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-semibold text-white ml-0.5"
                                    style={{ backgroundColor: '#72b01d' }}
                                    aria-label="User menu"
                                >
                                    {getInitials(user.displayName || user.email)}
                                </button>
                            ) : (
                                <Link
                                    to="/auth"
                                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100"
                                    aria-label="Login"
                                >
                                    <FiUser size={16} className="sm:hidden" style={{ color: '#72b01d' }} />
                                    <FiUser size={18} className="hidden sm:block" style={{ color: '#72b01d' }} />
                                </Link>
                            )
                        )}
                    </div>
                </div>

                {/* User Dropdown Menu */}
                {userMenuOpen && user && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-3 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                            <div className="py-2">
                                <div className="px-4 py-2 border-b">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <Link
                                    to="/dashboard"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                >
                                    <FiLogOut className="mr-2" size={14} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* Full Screen Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-white">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">Menu</h2>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                            aria-label="Close menu"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto h-full pb-20">
                        {/* Navigation Links */}
                        <div className="p-4 space-y-4">
                            <Link
                                to="/"
                                state={{ fromInternal: true }}
                                className="block text-lg font-medium text-gray-900 hover:text-green-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            
                            {/* Browse Services Link */}
                            <Link
                                to="/services"
                                className="block text-lg font-medium text-gray-900 hover:text-green-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Browse Services
                            </Link>

                            {/* Browse Products Link */}
                            <Link
                                to="/search"
                                className="block text-lg font-medium text-gray-900 hover:text-green-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Browse Products
                            </Link>

                            {/* Categories */}
                            <div>
                                <button
                                    onClick={() => setCatOpen(!catOpen)}
                                    className="flex items-center justify-between w-full text-lg font-medium text-gray-900 py-2"
                                >
                                    Categories
                                    <FiChevronDown className={`transform transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {catOpen && (
                                    <div className="ml-4 mt-2 space-y-3">
                                        {categories.map((cat, catIdx) => (
                                            <div key={catIdx}>
                                                <div className="flex items-center justify-between">
                                                    <Link
                                                        to={`/search?cat=${encodeURIComponent(cat.name)}`}
                                                        className="flex-1 py-2 text-gray-700 hover:text-green-600 font-medium"
                                                        onClick={() => {
                                                            setMobileMenuOpen(false);
                                                            setCatOpen(false);
                                                            setSubCatOpen(null);
                                                        }}
                                                    >
                                                        {cat.name}
                                                    </Link>
                                                    <button
                                                        onClick={() => setSubCatOpen(subCatOpen === catIdx ? null : catIdx)}
                                                        className="p-2 text-gray-500 hover:text-green-600"
                                                        aria-label={`Toggle ${cat.name} subcategories`}
                                                    >
                                                        <FiChevronRight className={`transform transition-transform ${subCatOpen === catIdx ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                                
                                                {subCatOpen === catIdx && (
                                                    <div className="ml-6 mt-2 space-y-2">
                                                        {cat.subcategories.map((sub, subIdx) => (
                                                            <Link
                                                                key={subIdx}
                                                                to={`/search?cat=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(sub)}`}
                                                                className="block py-1 text-sm text-gray-600 hover:text-green-600"
                                                                onClick={() => {
                                                                    setMobileMenuOpen(false);
                                                                    setCatOpen(false);
                                                                    setSubCatOpen(null);
                                                                }}
                                                            >
                                                                {sub}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* User-specific links */}
                            {user && (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="block text-lg font-medium text-gray-900 hover:text-green-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/orders"
                                        className="block text-lg font-medium text-gray-900 hover:text-green-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Orders
                                    </Link>
                                </>
                            )}
                            
                            {!user && (
                                <Link
                                    to="/auth"
                                    className="block text-lg font-medium text-green-600 hover:text-green-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login / Register
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileHeader;
