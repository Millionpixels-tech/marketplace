import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { FiUser, FiShoppingBag, FiList, FiStar, FiMenu, FiX } from "react-icons/fi";
import Header from "../components/UI/Header";

const TABS = [
    { key: "profile", label: "Profile", icon: <FiUser /> },
    { key: "shops", label: "Shops", icon: <FiShoppingBag /> },
    { key: "orders", label: "Orders", icon: <FiList /> },
    { key: "reviews", label: "Reviews", icon: <FiStar /> },
    { key: "listings", label: "Listings", icon: <FiList /> }, // NEW
];

const ORDER_SUBTABS = [
    { key: "buyer", label: "As Buyer" },
    { key: "seller", label: "As Seller" },
];

const REVIEW_SUBTABS = [
    { key: "buyer", label: "As Buyer" },
    { key: "seller", label: "As Seller" },
];

export default function ProfileDashboard() {
    const { user } = useAuth();
    const { id } = useParams();
    const [shops, setShops] = useState<any[]>([]);
    const [desc, setDesc] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [uploadingPic, setUploadingPic] = useState(false);
    const [profileUid, setProfileUid] = useState<string | null>(null);
    const [profileEmail, setProfileEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Dashboard state
    const [selectedTab, setSelectedTab] = useState<"profile" | "shops" | "orders" | "reviews" | "listings">("profile");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [listings, setListings] = useState<any[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [listingsPage, setListingsPage] = useState(1); // <-- Pagination
    const LISTINGS_PER_PAGE = 8;

    const navigate = useNavigate();

    // Order sub-tabs
    const [orderSubTab, setOrderSubTab] = useState<"buyer" | "seller">("buyer");
    const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
    const [sellerOrders, setSellerOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Review sub-tabs
    const [reviewSubTab, setReviewSubTab] = useState<"buyer" | "seller">("buyer");
    const [buyerReviews, setBuyerReviews] = useState<any[]>([]);
    const [sellerReviews, setSellerReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const isOwner = user && profileUid === user?.uid;

    // Redirect non-owners to the listings page
    useEffect(() => {
        if (!loading && profileUid && user && profileUid !== user.uid) {
            navigate("/search", { replace: true });
        }
    }, [loading, profileUid, user, navigate]);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            let uid = user?.uid;
            if (id) uid = id;
            if (!uid) {
                setLoading(false);
                return;
            }
            setProfileUid(uid);
            // Fetch user record
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
            if (!userDoc.empty) {
                const data = userDoc.docs[0].data();
                setDisplayName(data.displayName || "");
                setPhotoURL(data.photoURL || "");
                setDesc(data.description || "");
                setProfileEmail(data.email || null);
            } else if (user && uid === user.uid) {
                setDisplayName(user.displayName || "");
                setPhotoURL(user.photoURL || "");
                setDesc("");
                setProfileEmail(user.email || null);
            }
            // Fetch shops for this user
            const q = query(collection(db, "shops"), where("owner", "==", uid));
            const docsSnap = await getDocs(q);
            setShops(docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchProfile();
    }, [user, id]);

    useEffect(() => {
        const fetchListings = async () => {
            if (selectedTab !== "listings" || !profileUid) return;
            setListingsLoading(true);
            try {
                const shopsQuery = query(collection(db, "shops"), where("owner", "==", profileUid));
                const shopsSnapshot = await getDocs(shopsQuery);
                const shopIds = shopsSnapshot.docs.map(doc => doc.id);
                if (shopIds.length === 0) {
                    setListings([]);
                    setListingsLoading(false);
                    return;
                }
                const listingsQuery = query(collection(db, "listings"), where("shopId", "in", shopIds));
                const listingsSnapshot = await getDocs(listingsQuery);
                setListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error loading listings:", err);
            } finally {
                setListingsLoading(false);
            }
        };
        fetchListings();
    }, [selectedTab, profileUid]);

    // Reset page on listings change
    useEffect(() => {
        setListingsPage(1);
    }, [listings]);

    // Orders fetching
    useEffect(() => {
        if (selectedTab !== "orders" || !profileUid) return;
        setOrdersLoading(true);
        const fetchOrders = async () => {
            const buyerSnap = await getDocs(query(collection(db, "orders"), where("buyerId", "==", profileUid)));
            setBuyerOrders(buyerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            const sellerSnap = await getDocs(query(collection(db, "orders"), where("sellerId", "==", profileUid)));
            setSellerOrders(sellerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setOrdersLoading(false);
        };
        fetchOrders();
    }, [selectedTab, profileUid]);

    // Reviews fetching
    useEffect(() => {
        if (selectedTab !== "reviews" || !profileUid) return;
        setReviewsLoading(true);
        const fetchReviews = async () => {
            // As Buyer: reviews given to this user in the role of buyer
            const buyerSnap = await getDocs(
                query(collection(db, "reviews"),
                    where("reviewedUserId", "==", profileUid),
                    where("role", "==", "buyer"))
            );
            setBuyerReviews(buyerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // As Seller: reviews given to this user in the role of seller
            const sellerSnap = await getDocs(
                query(collection(db, "reviews"),
                    where("reviewedUserId", "==", profileUid),
                    where("role", "==", "seller"))
            );
            setSellerReviews(sellerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setReviewsLoading(false);
        };
        fetchReviews();
    }, [selectedTab, profileUid]);

    const handleEditListing = (listingId: string) => {
        navigate(`/listing/${listingId}/edit`);
    };

    const handleDeleteListing = async (listingId: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
        if (!confirmDelete) return;
        try {
            await deleteDoc(doc(db, "listings", listingId));
            setListings(prev => prev.filter(l => l.id !== listingId));
        } catch (error) {
            console.error("Failed to delete listing:", error);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const auth = getAuth();
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: displayName,
                photoURL: photoURL,
            });
        }
        const userDocSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!userDocSnap.empty) {
            await updateDoc(doc(db, "users", userDocSnap.docs[0].id), { description: desc, displayName, photoURL });
        } else {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName,
                photoURL,
                description: desc,
            });
        }
        setEditing(false);
        setSaving(false);
    };

    const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;
        setUploadingPic(true);
        const file = e.target.files[0];
        const storage = getStorage();
        const fileRef = storageRef(storage, `profile_pics/${user.uid}_${Date.now()}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setPhotoURL(url);
        setUploadingPic(false);
    };

    // Pagination logic
    const totalListings = listings.length;
    const totalPages = Math.ceil(totalListings / LISTINGS_PER_PAGE);
    const paginatedListings = listings.slice(
        (listingsPage - 1) * LISTINGS_PER_PAGE,
        listingsPage * LISTINGS_PER_PAGE
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    if (!profileUid) return <div className="min-h-screen flex items-center justify-center text-gray-400">User not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen w-full">
            <Header />
            {/* Full width, no max-w */}
            <div className="flex flex-col md:flex-row gap-0 py-8 px-0 md:px-8 w-full">
                {/* Sidebar */}
                <aside className={`w-full md:w-64 bg-white border-r border-black/10 rounded-3xl md:rounded-r-none md:rounded-l-3xl shadow-md p-4 flex flex-row md:flex-col md:gap-2 gap-4 items-center md:items-start mb-6 md:mb-0 relative transition-all`}>
                    {/* Burger for mobile */}
                    <button
                        className="md:hidden absolute top-4 right-4 z-10"
                        onClick={() => setSidebarOpen(s => !s)}
                    >
                        {sidebarOpen ? <FiX size={26} /> : <FiMenu size={26} />}
                    </button>
                    {/* Sidebar Nav */}
                    <nav className={`flex-1 w-full flex ${sidebarOpen ? "flex" : "hidden"} md:flex flex-col gap-2 mt-8 md:mt-0`}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-lg transition-all
                  ${selectedTab === tab.key ? "bg-black text-white shadow" : "bg-gray-100 hover:bg-black hover:text-white text-black"}
                `}
                                onClick={() => { setSelectedTab(tab.key as any); setSidebarOpen(false); }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 w-full bg-white shadow-lg p-4 md:p-10 mx-auto">
                    {/* PROFILE TAB */}
                    {selectedTab === "profile" && (
                        <div className="flex flex-col items-center w-full">
                            {/* Profile Picture */}
                            <div className="w-28 h-28 rounded-full bg-gray-200 border-4 border-white shadow flex items-center justify-center overflow-hidden mb-4 relative group">
                                {photoURL ? (
                                    <img src={photoURL} alt="Profile" className="object-cover w-full h-full" />
                                ) : (
                                    <span className="text-4xl text-gray-500 font-bold">
                                        {displayName ? displayName[0] : user?.email ? user.email[0] : ''}
                                    </span>
                                )}
                                {isOwner && editing && (
                                    <>
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-white font-semibold">Change</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} disabled={uploadingPic} />
                                        </label>
                                        {uploadingPic && <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-black font-bold">Uploading...</div>}
                                    </>
                                )}
                            </div>
                            {/* Name */}
                            <div className="text-2xl font-black mb-2 text-center">
                                {isOwner && editing ? (
                                    <input
                                        className="text-2xl font-black text-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-1 w-full max-w-xs mb-2"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        maxLength={40}
                                    />
                                ) : (
                                    displayName || profileEmail
                                )}
                            </div>
                            {/* Description */}
                            <div className="w-full mb-6 flex flex-col items-center">
                                {isOwner && editing ? (
                                    <textarea
                                        className="w-full max-w-md bg-gray-50 border border-gray-300 rounded-xl p-3 text-lg text-center"
                                        rows={3}
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="Write something about yourself..."
                                        maxLength={300}
                                    />
                                ) : (
                                    <div className="text-gray-700 text-lg min-h-[48px] whitespace-pre-line text-center">{desc || <span className="text-gray-400">No description yet.</span>}</div>
                                )}
                            </div>
                            {/* Edit/Save Buttons */}
                            {isOwner && (
                                <div className="mb-8">
                                    {editing ? (
                                        <button
                                            className="px-6 py-2 bg-black text-white rounded-full font-semibold mr-2 disabled:opacity-50"
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                    ) : (
                                        <button
                                            className="px-6 py-2 bg-gray-200 text-black rounded-full font-semibold"
                                            onClick={() => setEditing(true)}
                                        >
                                            Edit Info
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SHOPS TAB */}
                    {selectedTab === "shops" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">{isOwner ? "Your Shops" : "Shops"}</h2>
                                {isOwner && (
                                    <Link
                                        to="/create-shop"
                                        className="px-5 py-2 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/90 transition text-sm"
                                    >
                                        Create New Shop
                                    </Link>
                                )}
                            </div>
                            {shops.length === 0 ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-gray-400">You have not created any shops yet.</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {shops.map(shop => (
                                        <div
                                            key={shop.id}
                                            className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 bg-gray-50 hover:bg-gray-100 transition"
                                        >
                                            {/* Shop link and image */}
                                            <Link
                                                to={`/shop/${shop.username}`}
                                                className="flex items-center gap-4 flex-1"
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                {shop.logo ? (
                                                    <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-bold">{shop.name[0]}</div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-lg">{shop.name}</div>
                                                    <div className="text-xs text-gray-500">@{shop.username}</div>
                                                </div>
                                            </Link>
                                            {isOwner && (
                                                <div className="flex flex-col gap-2 ml-2">
                                                    <button
                                                        onClick={() => navigate(`/edit-shop/${shop.id}`)}
                                                        className="px-3 py-1 bg-black text-white rounded hover:bg-yellow-600 text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const confirmDelete = window.confirm("Are you sure you want to delete this shop? This action cannot be undone.");
                                                            if (!confirmDelete) return;
                                                            try {
                                                                await deleteDoc(doc(db, "shops", shop.id));
                                                                setShops(prev => prev.filter(s => s.id !== shop.id));
                                                            } catch (err) {
                                                                alert("Failed to delete shop. Try again.");
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-black text-white rounded hover:bg-red-600 text-xs"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                </div>
                            )}
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {selectedTab === "orders" && (
                        <div>
                            <div className="flex gap-6 mb-6 border-b border-gray-200">
                                {ORDER_SUBTABS.map(subTab => (
                                    <button
                                        key={subTab.key}
                                        className={`py-3 px-6 font-bold text-base border-b-2 transition-all ${orderSubTab === subTab.key ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}
                                        onClick={() => setOrderSubTab(subTab.key as "buyer" | "seller")}
                                    >
                                        {subTab.label}
                                    </button>
                                ))}
                            </div>
                            {ordersLoading ? (
                                <div className="py-10 text-center text-gray-400">Loading orders...</div>
                            ) : (
                                <div>
                                    {/* As Buyer */}
                                    {orderSubTab === "buyer" && (
                                        <div>
                                            {buyerOrders.length === 0 ? (
                                                <div className="py-10 text-center text-gray-400">No orders as buyer yet.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {buyerOrders.map(order => (
                                                        <Link
                                                            to={`/order/${order.id}`}
                                                            key={order.id}
                                                            className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow hover:shadow-lg transition cursor-pointer"
                                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                                        >
                                                            <img
                                                                src={order.itemImage || '/placeholder.png'}
                                                                alt={order.itemName}
                                                                className="w-16 h-16 object-cover rounded-lg border"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-lg mb-1 truncate">{order.itemName}</div>
                                                                <div className="text-gray-700 text-sm mb-1">Status: <span className="font-semibold">{order.status}</span></div>
                                                                <div className="text-gray-600 text-xs truncate">Seller: {order.sellerName || order.sellerId}</div>
                                                            </div>
                                                            <div className="text-lg font-bold text-black self-end whitespace-nowrap">LKR {order.total?.toLocaleString()}</div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* As Seller */}
                                    {orderSubTab === "seller" && (
                                        <div>
                                            {sellerOrders.length === 0 ? (
                                                <div className="py-10 text-center text-gray-400">No orders as seller yet.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {sellerOrders.map(order => (
                                                        <div
                                                            key={order.id}
                                                            className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow hover:shadow-lg transition cursor-pointer"
                                                        >
                                                            <img
                                                                src={order.itemImage || '/placeholder.png'}
                                                                alt={order.itemName}
                                                                className="w-16 h-16 object-cover rounded-lg border"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-lg mb-1 truncate">{order.itemName}</div>
                                                                <div className="text-gray-700 text-sm mb-1">Status: <span className="font-semibold">{order.status}</span></div>
                                                                <div className="text-gray-600 text-xs truncate">Buyer: {order.buyerName || order.buyerId}</div>
                                                                <div className="flex gap-2 mt-2">
                                                                    <select
                                                                        className="border rounded px-2 py-1 text-xs"
                                                                        value={order.status}
                                                                        onChange={async (e) => {
                                                                            const newStatus = e.target.value;
                                                                            if (newStatus === "IN_PROGRESS" || newStatus === "SHIPPED") {
                                                                                await updateDoc(doc(db, "orders", order.id), { status: newStatus });
                                                                                setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                                                                            }
                                                                        }}
                                                                        disabled={order.status === "CANCELLED" || order.status === "RECEIVED"}
                                                                    >
                                                                        <option value="PENDING" disabled>Pending</option>
                                                                        <option value="IN_PROGRESS">In Progress</option>
                                                                        <option value="SHIPPED">Shipped</option>
                                                                    </select>
                                                                    <button
                                                                        className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            await updateDoc(doc(db, "orders", order.id), { status: "CANCELLED" });
                                                                            setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "CANCELLED" } : o));
                                                                        }}
                                                                        disabled={order.status === "CANCELLED" || order.status === "RECEIVED"}
                                                                    >
                                                                        Cancel Order
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <Link
                                                                to={`/order/${order.id}`}
                                                                className="text-lg font-bold text-black self-end whitespace-nowrap hover:underline ml-2"
                                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                                            >
                                                                LKR {order.total?.toLocaleString()}
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {selectedTab === "reviews" && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Your Seller Reviews</h2>
                            {reviewsLoading ? (
                                <div className="py-10 text-center text-gray-400">Loading reviews...</div>
                            ) : sellerReviews.length === 0 ? (
                                <div className="py-10 text-center text-gray-400">No reviews as seller yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {sellerReviews.map(r => (
                                        <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-base">{r.rating}★</span>
                                                <span className="text-gray-600 text-xs">{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-gray-800">{r.text}</div>
                                            {r.writtenByUserName && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    — {r.writtenByUserName}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* LISTINGS TAB WITH PAGINATION */}
                    {selectedTab === "listings" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Your Listings</h2>
                                <a
                                    href="/add-listing"
                                    className="inline-block px-5 py-2 bg-black text-white rounded-full font-semibold uppercase tracking-wide hover:bg-gray-900 transition text-sm"
                                >
                                    + Create New Listing
                                </a>
                            </div>
                            {listingsLoading ? (
                                <div className="py-10 text-center text-gray-400">Loading listings...</div>
                            ) : totalListings === 0 ? (
                                <div className="py-10 text-center text-gray-400">No listings found.</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {paginatedListings.map(listing => {
                                            const shop = shops.find(s => s.id === listing.shopId);
                                            return (
                                                <div
                                                    key={listing.id}
                                                    className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={listing.images?.[0] || "/placeholder.png"}
                                                            alt={listing.name}
                                                            className="w-16 h-16 object-cover rounded border"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-lg truncate">{listing.name}</h3>
                                                            <p className="text-xs text-gray-500 truncate mb-1">{shop ? shop.name : ''}</p>
                                                            <p className="text-sm text-gray-600 truncate">{listing.description}</p>
                                                            <p className="text-black font-bold mt-1">LKR {listing.price?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditListing(listing.id)}
                                                            className="px-4 bg-black text-white rounded hover:bg-yellow-600"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteListing(listing.id)}
                                                            className="px-4 py-2 bg-black text-white rounded hover:bg-red-600"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center mt-6 gap-2">
                                            <button
                                                className={`px-3 py-1 rounded ${listingsPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-300'}`}
                                                onClick={() => setListingsPage(p => Math.max(p - 1, 1))}
                                                disabled={listingsPage === 1}
                                            >
                                                Prev
                                            </button>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    className={`px-3 py-1 rounded font-semibold ${listingsPage === i + 1 ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-300'}`}
                                                    onClick={() => setListingsPage(i + 1)}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button
                                                className={`px-3 py-1 rounded ${listingsPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-300'}`}
                                                onClick={() => setListingsPage(p => Math.min(p + 1, totalPages))}
                                                disabled={listingsPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
