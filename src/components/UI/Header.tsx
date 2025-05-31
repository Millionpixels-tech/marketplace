import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { categories } from "../../utils/categories";
import { FiChevronDown, FiChevronRight, FiX, FiMenu, FiLogOut, FiUser } from "react-icons/fi";
import { getWishlistedItemIds } from "../../utils/wishlist";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../utils/firebase";

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
        async function fetchWishlist() {
            const ids = await getWishlistedItemIds(user?.uid);
            if (mounted) setWishlistCount(ids.length);
        }
        fetchWishlist();

        // Listen for custom event to update count live
        const handler = () => fetchWishlist();
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
        <header className="sticky top-0 z-30 w-full bg-white border-b border-black">
            <div className="flex items-center justify-between px-4 md:px-10 py-4 w-full">
                {/* Logo & Categories (Left) */}
                <div className="flex items-center gap-2 md:gap-6">
                    {/* Logo/Title */}
                    <Link to="/" className="text-2xl font-black tracking-tight uppercase">
                        <span className="hover:underline">
                            SriLanka<span className="font-light">Market</span>
                        </span>
                    </Link>
                    {/* Categories Dropdown */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setCatOpen((open) => !open)}
                            className="flex items-center px-4 py-2 rounded font-semibold border border-black hover:bg-black hover:text-white transition uppercase"
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
                                    className="absolute left-0 top-12 w-[340px] bg-white border border-black rounded-lg shadow-lg z-50"
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
                                                        className={`w-full flex items-center justify-between px-6 py-3 text-left font-semibold hover:bg-black hover:text-white transition ${subCatOpen === idx ? "bg-gray-100" : ""}`}
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
                                                        <ul className="pl-8 border-l border-black">
                                                            {cat.subcategories.map((sub) => (
                                                                <li key={sub}>
                                                                    <button
                                                                        className="w-full px-4 py-2 text-left font-light hover:bg-black hover:text-white transition"
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
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        to="/shops"
                        className="hover:underline text-lg uppercase font-light"
                    >
                        Shops
                    </Link>
                    <Link
                        to="/wishlist"
                        className="hover:underline text-lg uppercase font-light relative flex items-center"
                    >
                        Wishlist
                        {wishlistCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-black rounded-full absolute -top-2 -right-3">{wishlistCount}</span>
                        )}
                    </Link>
                    {/* Auth/User */}
                    <div className="flex items-center gap-2 ml-4 relative">
                        {loading ? null : !user ? (
                            <Link
                                to="/auth"
                                className="border border-black rounded-full px-5 py-2 font-semibold hover:bg-black hover:text-white uppercase transition"
                            >
                                Login / Register
                            </Link>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen((open) => !open)}
                                    className="flex items-center gap-2 rounded-full hover:bg-gray-100 px-2 py-1 transition"
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                >
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full object-cover border border-black"
                                        />
                                    ) : (
                                        <span className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-black font-bold border border-black text-lg">
                                            {getInitials(user.displayName || user.email)}
                                        </span>
                                    )}
                                    <span
                                        className="hidden sm:block font-semibold text-black max-w-[120px] truncate cursor-pointer hover:underline"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setUserMenuOpen(false);
                                            if (user?.uid) {
                                                navigate(`/profile/${user.uid}`);
                                            }
                                        }}
                                    >
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
                                        <div className="absolute right-0 top-12 w-48 bg-white border border-black rounded-lg shadow-lg z-50 flex flex-col">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 px-4 py-3 text-left font-semibold hover:bg-black hover:text-white transition"
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
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-black hover:bg-black hover:text-white transition"
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
                        className="fixed inset-0 z-40 bg-black/20"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="fixed top-0 right-0 w-4/5 max-w-xs h-full bg-white border-l border-black z-50 flex flex-col pt-6 px-6 pb-8 shadow-xl animate-slide-in">
                        {/* Close */}
                        <button
                            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Close menu"
                        >
                            <FiX size={22} />
                        </button>
                        {/* Links */}
                        <nav className="flex flex-col gap-4 mt-10">
                            <button
                                className="flex items-center w-full justify-between font-semibold py-3 px-2 rounded hover:bg-black hover:text-white transition uppercase"
                                onClick={() => setCatOpen((open) => !open)}
                            >
                                Categories <FiChevronDown className="ml-2" />
                            </button>
                            {/* Categories Drawer in Mobile */}
                            {catOpen && (
                                <ul className="mb-2 bg-gray-50 rounded-lg border border-black/20 p-2">
                                    {categories.map((cat, idx) => (
                                        <li key={cat.name} className="mb-1">
                                            <button
                                                className="w-full text-left px-3 py-2 rounded hover:bg-black hover:text-white transition font-medium"
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
                                to="/shops"
                                className="py-3 px-2 rounded hover:bg-black hover:text-white transition uppercase font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Shops
                            </Link>
                            <Link
                                to="/wishlist"
                                className="py-3 px-2 rounded hover:bg-black hover:text-white transition uppercase font-medium relative flex items-center"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Wishlist
                                {wishlistCount > 0 && (
                                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-black rounded-full absolute -top-2 -right-3">{wishlistCount}</span>
                                )}
                            </Link>
                            {!user ? (
                                <Link
                                    to="/auth"
                                    className="py-3 px-2 rounded border border-black hover:bg-black hover:text-white transition uppercase font-medium text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiUser className="inline mr-2" /> Login / Register
                                </Link>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 py-3 px-2 rounded bg-gray-50 border border-black/20">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt="Profile"
                                                className="w-9 h-9 rounded-full object-cover border border-black"
                                            />
                                        ) : (
                                            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-black font-bold border border-black text-lg">
                                                {getInitials(user.displayName || user.email)}
                                            </span>
                                        )}
                                        <span className="font-semibold">{user.displayName || user.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 mt-4 py-3 px-2 rounded border border-black hover:bg-black hover:text-white transition uppercase font-medium"
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
