import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, limit, getDoc } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import { hasAdminAccess } from "../../utils/adminConfig";
import { FiSearch, FiTrash2, FiUser, FiPackage, FiShoppingBag, FiAlertTriangle, FiExternalLink } from "react-icons/fi";

interface User {
    id: string;
    email: string;
    displayName?: string;
    createdAt?: any;
}

interface Listing {
    id: string;
    name: string;
    price: number;
    shopId?: string;
    shopName?: string;
    shopUsername?: string;
    images?: string[];
    createdAt?: any;
}

interface Shop {
    id: string;
    name: string;
    username: string;
    owner: string;
    ownerEmail?: string;
    description?: string;
    createdAt?: any;
}

type SearchType = 'users' | 'listings' | 'shops';

interface DeleteModalData {
    isOpen: boolean;
    type: SearchType | null;
    item: any;
    itemName: string;
}

export default function AdminManagement() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Search state
    const [searchType, setSearchType] = useState<SearchType>('users');
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Delete modal state
    const [deleteModal, setDeleteModal] = useState<DeleteModalData>({
        isOpen: false,
        type: null,
        item: null,
        itemName: ""
    });

    // Check if user is logged in
    useEffect(() => {
        if (!user) {
            navigate("/auth");
        }
    }, [user, navigate]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hasAdminAccess(password)) {
            setIsAuthenticated(true);
            setAuthError("");
        } else {
            setAuthError("Invalid password");
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setSearching(true);
        setHasSearched(true);
        
        try {
            let results: any[] = [];

            if (searchType === 'users') {
                results = await searchUsers(searchQuery.trim());
            } else if (searchType === 'listings') {
                results = await searchListings(searchQuery.trim());
            } else if (searchType === 'shops') {
                results = await searchShops(searchQuery.trim());
            }

            setSearchResults(results);
        } catch (error) {
            console.error("Error searching:", error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const searchUsers = async (searchTerm: string): Promise<User[]> => {
        const users: User[] = [];
        
        // Search by email (exact prefix match)
        const emailQuery = query(
            collection(db, "users"),
            where("email", ">=", searchTerm.toLowerCase()),
            where("email", "<=", searchTerm.toLowerCase() + '\uf8ff'),
            limit(20)
        );
        const emailSnap = await getDocs(emailQuery);
        
        emailSnap.docs.forEach(docRef => {
            const userData = docRef.data() as DocumentData;
            users.push({ id: docRef.id, ...userData } as User);
        });

        // Search by display name if no email results (exact prefix match)
        if (users.length === 0) {
            const nameQuery = query(
                collection(db, "users"),
                where("displayName", ">=", searchTerm),
                where("displayName", "<=", searchTerm + '\uf8ff'),
                limit(20)
            );
            const nameSnap = await getDocs(nameQuery);
            
            nameSnap.docs.forEach(docRef => {
                const userData = docRef.data() as DocumentData;
                users.push({ id: docRef.id, ...userData } as User);
            });
        }

        // If no exact matches, do case-insensitive fallback search
        if (users.length === 0) {
            try {
                const allUsersQuery = query(collection(db, "users"), limit(100));
                const docSnap = await getDocs(allUsersQuery);
                const searchTermLower = searchTerm.toLowerCase();
                
                docSnap.docs.forEach(docRef => {
                    const userData = docRef.data() as DocumentData;
                    if (docRef.id.toLowerCase().includes(searchTermLower) || 
                        userData.email?.toLowerCase().includes(searchTermLower) || 
                        userData.displayName?.toLowerCase().includes(searchTermLower)) {
                        users.push({ id: docRef.id, ...userData } as User);
                        
                        // Limit results
                        if (users.length >= 20) return;
                    }
                });
            } catch (error) {
                console.error("Error searching users:", error);
            }
        }

        return users;
    };

    const searchListings = async (searchTerm: string): Promise<Listing[]> => {
        const listings: Listing[] = [];
        
        // Search by name (case-sensitive exact prefix)
        const nameQuery = query(
            collection(db, "listings"),
            where("name", ">=", searchTerm),
            where("name", "<=", searchTerm + '\uf8ff'),
            limit(20)
        );
        const nameSnap = await getDocs(nameQuery);
        
        for (const docRef of nameSnap.docs) {
            const listingData = docRef.data() as DocumentData;
            const listing = { id: docRef.id, ...listingData } as Listing;
            // Get shop name if shopId exists
            if (listing.shopId) {
                try {
                    const shopDocRef = doc(db, "shops", listing.shopId);
                    const shopDoc = await getDoc(shopDocRef);
                    if (shopDoc.exists()) {
                        const shopData = shopDoc.data() as DocumentData;
                        listing.shopName = shopData.name;
                        listing.shopUsername = shopData.username;
                    }
                } catch (error) {
                    console.error("Error fetching shop name:", error);
                }
            }
            listings.push(listing);
        }

        // If no exact matches found or searching with small keywords, do case-insensitive search
        if (listings.length === 0) {
            try {
                const allListingsQuery = query(collection(db, "listings"), limit(100));
                const docSnap = await getDocs(allListingsQuery);
                for (const docRef of docSnap.docs) {
                    const listingData = docRef.data() as DocumentData;
                    const searchTermLower = searchTerm.toLowerCase();
                    
                    // Check if ID contains search term or name contains search term (case-insensitive)
                    if (docRef.id.toLowerCase().includes(searchTermLower) || 
                        listingData.name?.toLowerCase().includes(searchTermLower)) {
                        
                        const listing = { id: docRef.id, ...listingData } as Listing;
                        
                        // Get shop name if shopId exists
                        if (listing.shopId) {
                            try {
                                const shopDocRef = doc(db, "shops", listing.shopId);
                                const shopDoc = await getDoc(shopDocRef);
                                if (shopDoc.exists()) {
                                    const shopData = shopDoc.data() as DocumentData;
                                    listing.shopName = shopData.name;
                                    listing.shopUsername = shopData.username;
                                }
                            } catch (error) {
                                console.error("Error fetching shop name:", error);
                            }
                        }
                        listings.push(listing);
                        
                        // Limit results to avoid too many matches
                        if (listings.length >= 20) break;
                    }
                }
            } catch (error) {
                console.error("Error searching listings:", error);
            }
        }

        return listings;
    };

    const searchShops = async (searchTerm: string): Promise<Shop[]> => {
        const shops: Shop[] = [];
        
        // Search by name (exact prefix match)
        const nameQuery = query(
            collection(db, "shops"),
            where("name", ">=", searchTerm),
            where("name", "<=", searchTerm + '\uf8ff'),
            limit(20)
        );
        const nameSnap = await getDocs(nameQuery);
        
        for (const docRef of nameSnap.docs) {
            const shopData = docRef.data() as DocumentData;
            const shop = { id: docRef.id, ...shopData } as Shop;
            // Get owner email
            if (shop.owner) {
                try {
                    const ownerDocRef = doc(db, "users", shop.owner);
                    const ownerDoc = await getDoc(ownerDocRef);
                    if (ownerDoc.exists()) {
                        const ownerData = ownerDoc.data() as DocumentData;
                        shop.ownerEmail = ownerData.email;
                    }
                } catch (error) {
                    console.error("Error fetching owner email:", error);
                }
            }
            shops.push(shop);
        }

        // Search by username if no name results (exact prefix match)
        if (shops.length === 0) {
            const usernameQuery = query(
                collection(db, "shops"),
                where("username", ">=", searchTerm.toLowerCase()),
                where("username", "<=", searchTerm.toLowerCase() + '\uf8ff'),
                limit(20)
            );
            const usernameSnap = await getDocs(usernameQuery);
            
            for (const docRef of usernameSnap.docs) {
                const shopData = docRef.data() as DocumentData;
                const shop = { id: docRef.id, ...shopData } as Shop;
                if (shop.owner) {
                    try {
                        const ownerDocRef = doc(db, "users", shop.owner);
                        const ownerDoc = await getDoc(ownerDocRef);
                        if (ownerDoc.exists()) {
                            const ownerData = ownerDoc.data() as DocumentData;
                            shop.ownerEmail = ownerData.email;
                        }
                    } catch (error) {
                        console.error("Error fetching owner email:", error);
                    }
                }
                shops.push(shop);
            }
        }

        // If no exact matches, do case-insensitive fallback search
        if (shops.length === 0) {
            try {
                const allShopsQuery = query(collection(db, "shops"), limit(100));
                const docSnap = await getDocs(allShopsQuery);
                const searchTermLower = searchTerm.toLowerCase();
                
                for (const docRef of docSnap.docs) {
                    const shopData = docRef.data() as DocumentData;
                    if (docRef.id.toLowerCase().includes(searchTermLower) || 
                        shopData.name?.toLowerCase().includes(searchTermLower) ||
                        shopData.username?.toLowerCase().includes(searchTermLower)) {
                        
                        const shop = { id: docRef.id, ...shopData } as Shop;
                        
                        // Get owner email
                        if (shop.owner) {
                            try {
                                const ownerDocRef = doc(db, "users", shop.owner);
                                const ownerDoc = await getDoc(ownerDocRef);
                                if (ownerDoc.exists()) {
                                    const ownerData = ownerDoc.data() as DocumentData;
                                    shop.ownerEmail = ownerData.email;
                                }
                            } catch (error) {
                                console.error("Error fetching owner email:", error);
                            }
                        }
                        shops.push(shop);
                        
                        // Limit results
                        if (shops.length >= 20) break;
                    }
                }
            } catch (error) {
                console.error("Error searching shops:", error);
            }
        }

        return shops;
    };

    const openDeleteModal = (type: SearchType, item: any) => {
        let itemName = "";
        if (type === 'users') {
            itemName = item.email || item.displayName || "Unknown User";
        } else if (type === 'listings') {
            itemName = item.name || "Unknown Listing";
        } else if (type === 'shops') {
            itemName = item.name || "Unknown Shop";
        }

        setDeleteModal({
            isOpen: true,
            type,
            item,
            itemName
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            isOpen: false,
            type: null,
            item: null,
            itemName: ""
        });
    };

    const handleDelete = async () => {
        if (!deleteModal.item || !deleteModal.type) return;

        setLoading(true);
        try {
            if (deleteModal.type === 'listings') {
                await deleteDoc(doc(db, "listings", deleteModal.item.id));
                setSearchResults(prev => prev.filter(item => item.id !== deleteModal.item.id));
            } else if (deleteModal.type === 'shops') {
                // Delete shop and all related listings and reviews
                const shopId = deleteModal.item.id;
                
                console.log(`Starting deletion of shop: ${shopId}`);
                
                // Delete all listings
                console.log('Fetching listings to delete...');
                const listingsQuery = query(collection(db, "listings"), where("shopId", "==", shopId));
                const listingsSnap = await getDocs(listingsQuery);
                console.log(`Found ${listingsSnap.docs.length} listings to delete`);
                
                const deleteListingsPromises = listingsSnap.docs.map(docRef => {
                    console.log(`Deleting listing: ${docRef.id}`);
                    return deleteDoc(docRef.ref);
                });
                
                // Delete all reviews
                console.log('Fetching reviews to delete...');
                const reviewsQuery = query(collection(db, "reviews"), where("shopId", "==", shopId));
                const reviewsSnap = await getDocs(reviewsQuery);
                console.log(`Found ${reviewsSnap.docs.length} reviews to delete`);
                
                const deleteReviewsPromises = reviewsSnap.docs.map(docRef => {
                    console.log(`Deleting review: ${docRef.id}`);
                    return deleteDoc(docRef.ref);
                });
                
                // Execute all deletions in parallel
                console.log('Executing all deletions...');
                await Promise.all([...deleteListingsPromises, ...deleteReviewsPromises]);
                
                // Delete shop last
                console.log(`Deleting shop: ${shopId}`);
                await deleteDoc(doc(db, "shops", shopId));
                
                console.log('Shop deletion completed successfully');
                setSearchResults(prev => prev.filter(item => item.id !== shopId));
            } else if (deleteModal.type === 'users') {
                // Note: In a real app, you'd want to be very careful about deleting users
                // as it may have cascading effects. For now, we'll just delete the user document.
                await deleteDoc(doc(db, "users", deleteModal.item.id));
                setSearchResults(prev => prev.filter(item => item.id !== deleteModal.item.id));
            }

            closeDeleteModal();
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Clear search when type changes
    useEffect(() => {
        setSearchQuery("");
        setSearchResults([]);
        setHasSearched(false);
    }, [searchType]);

    if (!user) {
        return <div>Please log in to access this page.</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ResponsiveHeader />
                <div className="max-w-md mx-auto pt-20">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: '#0d0a0b' }}>
                            Admin Management Dashboard
                        </h1>
                        <p className="text-sm text-gray-600 mb-4 text-center">
                            This is a restricted area. Please enter the admin password to continue.
                        </p>
                        
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#454955' }}>
                                    Admin Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                                    style={{ borderColor: 'rgba(114, 176, 29, 0.3)', color: '#454955' }}
                                    placeholder="Enter admin password"
                                    required
                                />
                            </div>
                            
                            {authError && (
                                <div className="text-red-600 text-sm text-center">
                                    {authError}
                                </div>
                            )}
                            
                            <button
                                type="submit"
                                className="w-full py-2 px-4 rounded-lg font-medium text-white transition duration-200"
                                style={{ backgroundColor: '#72b01d' }}
                            >
                                Access Dashboard
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ResponsiveHeader />
            <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                        Admin Management Dashboard
                    </h1>
                    <p className="text-sm" style={{ color: '#454955' }}>
                        Search and manage users, listings, and shops
                    </p>
                </div>

                {/* Admin Navigation */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <div className="flex gap-4">
                        <a 
                            href="/admin/payments"
                            className="px-4 py-2 rounded-lg font-medium transition duration-200 hover:bg-gray-100"
                            style={{ color: '#454955' }}
                        >
                            Payment Dashboard
                        </a>
                        <div className="px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', color: '#72b01d' }}>
                            User Management
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4" style={{ color: '#0d0a0b' }}>
                        Search & Manage
                    </h2>
                    
                    {/* Search Type Tabs */}
                    <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                        {[
                            { type: 'users' as SearchType, label: 'Users', icon: FiUser },
                            { type: 'listings' as SearchType, label: 'Listings', icon: FiPackage },
                            { type: 'shops' as SearchType, label: 'Shops', icon: FiShoppingBag }
                        ].map(({ type, label, icon: Icon }) => (
                            <button
                                key={type}
                                onClick={() => setSearchType(type)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition duration-200 ${
                                    searchType === type
                                        ? 'bg-white shadow-sm'
                                        : 'hover:bg-white hover:bg-opacity-50'
                                }`}
                                style={{
                                    color: searchType === type ? '#72b01d' : '#454955'
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#454955' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={`Search ${searchType} by name, email, or ID...`}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                                style={{ borderColor: 'rgba(114, 176, 29, 0.3)', color: '#454955' }}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={searching || !searchQuery.trim()}
                            className="px-6 py-2 rounded-lg font-medium text-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#72b01d' }}
                        >
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Search Results */}
                {hasSearched && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b" style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                            <h2 className="text-xl font-bold" style={{ color: '#0d0a0b' }}>
                                Search Results ({searchResults.length})
                            </h2>
                        </div>
                        
                        {searchResults.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                        <tr>
                                            {searchType === 'users' && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Actions</th>
                                                </>
                                            )}
                                            {searchType === 'listings' && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Listing</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Price</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Shop</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Actions</th>
                                                </>
                                            )}
                                            {searchType === 'shops' && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Shop</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Username</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Owner</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                        {searchResults.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                {searchType === 'users' && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <a 
                                                                href={`/profile/${item.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium hover:underline flex items-center gap-1"
                                                                style={{ color: '#72b01d' }}
                                                            >
                                                                {item.displayName || 'No Name'}
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                {item.email}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-mono" style={{ color: '#454955' }}>
                                                                {item.id}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => openDeleteModal('users', item)}
                                                                className="text-red-600 hover:text-red-800 transition duration-200"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                                {searchType === 'listings' && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                {item.images && item.images[0] && (
                                                                    <img src={item.images[0]} alt="" className="w-10 h-10 rounded-md object-cover mr-3" />
                                                                )}
                                                                <div>
                                                                    <a 
                                                                        href={`/listing/${item.id}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-sm font-medium hover:underline flex items-center gap-1"
                                                                        style={{ color: '#72b01d' }}
                                                                    >
                                                                        {item.name}
                                                                        <FiExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium" style={{ color: '#3f7d20' }}>
                                                                LKR {item.price?.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.shopName && item.shopId ? (
                                                                <a 
                                                                    href={`/shop/${item.shopUsername || item.shopId}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm hover:underline flex items-center gap-1"
                                                                    style={{ color: '#72b01d' }}
                                                                >
                                                                    {item.shopName}
                                                                    <FiExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <div className="text-sm" style={{ color: '#454955' }}>
                                                                    {item.shopName || 'No Shop'}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-mono" style={{ color: '#454955' }}>
                                                                {item.id}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => openDeleteModal('listings', item)}
                                                                className="text-red-600 hover:text-red-800 transition duration-200"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                                {searchType === 'shops' && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <a 
                                                                href={`/shop/${item.username}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium hover:underline flex items-center gap-1"
                                                                style={{ color: '#72b01d' }}
                                                            >
                                                                {item.name}
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                @{item.username}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <a 
                                                                href={`/profile/${item.owner}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm hover:underline flex items-center gap-1"
                                                                style={{ color: '#72b01d' }}
                                                            >
                                                                {item.ownerEmail || 'Unknown'}
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-mono" style={{ color: '#454955' }}>
                                                                {item.id}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => openDeleteModal('shops', item)}
                                                                className="text-red-600 hover:text-red-800 transition duration-200"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center" style={{ color: '#454955' }}>
                                No {searchType} found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModal.isOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    >
                        <div 
                            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border"
                            style={{ borderColor: 'rgba(220, 38, 38, 0.3)' }}
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                                    <FiAlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold" style={{ color: '#0d0a0b' }}>
                                    Confirm Deletion
                                </h3>
                            </div>
                            
                            <p className="text-sm mb-6" style={{ color: '#454955' }}>
                                Are you sure you want to delete "{deleteModal.itemName}"?
                                {deleteModal.type === 'shops' && (
                                    <>
                                        <br /><br />
                                        <span className="font-semibold text-red-600">⚠️ Warning: This will permanently delete:</span>
                                        <br />• The shop "{deleteModal.itemName}"
                                        <br />• All listings belonging to this shop
                                        <br />• All reviews for this shop
                                        <br /><br />
                                        <span className="font-semibold">This action cannot be undone.</span>
                                    </>
                                )}
                                {deleteModal.type === 'listings' && (
                                    <>
                                        <br /><br />
                                        This will permanently delete the listing "{deleteModal.itemName}".
                                        <br /><br />
                                        <span className="font-semibold">This action cannot be undone.</span>
                                    </>
                                )}
                                {deleteModal.type === 'users' && (
                                    <>
                                        <br /><br />
                                        <span className="font-semibold text-red-600">⚠️ Warning:</span> Deleting a user may affect order history and other data.
                                        <br /><br />
                                        <span className="font-semibold">This action cannot be undone.</span>
                                    </>
                                )}
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={closeDeleteModal}
                                    className="flex-1 px-4 py-2 border rounded-lg font-medium transition duration-200"
                                    style={{ borderColor: 'rgba(114, 176, 29, 0.3)', color: '#454955' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                                >
                                    {loading ? (
                                        deleteModal.type === 'shops' ? 'Deleting Shop & Listings...' : 'Deleting...'
                                    ) : (
                                        deleteModal.type === 'shops' ? 'Delete Shop & All Listings' : 'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                    >
                        Logout from Admin
                    </button>
                </div>
            </div>
        </div>
    );
}
