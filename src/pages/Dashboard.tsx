
import { useEffect, useState } from "react";
import OrderSellerRow from "./OrderSellerRow";
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
    { key: "listings", label: "Listings", icon: <FiList /> },
    { key: "payments", label: "Payments", icon: <FiStar /> },
    { key: "settings", label: "Settings", icon: <FiUser /> },
];

const ORDER_SUBTABS = [
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
    // Settings form state
    const [bankForm, setBankForm] = useState({ accountNumber: '', branch: '', bankName: '', fullName: '' });
    const [verifyForm, setVerifyForm] = useState({ fullName: '', idFront: null as File | null, idBack: null as File | null, selfie: null as File | null, address: '', idFrontUrl: '', idBackUrl: '', selfieUrl: '', isVerified: 'PENDING' });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    // Handlers for saving (implement Firestore logic as needed)
    // Helper: upload file to Firebase Storage and return URL
    const uploadFile = async (file: File, path: string) => {
        const storage = getStorage();
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    // Save all settings at once
    const handleSaveAllSettings = async () => {
        setSettingsLoading(true); setSettingsSuccess(null); setSettingsError(null);
        try {


            // Bank Details
            if (!user?.uid) throw new Error('No user');
            await updateDoc(doc(db, 'users', user.uid), {
                bankDetails: { ...bankForm }
            });

            // Verification Info
            let idFrontUrl = verifyForm.idFrontUrl;
            let idBackUrl = verifyForm.idBackUrl;
            let selfieUrl = verifyForm.selfieUrl;
            if (verifyForm.idFront) {
                idFrontUrl = await uploadFile(verifyForm.idFront, `users/${user.uid}/idFront.jpg`);
            }
            if (verifyForm.idBack) {
                idBackUrl = await uploadFile(verifyForm.idBack, `users/${user.uid}/idBack.jpg`);
            }
            if (verifyForm.selfie) {
                selfieUrl = await uploadFile(verifyForm.selfie, `users/${user.uid}/selfie.jpg`);
            }
            await updateDoc(doc(db, 'users', user.uid), {
                verification: {
                    isVerified: verifyForm.isVerified,
                    fullName: verifyForm.fullName,
                    idFrontUrl: idFrontUrl || '',
                    idBackUrl: idBackUrl || '',
                    selfieUrl: selfieUrl || '',
                    address: verifyForm.address,
                }
            });
            setVerifyForm(f => ({ ...f, idFront: null, idBack: null, selfie: null, idFrontUrl, idBackUrl, selfieUrl, isVerified: verifyForm.isVerified }));

            setSettingsSuccess('All settings saved!');
        } catch (e: any) {
            setSettingsError(e.message || 'Failed to save settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    // Dashboard state
    const [selectedTab, setSelectedTab] = useState<"profile" | "shops" | "orders" | "reviews" | "listings" | "payments" | "settings">("profile");

    // Payments state
    const [payments, setPayments] = useState<any[]>([]);
    // Bank details state
    // Payments fetching
    useEffect(() => {
        if (selectedTab !== "payments" || !profileUid) return;
        // Fetch only last 14 days orders for payments calculation
        const fetchPayments = async () => {
            try {
                const now = new Date();
                const cutoff = new Date(now.getTime());
                //const cutoffTimestamp = Math.floor(cutoff.getTime() / 1000);
                const q = query(
                    collection(db, "orders"),
                    where("sellerId", "==", profileUid),
                    where("createdAt", "<=", cutoff)
                );
                const snap = await getDocs(q);
                const validStatuses = ["RECEIVED"];
                const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log("Fetched payments:", orders);
                setPayments(orders.filter((o: any) => validStatuses.includes(o.status)));
            } catch (err) {
                console.error("Error loading payments:", err);
                setPayments([]);
            } finally {
            }
        };
        // Fetch bank details (placeholder, replace with Firestore logic)
        const fetchBankDetails = async () => {
            // Example: fetch from users collection
            // const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", profileUid)));
            // if (!userSnap.empty) setBankDetails(userSnap.docs[0].data().bankDetails || null);
        };
        fetchPayments();
        fetchBankDetails();
    }, [selectedTab, profileUid]);

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
                // Load bank details
                if (data.bankDetails) setBankForm(data.bankDetails);
                // Load verification info
                if (data.verification) setVerifyForm(f => ({
                    ...f,
                    ...data.verification,
                    idFront: null,
                    idBack: null,
                    selfie: null,
                    idFrontUrl: data.verification.idFrontUrl || '',
                    idBackUrl: data.verification.idBackUrl || '',
                    selfieUrl: data.verification.selfieUrl || '',
                }));
            } else if (user && uid === user.uid) {
                setDisplayName(user.displayName || "");
                setPhotoURL(user.photoURL || "");
                setDesc("");
                setProfileEmail(user.email || null);
            }
            // Fetch shops for this user
            const q = query(collection(db, "shops"), where("owner", "==", uid));
            const docsSnap = await getDocs(q);
            const shopList = docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setShops(shopList);
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

    if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955' }}>Loading...</div>;
    if (!profileUid) return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955' }}>User not found.</div>;

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: '#ffffff' }}>
            <Header />
            {/* Full width, no max-w */}
            <div className="flex flex-col md:flex-row gap-0 py-8 px-0 md:px-8 w-full">
                {/* Sidebar */}
                <aside className={`w-full md:w-64 min-h-screen border-r rounded-3xl md:rounded-r-none md:rounded-l-3xl shadow-lg p-6 flex flex-row md:flex-col md:gap-4 gap-4 items-center md:items-start mb-6 md:mb-0 relative transition-all`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
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
                                className={`group flex items-center gap-3 px-5 py-3 rounded-full font-semibold text-base transition-all relative overflow-hidden border`}
                                style={{
                                    backgroundColor: selectedTab === tab.key ? '#72b01d' : '#ffffff',
                                    color: selectedTab === tab.key ? '#ffffff' : '#454955',
                                    borderColor: selectedTab === tab.key ? '#72b01d' : 'rgba(114, 176, 29, 0.3)',
                                    boxShadow: selectedTab === tab.key ? '0 2px 8px 0 rgba(114, 176, 29, 0.3)' : undefined
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedTab !== tab.key) {
                                        e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                        e.currentTarget.style.borderColor = '#72b01d';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedTab !== tab.key) {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                    }
                                }}
                                onClick={() => { setSelectedTab(tab.key as any); setSidebarOpen(false); }}
                            >
                                <span className={`transition-all`} style={{
                                    color: selectedTab === tab.key ? '#ffffff' : '#454955',
                                    transform: selectedTab === tab.key ? 'scale(1.1)' : 'scale(1)',
                                    opacity: selectedTab === tab.key ? 1 : 0.7
                                }}>{tab.icon}</span>
                                <span className="truncate">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 w-full shadow-lg p-4 md:p-10 mx-auto border rounded-2xl" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    {/* PROFILE TAB */}
                    {selectedTab === "profile" && (
                        <div className="flex flex-col items-center w-full">
                            {/* Profile Picture */}
                            <div className="w-28 h-28 rounded-full border-4 shadow flex items-center justify-center overflow-hidden mb-4 relative group" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: '#72b01d' }}>
                                {photoURL ? (
                                    <img src={photoURL} alt="Profile" className="object-cover w-full h-full" />
                                ) : (
                                    <><span className="text-4xl font-bold" style={{ color: '#454955' }}>
                                        {displayName ? displayName[0] : user?.email ? user.email[0] : ''}
                                    </span></>
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
                            <div className="text-2xl font-black mb-2 text-center flex items-center justify-center gap-2" style={{ color: '#0d0a0b' }}>
                                {isOwner && editing ? (
                                    <input
                                        className="text-2xl font-black text-center border rounded-xl px-3 py-1 w-full max-w-xs mb-2"
                                        style={{ backgroundColor: 'rgba(243, 239, 245, 0.8)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#0d0a0b' }}
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        maxLength={40}
                                    />
                                ) : (
                                    <>
                                        <span>{displayName || profileEmail}</span>
                                        {verifyForm.isVerified === 'COMPLETED' && (
                                            <span className="inline-flex items-center justify-center ml-2 rounded-full w-6 h-6" style={{ backgroundColor: '#72b01d' }}>
                                                <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div className="w-full mb-6 flex flex-col items-center">
                                {isOwner && editing ? (
                                    <textarea
                                        className="w-full max-w-md border rounded-xl p-3 text-lg text-center"
                                        style={{ backgroundColor: 'rgba(243, 239, 245, 0.8)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#454955' }}
                                        rows={3}
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="Write something about yourself..."
                                        maxLength={300}
                                    />
                                ) : (
                                    <div className="text-lg min-h-[48px] whitespace-pre-line text-center" style={{ color: '#454955' }}>{desc || <span style={{ color: '#454955', opacity: 0.6 }}>No description yet.</span>}</div>
                                )}
                            </div>
                            {/* Edit/Save Buttons */}
                            {isOwner && (
                                <div className="mb-8">
                                    {editing ? (
                                        <button
                                            className="px-6 py-2 rounded-full font-semibold mr-2 disabled:opacity-50 transition"
                                            style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                                            onMouseEnter={(e) => {
                                                if (!saving) {
                                                    e.currentTarget.style.backgroundColor = '#3f7d20';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!saving) {
                                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                                }
                                            }}
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                    ) : (
                                        <button
                                            className="px-6 py-2 rounded-full font-semibold transition border"
                                            style={{ backgroundColor: '#ffffff', color: '#454955', borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                                e.currentTarget.style.borderColor = '#72b01d';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                            }}
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
                                <h2 className="text-xl font-bold" style={{ color: '#0d0a0b' }}>{isOwner ? "Your Shops" : "Shops"}</h2>
                                {isOwner && (
                                    <Link
                                        to="/create-shop"
                                        className="px-5 py-2 rounded-full font-bold uppercase tracking-wide shadow transition text-sm"
                                        style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#3f7d20';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#72b01d';
                                        }}
                                    >
                                        Create New Shop
                                    </Link>
                                )}
                            </div>
                            {shops.length === 0 ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-center" style={{ color: '#454955', opacity: 0.7 }}>You have not created any shops yet.</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {shops.map(shop => (
                                        <div
                                            key={shop.id}
                                            className="border rounded-xl p-4 flex items-center gap-4 transition"
                                            style={{
                                                backgroundColor: '#ffffff',
                                                borderColor: 'rgba(114, 176, 29, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.05)';
                                                e.currentTarget.style.borderColor = '#72b01d';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                            }}
                                        >
                                            {/* Shop link and image */}
                                            <Link
                                                to={`/shop/${shop.username}`}
                                                className="flex items-center gap-4 flex-1"
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                {shop.logo ? (
                                                    <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover border" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', color: '#454955', borderColor: 'rgba(114, 176, 29, 0.3)' }}>{shop.name[0]}</div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-lg" style={{ color: '#0d0a0b' }}>{shop.name}</div>
                                                    <div className="text-xs" style={{ color: '#454955' }}>@{shop.username}</div>
                                                </div>
                                            </Link>
                                            {isOwner && (
                                                <div className="flex flex-col gap-2 ml-2">
                                                    <button
                                                        onClick={() => navigate(`/edit-shop/${shop.id}`)}
                                                        className="px-3 py-1 rounded text-xs font-semibold transition border"
                                                        style={{ backgroundColor: '#72b01d', color: '#ffffff', borderColor: '#72b01d' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#3f7d20';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#72b01d';
                                                        }}
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
                                                        className="px-3 py-1 rounded text-xs font-semibold transition border"
                                                        style={{ backgroundColor: '#ffffff', color: '#454955', borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#ffebee';
                                                            e.currentTarget.style.color = '#c62828';
                                                            e.currentTarget.style.borderColor = '#c62828';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                                            e.currentTarget.style.color = '#454955';
                                                            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                        }}
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
                            <div className="flex gap-6 mb-6 border-b" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                {ORDER_SUBTABS.map(subTab => (
                                    <button
                                        key={subTab.key}
                                        className={`py-3 px-6 font-bold text-base border-b-2 transition-all`}
                                        style={{
                                            borderBottomColor: orderSubTab === subTab.key ? '#72b01d' : 'transparent',
                                            color: orderSubTab === subTab.key ? '#0d0a0b' : '#454955'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (orderSubTab !== subTab.key) {
                                                e.currentTarget.style.color = '#0d0a0b';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (orderSubTab !== subTab.key) {
                                                e.currentTarget.style.color = '#454955';
                                            }
                                        }}
                                        onClick={() => setOrderSubTab(subTab.key as "buyer" | "seller")}
                                    >
                                        {subTab.label}
                                    </button>
                                ))}
                            </div>
                            {ordersLoading ? (
                                <div className="py-10 text-center" style={{ color: '#454955' }}>Loading orders...</div>
                            ) : (
                                <div>
                                    {/* As Buyer */}
                                    {orderSubTab === "buyer" && (
                                        <div>
                                            {buyerOrders.length === 0 ? (
                                                <div className="py-10 text-center" style={{ color: '#454955', opacity: 0.7 }}>No orders as buyer yet.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {buyerOrders.map(order => (
                                                        <Link
                                                            to={`/order/${order.id}`}
                                                            key={order.id}
                                                            className="border rounded-xl p-5 flex items-center gap-4 shadow transition cursor-pointer"
                                                            style={{
                                                                backgroundColor: '#ffffff',
                                                                borderColor: 'rgba(114, 176, 29, 0.3)',
                                                                textDecoration: 'none',
                                                                color: 'inherit'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.05)';
                                                                e.currentTarget.style.borderColor = '#72b01d';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(114, 176, 29, 0.15)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                                e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                                e.currentTarget.style.boxShadow = '';
                                                            }}
                                                        >
                                                            <img
                                                                src={order.itemImage || '/placeholder.png'}
                                                                alt={order.itemName}
                                                                className="w-16 h-16 object-cover rounded-lg border"
                                                                style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-lg mb-1 truncate" style={{ color: '#0d0a0b' }}>{order.itemName}</div>
                                                                <div className="text-sm mb-1" style={{ color: '#454955' }}>Status: <span className="font-semibold">{order.status}</span></div>
                                                                <div className="text-xs truncate" style={{ color: '#454955', opacity: 0.8 }}>Seller: {order.sellerName || order.sellerId}</div>
                                                            </div>
                                                            <div className="text-lg font-bold self-end whitespace-nowrap" style={{ color: '#3f7d20' }}>LKR {order.total?.toLocaleString()}</div>
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
                                                <div className="py-10 text-center" style={{ color: '#454955', opacity: 0.7 }}>No orders as seller yet.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {sellerOrders.map(order => (
                                                        <OrderSellerRow key={order.id} order={order} setSellerOrders={setSellerOrders} />
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
                            <h2 className="text-xl font-bold mb-4" style={{ color: '#0d0a0b' }}>Your Seller Reviews</h2>
                            {reviewsLoading ? (
                                <div className="py-10 text-center" style={{ color: '#454955' }}>Loading reviews...</div>
                            ) : sellerReviews.length === 0 ? (
                                <div className="py-10 text-center" style={{ color: '#454955', opacity: 0.7 }}>No reviews as seller yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {sellerReviews.map(r => (
                                        <div key={r.id} className="border rounded-xl p-5 shadow transition" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }} onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.05)';
                                            e.currentTarget.style.borderColor = '#72b01d';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(114, 176, 29, 0.15)';
                                        }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                e.currentTarget.style.boxShadow = '';
                                            }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-base" style={{ color: '#72b01d' }}>{r.rating}★</span>
                                                <span className="text-xs" style={{ color: '#454955', opacity: 0.8 }}>{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ color: '#0d0a0b' }}>{r.text}</div>
                                            {r.writtenByUserName && (
                                                <div className="mt-2 text-xs" style={{ color: '#454955', opacity: 0.7 }}>
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
                                <h2 className="text-xl font-bold" style={{ color: '#0d0a0b' }}>Your Listings</h2>
                                <a
                                    href="/add-listing"
                                    className="inline-block px-5 py-2 rounded-full font-semibold uppercase tracking-wide transition text-sm"
                                    style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3f7d20';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                    }}
                                >
                                    + Create New Listing
                                </a>
                            </div>
                            {listingsLoading ? (
                                <div className="py-10 text-center" style={{ color: '#454955' }}>Loading listings...</div>
                            ) : totalListings === 0 ? (
                                <div className="py-10 text-center" style={{ color: '#454955', opacity: 0.7 }}>No listings found.</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {paginatedListings.map(listing => {
                                            const shop = shops.find(s => s.id === listing.shopId);
                                            return (
                                                <div
                                                    key={listing.id}
                                                    className="border rounded-xl p-4 transition"
                                                    style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.05)';
                                                        e.currentTarget.style.borderColor = '#72b01d';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={listing.images?.[0] || "/placeholder.png"}
                                                            alt={listing.name}
                                                            className="w-16 h-16 object-cover rounded border"
                                                            style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-lg truncate" style={{ color: '#0d0a0b' }}>{listing.name}</h3>
                                                            <p className="text-xs truncate mb-1" style={{ color: '#454955', opacity: 0.8 }}>{shop ? shop.name : ''}</p>
                                                            <p className="text-sm truncate" style={{ color: '#454955' }}>{listing.description}</p>
                                                            <p className="font-bold mt-1" style={{ color: '#3f7d20' }}>LKR {listing.price?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditListing(listing.id)}
                                                            className="px-4 py-2 rounded font-semibold transition border"
                                                            style={{ backgroundColor: '#72b01d', color: '#ffffff', borderColor: '#72b01d' }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#3f7d20';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#72b01d';
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteListing(listing.id)}
                                                            className="px-4 py-2 rounded font-semibold transition border"
                                                            style={{ backgroundColor: '#ffffff', color: '#454955', borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#ffebee';
                                                                e.currentTarget.style.color = '#c62828';
                                                                e.currentTarget.style.borderColor = '#c62828';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                                e.currentTarget.style.color = '#454955';
                                                                e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                            }}
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
                                                className={`px-3 py-1 rounded font-semibold transition border`}
                                                style={{
                                                    backgroundColor: listingsPage === 1 ? 'rgba(69, 73, 85, 0.1)' : '#ffffff',
                                                    color: listingsPage === 1 ? 'rgba(69, 73, 85, 0.4)' : '#454955',
                                                    borderColor: listingsPage === 1 ? 'rgba(69, 73, 85, 0.2)' : 'rgba(114, 176, 29, 0.3)',
                                                    cursor: listingsPage === 1 ? 'not-allowed' : 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (listingsPage !== 1) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                                        e.currentTarget.style.borderColor = '#72b01d';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (listingsPage !== 1) {
                                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    }
                                                }}
                                                onClick={() => setListingsPage(p => Math.max(p - 1, 1))}
                                                disabled={listingsPage === 1}
                                            >
                                                Prev
                                            </button>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    className={`px-3 py-1 rounded font-semibold transition border`}
                                                    style={{
                                                        backgroundColor: listingsPage === i + 1 ? '#72b01d' : '#ffffff',
                                                        color: listingsPage === i + 1 ? '#ffffff' : '#454955',
                                                        borderColor: listingsPage === i + 1 ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (listingsPage !== i + 1) {
                                                            e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                                            e.currentTarget.style.borderColor = '#72b01d';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (listingsPage !== i + 1) {
                                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                                            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                        }
                                                    }}
                                                    onClick={() => setListingsPage(i + 1)}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button
                                                className={`px-3 py-1 rounded font-semibold transition border`}
                                                style={{
                                                    backgroundColor: listingsPage === totalPages ? 'rgba(69, 73, 85, 0.1)' : '#ffffff',
                                                    color: listingsPage === totalPages ? 'rgba(69, 73, 85, 0.4)' : '#454955',
                                                    borderColor: listingsPage === totalPages ? 'rgba(69, 73, 85, 0.2)' : 'rgba(114, 176, 29, 0.3)',
                                                    cursor: listingsPage === totalPages ? 'not-allowed' : 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (listingsPage !== totalPages) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
                                                        e.currentTarget.style.borderColor = '#72b01d';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (listingsPage !== totalPages) {
                                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    }
                                                }}
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
                    {/* PAYMENTS TAB */}
                    {selectedTab === "payments" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Your Payments</h2>
                            </div>
                            {/* Earnings and next payout */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex-1 rounded-xl p-4 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                    <div className="text-xs mb-1" style={{ color: '#454955', opacity: 0.8 }}>Total Earnings (last 14 days)</div>
                                    <div className="text-2xl font-bold" style={{ color: '#3f7d20' }}>
                                        {(() => {
                                            const now = Date.now();
                                            const cutoff = now - 14 * 24 * 60 * 60 * 1000;
                                            const total = payments
                                                .filter(p => p.createdAt && new Date(p.createdAt.seconds ? p.createdAt.seconds * 1000 : p.createdAt).getTime() >= cutoff)
                                                .reduce((sum, p) => sum + (p.total || 0), 0);
                                            return `LKR ${total.toLocaleString()}`;
                                        })()}
                                    </div>
                                </div>
                                <div className="flex-1 rounded-xl p-4 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                    <div className="text-xs mb-1" style={{ color: '#454955', opacity: 0.8 }}>Next Payment Due</div>
                                    <div className="text-2xl font-bold" style={{ color: '#72b01d' }}>
                                        {(() => {
                                            const next = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                                            return next.toLocaleDateString();
                                        })()}
                                    </div>
                                </div>
                            </div>
                            {/* Payment summary for last 14 days */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2" style={{ color: '#0d0a0b' }}>Payment Summary (Last 14 Days)</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border rounded-xl" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                        <thead style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                            <tr>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Order ID</th>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Date</th>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Item Name</th>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Quantity</th>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Item Total</th>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Shipping</th>
                                                <th className="px-4 py-2 border-b text-left font-semibold text-sm" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Order Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments
                                                .filter(p => p.status === "RECEIVED" && p.createdAt)
                                                .sort((a, b) => (b.createdAt.seconds || 0) - (a.createdAt.seconds || 0))
                                                .map(p => (
                                                    <tr key={p.id} className="transition" style={{ backgroundColor: '#ffffff' }} onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.05)';
                                                    }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                                        }}>
                                                        <td className="px-4 py-2 border-b text-xs text-left font-mono" style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{p.id}</td>
                                                        <td className="px-4 py-2 border-b text-xs text-left" style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{p.createdAt && new Date(p.createdAt.seconds * 1000).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 border-b text-xs text-left font-semibold" style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{p.itemName || '-'}</td>
                                                        <td className="px-4 py-2 border-b text-xs text-left" style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{p.quantity || 1}</td>
                                                        <td className="px-4 py-2 border-b text-xs text-left" style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>LKR {(p.price && p.quantity ? (p.price * p.quantity).toLocaleString() : '-')}</td>
                                                        <td className="px-4 py-2 border-b text-xs text-left" style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>LKR {p.shipping?.toLocaleString() || '-'}</td>
                                                        <td className="px-4 py-2 border-b text-xs text-left font-bold" style={{ color: '#3f7d20', borderColor: 'rgba(114, 176, 29, 0.2)' }}>LKR {p.total?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    {payments.filter(p => p.status === "RECEIVED").length === 0 && (
                                        <div className="text-center py-6" style={{ color: '#454955', opacity: 0.7 }}>No received orders in the last 14 days.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {selectedTab === "settings" && (
                        <div>
                            <h2 className="text-xl font-bold mb-4" style={{ color: '#0d0a0b' }}>Settings</h2>
                            <form className="w-full space-y-8" onSubmit={e => { e.preventDefault(); }}>
                                {settingsLoading && <div style={{ color: '#72b01d' }}>Saving...</div>}
                                {settingsSuccess && <div style={{ color: '#3f7d20' }}>{settingsSuccess}</div>}
                                {settingsError && <div style={{ color: '#d32f2f' }}>{settingsError}</div>}

                                {/* Bank Account Details */}
                                <div className="rounded-xl border p-6 w-full" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <h3 className="font-bold text-lg mb-2" style={{ color: '#0d0a0b' }}>Bank Account Details for Payouts</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1" style={{ color: '#454955' }}>Bank Account Number</label>
                                            <input
                                                className="border rounded px-3 py-2 w-full transition focus:outline-none focus:ring-2"
                                                style={{
                                                    backgroundColor: 'rgba(243, 239, 245, 0.8)',
                                                    borderColor: 'rgba(114, 176, 29, 0.3)',
                                                    color: '#0d0a0b'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#72b01d';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                value={bankForm.accountNumber}
                                                onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1" style={{ color: '#454955' }}>Branch Name</label>
                                            <input
                                                className="border rounded px-3 py-2 w-full transition focus:outline-none focus:ring-2"
                                                style={{
                                                    backgroundColor: 'rgba(243, 239, 245, 0.8)',
                                                    borderColor: 'rgba(114, 176, 29, 0.3)',
                                                    color: '#0d0a0b'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#72b01d';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                value={bankForm.branch}
                                                onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1" style={{ color: '#454955' }}>Bank Name</label>
                                            <input
                                                className="border rounded px-3 py-2 w-full transition focus:outline-none focus:ring-2"
                                                style={{
                                                    backgroundColor: 'rgba(243, 239, 245, 0.8)',
                                                    borderColor: 'rgba(114, 176, 29, 0.3)',
                                                    color: '#0d0a0b'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#72b01d';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                value={bankForm.bankName}
                                                onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1" style={{ color: '#454955' }}>Full Name as in Bank</label>
                                            <input
                                                className="border rounded px-3 py-2 w-full transition focus:outline-none focus:ring-2"
                                                style={{
                                                    backgroundColor: 'rgba(243, 239, 245, 0.8)',
                                                    borderColor: 'rgba(114, 176, 29, 0.3)',
                                                    color: '#0d0a0b'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#72b01d';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                value={bankForm.fullName}
                                                onChange={e => setBankForm(f => ({ ...f, fullName: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Seller Verification */}
                                <div className="rounded-2xl border p-6 w-full shadow-sm flex flex-col" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <h3 className="font-bold text-xl mb-6" style={{ color: '#0d0a0b' }}>Verified Seller Badge</h3>
                                    {verifyForm.isVerified === 'COMPLETED' && (
                                        <div className="w-full flex flex-col items-center gap-2 py-8">
                                            <div className="rounded-full p-4 mb-2" style={{ backgroundColor: 'rgba(114, 176, 29, 0.15)' }}>
                                                <svg width="36" height="36" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#72b01d" fillOpacity="0.12" /><path d="M8 12.5l2.5 2.5 5-5" stroke="#3f7d20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                            <div className="font-semibold text-lg text-center" style={{ color: '#3f7d20' }}>You are a verified seller!</div>
                                        </div>
                                    )}
                                    {verifyForm.isVerified === 'PENDING' && (
                                        <div className="w-full flex flex-col items-center gap-2 py-8">
                                            <div className="rounded-full p-4 mb-2" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)' }}>
                                                <svg width="36" height="36" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15" fillOpacity="0.12" /><path d="M12 7v4m0 4h.01" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                            <div className="font-semibold text-lg text-center" style={{ color: '#ff8f00' }}>Your documents are under review.</div>
                                            <div className="text-sm text-center" style={{ color: '#454955', opacity: 0.8 }}>We will notify you when verification is complete.</div>
                                        </div>
                                    )}
                                    {verifyForm.isVerified === 'NO_DATA' && (
                                        <>
                                            <div className="mb-4 w-full max-w-xl">
                                                <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>Full Name as in ID</label>
                                                <input
                                                    className="border rounded-lg px-4 py-2 w-full text-base transition focus:outline-none focus:ring-2"
                                                    style={{
                                                        backgroundColor: 'rgba(243, 239, 245, 0.8)',
                                                        borderColor: 'rgba(114, 176, 29, 0.3)',
                                                        color: '#0d0a0b'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.currentTarget.style.borderColor = '#72b01d';
                                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                    value={verifyForm.fullName}
                                                    onChange={e => setVerifyForm(f => ({ ...f, fullName: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>ID Front Side</label>
                                                    <input type="file" accept="image/*" onChange={e => setVerifyForm(f => ({ ...f, idFront: e.target.files?.[0] ?? null }))} className="block w-full" />
                                                    {(verifyForm.idFront || verifyForm.idFrontUrl) && (
                                                        <img src={verifyForm.idFront ? URL.createObjectURL(verifyForm.idFront) : verifyForm.idFrontUrl} alt="ID Front Preview" className="mt-2 w-full max-w-[120px] h-auto rounded shadow border" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>ID Back Side</label>
                                                    <input type="file" accept="image/*" onChange={e => setVerifyForm(f => ({ ...f, idBack: e.target.files?.[0] ?? null }))} className="block w-full" />
                                                    {(verifyForm.idBack || verifyForm.idBackUrl) && (
                                                        <img src={verifyForm.idBack ? URL.createObjectURL(verifyForm.idBack) : verifyForm.idBackUrl} alt="ID Back Preview" className="mt-2 w-full max-w-[120px] h-auto rounded shadow border" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>Selfie with ID</label>
                                                    <input type="file" accept="image/*" onChange={e => setVerifyForm(f => ({ ...f, selfie: e.target.files?.[0] ?? null }))} className="block w-full" />
                                                    {(verifyForm.selfie || verifyForm.selfieUrl) && (
                                                        <img src={verifyForm.selfie ? URL.createObjectURL(verifyForm.selfie) : verifyForm.selfieUrl} alt="Selfie Preview" className="mt-2 w-full max-w-[120px] h-auto rounded shadow border" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mb-6 w-full max-w-xl">
                                                <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>Address</label>
                                                <input
                                                    className="border rounded-lg px-4 py-2 w-full text-base transition focus:outline-none focus:ring-2"
                                                    style={{
                                                        backgroundColor: 'rgba(243, 239, 245, 0.8)',
                                                        borderColor: 'rgba(114, 176, 29, 0.3)',
                                                        color: '#0d0a0b'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.currentTarget.style.borderColor = '#72b01d';
                                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                    value={verifyForm.address}
                                                    onChange={e => setVerifyForm(f => ({ ...f, address: e.target.value }))}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-end w-full">
                                    <button
                                        type="button"
                                        className="px-6 py-3 rounded-full font-bold text-base transition"
                                        style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                                        onMouseEnter={(e) => {
                                            if (!settingsLoading) {
                                                e.currentTarget.style.backgroundColor = '#3f7d20';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!settingsLoading) {
                                                e.currentTarget.style.backgroundColor = '#72b01d';
                                            }
                                        }}
                                        onClick={handleSaveAllSettings}
                                        disabled={settingsLoading}
                                    >
                                        {settingsLoading ? 'Saving...' : 'Submit for Review'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
