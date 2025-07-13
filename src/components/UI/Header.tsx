import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { categories } from "../../utils/categories";
import { FiChevronDown, FiChevronRight, FiX, FiMenu, FiLogOut, FiUser } from "react-icons/fi";
import { getWishlistCount } from "../../utils/wishlist";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../utils/firebase";
import NotificationDropdown from "./NotificationDropdown";

const Header = () => {
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
        <header className="sticky top-0 z-30 w-full border-b" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
            <div className="flex items-center justify-between px-2 md:px-4 lg:px-6 xl:px-10 py-3 md:py-4 w-full">
                {/* Logo & Categories (Left) */}
                <div className="flex items-center gap-1 md:gap-3 lg:gap-6">
                    {/* Logo/Title */}
                    <Link to="/" state={{ fromInternal: true }} className="flex items-center" style={{ color: '#0d0a0b' }}>
                        <img src="/logo.svg" alt="Sina.lk Logo" className="h-6 lg:h-7 w-auto hover:opacity-80 transition-opacity" />
                    </Link>
                    {/* Categories Dropdown */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setCatOpen((open) => !open)}
                            className="flex items-center px-2 lg:px-4 py-2 rounded-lg font-semibold border transition text-sm lg:text-base"
                            style={{
                                borderColor: 'rgba(114, 176, 29, 0.6)',
                                color: '#0d0a0b',
                                backgroundColor: '#ffffff'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#72b01d';
                                e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = '#0d0a0b';
                            }}
                            aria-haspopup="menu"
                            aria-expanded={catOpen}
                        >
                            Categories
                            <FiChevronDown className="ml-2" />
                        </button>
                        {catOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => {
                                        setCatOpen(false);
                                        setSubCatOpen(null);
                                    }}
                                />
                                <div
                                    className="absolute left-0 top-12 w-[340px] rounded-lg shadow-lg z-50 border"
                                    style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.4)' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex flex-col py-2">
                                        <button
                                            className="self-end mr-2 mb-2"
                                            onClick={() => {
                                                setCatOpen(false);
                                                setSubCatOpen(null);
                                            }}
                                            aria-label="Close"
                                        >
                                            <FiX />
                                        </button>
                                        <ul>
                                            {categories.map((cat, idx) => (
                                                <li key={cat.name}>
                                                    <button
                                                        className={`w-full flex items-center justify-between px-6 py-3 text-left font-semibold transition rounded-lg ${subCatOpen === idx ? "" : ""}`}
                                                        style={{
                                                            color: '#0d0a0b',
                                                            backgroundColor: subCatOpen === idx ? 'rgba(114, 176, 29, 0.2)' : 'transparent'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#72b01d';
                                                            e.currentTarget.style.color = '#ffffff';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = subCatOpen === idx ? 'rgba(114, 176, 29, 0.2)' : 'transparent';
                                                            e.currentTarget.style.color = '#0d0a0b';
                                                        }}
                                                        onClick={() =>
                                                            subCatOpen === idx ? setSubCatOpen(null) : setSubCatOpen(idx)
                                                        }
                                                    >
                                                        {cat.name}
                                                        <FiChevronRight
                                                            className={`ml-2 transition-transform ${subCatOpen === idx ? "rotate-90" : ""}`}
                                                        />
                                                    </button>
                                                    {subCatOpen === idx && (
                                                        <ul className="pl-8 border-l" style={{ borderColor: 'rgba(114, 176, 29, 0.5)' }}>
                                                            {cat.subcategories.map((sub) => (
                                                                <li key={sub}>
                                                                    <button
                                                                        className="w-full px-4 py-2 text-left font-light transition rounded"
                                                                        style={{ color: '#454955' }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.backgroundColor = '#72b01d';
                                                                            e.currentTarget.style.color = '#ffffff';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                                            e.currentTarget.style.color = '#454955';
                                                                        }}
                                                                        onClick={() => {
                                                                            setCatOpen(false);
                                                                            setSubCatOpen(null);
                                                                            navigate(
                                                                                `/search?cat=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(sub)}`
                                                                            );
                                                                        }}
                                                                    >
                                                                        {sub}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {/* Menu (Right) */}
                <div className="hidden md:flex items-center gap-2 lg:gap-4">
                    {/* Browse Services - New section */}
                    <Link
                        to="/services"
                        className="hidden lg:flex px-3 lg:px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-sm lg:text-base"
                        style={{ color: '#0d0a0b' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                            e.currentTarget.style.color = '#72b01d';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#0d0a0b';
                        }}
                    >
                        Browse Services
                    </Link>
                    
                    {/* Browse Products - Hide on medium screens, show on large */}
                    <Link
                        to="/search"
                        className="hidden lg:flex px-3 lg:px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-sm lg:text-base"
                        style={{ color: '#0d0a0b' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                            e.currentTarget.style.color = '#72b01d';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#0d0a0b';
                        }}
                    >
                        Browse Products
                    </Link>
                    
                    {/* Wishlist - Responsive sizing */}
                    <Link
                        to="/wishlist"
                        className="px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold relative flex items-center transition-all duration-300 hover:scale-105 text-xs md:text-sm lg:text-base"
                        style={{ color: '#0d0a0b' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                            e.currentTarget.style.color = '#72b01d';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#0d0a0b';
                        }}
                    >
                        <span className="hidden lg:inline">Wishlist</span>
                        <span className="lg:hidden">❤️</span>
                        {wishlistCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none rounded-full absolute -top-2 -right-3" style={{ backgroundColor: '#72b01d', color: '#ffffff' }}>{wishlistCount}</span>
                        )}
                    </Link>
                    
                    {/* Notifications - Only show for logged in users with responsive sizing */}
                    {user && (
                        <div className="md:block">
                            <NotificationDropdown className="relative" />
                        </div>
                    )}
                    
                    {/* Auth/User */}
                    <div className="flex items-center gap-1 lg:gap-2 ml-2 lg:ml-4 relative">
                        {loading ? null : !user ? (
                            <Link
                                to="/auth"
                                className="border rounded-full px-3 md:px-4 lg:px-5 py-2 font-semibold transition text-xs md:text-sm lg:text-base"
                                style={{
                                    borderColor: 'rgba(114, 176, 29, 0.6)',
                                    color: '#0d0a0b',
                                    backgroundColor: '#ffffff'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#0d0a0b';
                                }}
                            >
                                <span className="hidden lg:inline">Login / Register</span>
                                <span className="lg:hidden">Login</span>
                            </Link>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen((open) => !open)}
                                    className="flex items-center gap-1 lg:gap-2 rounded-full px-1 lg:px-2 py-1 transition"
                                    style={{ backgroundColor: '#ffffff' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                    }}
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                >
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Profile"
                                            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover border"
                                            style={{ borderColor: 'rgba(114, 176, 29, 0.6)' }}
                                        />
                                    ) : (
                                        <span className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-full font-bold border text-sm lg:text-lg" style={{ backgroundColor: '#ffffff', color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.6)' }}>
                                            {getInitials(user.displayName || user.email)}
                                        </span>
                                    )}
                                    <span className="hidden xl:block font-semibold max-w-[100px] lg:max-w-[120px] truncate text-sm lg:text-base" style={{ color: '#0d0a0b' }}>
                                        {user.displayName || user.email}
                                    </span>
                                    <FiChevronDown className="ml-1" />
                                </button>
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-12 w-52 rounded-lg shadow-lg z-50 flex flex-col border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.4)' }}>
                                            <button
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    navigate("/dashboard");
                                                }}
                                                className="flex items-center gap-2 px-4 py-3 text-left font-semibold transition border-b"
                                                style={{
                                                    color: '#0d0a0b',
                                                    borderColor: 'rgba(114, 176, 29, 0.3)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                                    e.currentTarget.style.color = '#ffffff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = '#0d0a0b';
                                                }}
                                            >
                                                <FiUser className="inline mr-2" />
                                                Dashboard
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 px-4 py-3 text-left font-semibold transition"
                                                style={{ color: '#0d0a0b' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                                    e.currentTarget.style.color = '#ffffff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = '#0d0a0b';
                                                }}
                                            >
                                                <FiLogOut className="inline mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* Burger Menu for Mobile */}
                <button
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border transition"
                    style={{
                        borderColor: 'rgba(114, 176, 29, 0.6)',
                        color: '#0d0a0b',
                        backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#72b01d';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.color = '#0d0a0b';
                    }}
                    onClick={() => setMobileMenuOpen((open) => !open)}
                    aria-label="Open menu"
                >
                    <FiMenu size={22} />
                </button>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        style={{ backgroundColor: 'rgba(13, 10, 11, 0.2)' }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div
                        className="fixed top-0 right-0 w-4/5 max-w-xs h-full border-l z-50 flex flex-col pt-6 px-6 pb-8 shadow-xl animate-slide-in"
                        style={{
                            backgroundColor: '#ffffff',
                            borderColor: 'rgba(114, 176, 29, 0.4)'
                        }}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-3 right-3 p-2 rounded-full transition"
                            style={{ color: '#0d0a0b' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Close menu"
                        >
                            <FiX size={22} />
                        </button>
                        {/* Links */}
                        <nav className="flex flex-col gap-4 mt-10">
                            <button
                                className="flex items-center w-full justify-between font-semibold py-3 px-4 rounded-lg transition"
                                style={{ color: '#0d0a0b' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                    e.currentTarget.style.color = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#0d0a0b';
                                }}
                                onClick={() => setCatOpen((open) => !open)}
                            >
                                Categories <FiChevronDown className="ml-2" />
                            </button>
                            {/* Categories Drawer in Mobile */}
                            {catOpen && (
                                <ul
                                    className="mb-2 rounded-lg border p-2"
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderColor: 'rgba(114, 176, 29, 0.3)'
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <li key={cat.name} className="mb-1">
                                            <button
                                                className="w-full text-left px-3 py-2 rounded transition font-medium"
                                                style={{ color: '#454955' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                                    e.currentTarget.style.color = '#ffffff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = '#454955';
                                                }}
                                                onClick={() => {
                                                    setCatOpen(false);
                                                    setMobileMenuOpen(false);
                                                    navigate(`/search?cat=${encodeURIComponent(cat.name)}`);
                                                }}
                                            >
                                                {cat.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link
                                to="/search"
                                className="py-3 px-4 rounded-lg transition font-semibold"
                                style={{ color: '#0d0a0b' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                    e.currentTarget.style.color = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#0d0a0b';
                                }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Browse Products
                            </Link>
                            <Link
                                to="/services"
                                className="py-3 px-4 rounded-lg transition font-semibold"
                                style={{ color: '#0d0a0b' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                    e.currentTarget.style.color = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#0d0a0b';
                                }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Browse Services
                            </Link>
                            <Link
                                to="/wishlist"
                                className="py-3 px-4 rounded-lg transition font-semibold relative flex items-center"
                                style={{ color: '#0d0a0b' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                    e.currentTarget.style.color = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#0d0a0b';
                                }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Wishlist
                                {wishlistCount > 0 && (
                                    <span
                                        className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none rounded-full absolute -top-2 -right-3"
                                        style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                                    >
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>
                            {!user ? (
                                <Link
                                    to="/auth"
                                    className="py-3 px-4 rounded-lg border transition font-semibold text-center"
                                    style={{
                                        borderColor: 'rgba(114, 176, 29, 0.6)',
                                        color: '#0d0a0b',
                                        backgroundColor: '#ffffff'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#0d0a0b';
                                    }}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiUser className="inline mr-2" /> Login / Register
                                </Link>
                            ) : (
                                <>
                                    <div
                                        className="flex items-center gap-3 py-3 px-2 rounded border"
                                        style={{
                                            backgroundColor: '#ffffff',
                                            borderColor: 'rgba(114, 176, 29, 0.3)'
                                        }}
                                    >
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt="Profile"
                                                className="w-9 h-9 rounded-full object-cover border"
                                                style={{ borderColor: 'rgba(114, 176, 29, 0.6)' }}
                                            />
                                        ) : (
                                            <span
                                                className="w-9 h-9 flex items-center justify-center rounded-full font-bold border text-lg"
                                                style={{
                                                    backgroundColor: '#ffffff',
                                                    color: '#0d0a0b',
                                                    borderColor: 'rgba(114, 176, 29, 0.6)'
                                                }}
                                            >
                                                {getInitials(user.displayName || user.email)}
                                            </span>
                                        )}
                                        <span className="font-semibold" style={{ color: '#0d0a0b' }}>
                                            {user.displayName || user.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            navigate("/dashboard");
                                        }}
                                        className="flex items-center gap-2 mt-4 py-3 px-2 rounded border transition uppercase font-medium"
                                        style={{
                                            borderColor: 'rgba(114, 176, 29, 0.6)',
                                            color: '#0d0a0b',
                                            backgroundColor: '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#72b01d';
                                            e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.color = '#0d0a0b';
                                        }}
                                    >
                                        <FiUser className="inline mr-2" /> Dashboard
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 mt-4 py-3 px-2 rounded border transition uppercase font-medium"
                                        style={{
                                            borderColor: 'rgba(114, 176, 29, 0.6)',
                                            color: '#0d0a0b',
                                            backgroundColor: '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#72b01d';
                                            e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.color = '#0d0a0b';
                                        }}
                                    >
                                        <FiLogOut className="inline mr-2" /> Logout
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                    <style>{`
            @keyframes slide-in {
              from { transform: translateX(100%);}
              to { transform: translateX(0);}
            }
            .animate-slide-in { animation: slide-in 0.3s cubic-bezier(.4,0,.2,1); }
          `}</style>
                </>
            )}
        </header>
    );
};

export default Header;
