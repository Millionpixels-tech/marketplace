
import { useEffect, useState } from "react";
import OrderSellerRow from "../order/OrderSellerRow";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc, orderBy, limit, startAfter } from "firebase/firestore";
import { FiUser, FiShoppingBag, FiList, FiStar, FiMenu, FiX } from "react-icons/fi";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { Pagination } from "../../components/UI";
import { VerificationStatus, OrderStatus } from "../../types/enums";
import type { VerificationStatus as VerificationStatusType } from "../../types/enums";
import { useResponsive } from "../../hooks/useResponsive";
import { 
    calculatePaymentSchedule, 
    getEligibleOrdersForPayment, 
    calculatePeriodEarnings, 
    formatPaymentDate, 
    getDaysUntilNextPayment,
    initializePaymentSystem,
    debugOrderEligibility,
    resetPaymentSystem,
    type PaymentSchedule
} from "../../utils/paymentSchedule";

interface VerifyForm {
    fullName: string;
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
    address: string;
    idFrontUrl: string;
    idBackUrl: string;
    selfieUrl: string;
    isVerified: VerificationStatusType;
}

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
    const { isMobile } = useResponsive();
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
    const [verifyForm, setVerifyForm] = useState<VerifyForm>({ fullName: '', idFront: null, idBack: null, selfie: null, address: '', idFrontUrl: '', idBackUrl: '', selfieUrl: '', isVerified: VerificationStatus.NO_DATA });
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
            
            // When user submits verification documents, set status to PENDING
            const verificationStatus = (verifyForm.isVerified === VerificationStatus.NO_DATA || verifyForm.isVerified === VerificationStatus.REJECTED) 
                ? VerificationStatus.PENDING 
                : verifyForm.isVerified;
            
            await updateDoc(doc(db, 'users', user.uid), {
                verification: {
                    isVerified: verificationStatus,
                    fullName: verifyForm.fullName,
                    idFrontUrl: idFrontUrl || '',
                    idBackUrl: idBackUrl || '',
                    selfieUrl: selfieUrl || '',
                    address: verifyForm.address,
                }
            });
            setVerifyForm(f => ({ ...f, idFront: null, idBack: null, selfie: null, idFrontUrl, idBackUrl, selfieUrl, isVerified: verificationStatus }));

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
    const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null);
    const [allSellerOrders, setAllSellerOrders] = useState<any[]>([]);
    // Bank details state
    // Payments fetching
    useEffect(() => {
        if (selectedTab !== "payments" || !profileUid) return;
        
        const fetchPaymentsAndSchedule = async () => {
            try {
                // Initialize payment system if not already done
                initializePaymentSystem();
                
                // Calculate payment schedule
                const schedule = calculatePaymentSchedule();
                setPaymentSchedule(schedule);

                // Fetch all seller orders without date restriction first to ensure we get all orders
                // We'll filter by payment period in the client-side logic
                const q = query(
                    collection(db, "orders"),
                    where("sellerId", "==", profileUid),
                    orderBy("createdAt", "desc")
                );
                
                const snap = await getDocs(q);
                const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllSellerOrders(orders);

                // Get eligible orders for current payment period
                const eligibleOrders = getEligibleOrdersForPayment(orders, schedule.currentPeriod);
                setPayments(eligibleOrders);
                
                console.log("Payment schedule:", schedule);
                console.log("All seller orders count:", orders.length);
                console.log("Eligible orders for payment:", eligibleOrders);
                console.log("Current period:", {
                    start: schedule.currentPeriod.startDate.toISOString(),
                    end: schedule.currentPeriod.endDate.toISOString(),
                    paymentDate: schedule.currentPeriod.paymentDate.toISOString()
                });
                
                // Debug each order
                console.log("=== Order Eligibility Debug ===");
                orders.forEach(order => {
                    const debug = debugOrderEligibility(order, schedule.currentPeriod);
                    console.log(`Order ${order.id}:`, debug);
                });
                console.log("=== End Debug ===");
            } catch (err) {
                console.error("Error loading payments:", err);
                setPayments([]);
                setAllSellerOrders([]);
            }
        };

        fetchPaymentsAndSchedule();
    }, [selectedTab, profileUid]);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [listings, setListings] = useState<any[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [listingsPage, setListingsPage] = useState(1); // <-- Pagination
    const LISTINGS_PER_PAGE = 8;

    const navigate = useNavigate();

    // Order sub-tabs
    const [orderSubTab, setOrderSubTab] = useState<"buyer" | "seller">("buyer");
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Order pagination state - server-side pagination
    const [buyerOrdersPage, setBuyerOrdersPage] = useState(1);
    const [sellerOrdersPage, setSellerOrdersPage] = useState(1);
    const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
    const [sellerOrders, setSellerOrders] = useState<any[]>([]);
    const [buyerOrdersCursors, setBuyerOrdersCursors] = useState<any[]>([null]); // Array of cursors for each page
    const [sellerOrdersCursors, setSellerOrdersCursors] = useState<any[]>([null]); // Array of cursors for each page
    const [buyerTotalCount, setBuyerTotalCount] = useState(0);
    const [sellerTotalCount, setSellerTotalCount] = useState(0);
    const ORDERS_PER_PAGE = 8;

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

    // Profile and shops fetching - Optimized with batching
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
            
            try {
                // Batch user profile and shops queries for better performance
                const [userDoc, shopsSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("uid", "==", uid))),
                    getDocs(query(collection(db, "shops"), where("owner", "==", uid)))
                ]);

                // Process user data
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

                // Process shops data
                const shopList = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setShops(shopList);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user, id]);

    // Listings fetching - Optimized
    useEffect(() => {
        const fetchListings = async () => {
            if (selectedTab !== "listings" || !profileUid) return;
            setListingsLoading(true);
            try {
                // First get user's shops, then batch query for listings
                const shopsQuery = query(
                    collection(db, "shops"), 
                    where("owner", "==", profileUid)
                );
                const shopsSnapshot = await getDocs(shopsQuery);
                const shopIds = shopsSnapshot.docs.map(doc => doc.id);
                
                if (shopIds.length === 0) {
                    setListings([]);
                    setListingsLoading(false);
                    return;
                }

                // Optimize listings query with limit and ordering
                const listingsQuery = query(
                    collection(db, "listings"), 
                    where("shopId", "in", shopIds),
                    // Add ordering for better UX
                    // orderBy("createdAt", "desc"),
                    // limit(100) // Limit to prevent large queries
                );
                const listingsSnapshot = await getDocs(listingsQuery);
                setListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error loading listings:", err);
                setListings([]);
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

    // Orders fetching - Server-side pagination
    useEffect(() => {
        if (selectedTab !== "orders" || !profileUid) return;
        // Reset pagination when tab changes
        setBuyerOrdersPage(1);
        setSellerOrdersPage(1);
        setBuyerOrdersCursors([null]);
        setSellerOrdersCursors([null]);
        setBuyerOrders([]);
        setSellerOrders([]);
        fetchOrdersPage(1);
    }, [selectedTab, profileUid]);

    // Fetch orders when sub-tab changes
    useEffect(() => {
        if (selectedTab !== "orders" || !profileUid) return;
        // Reset pagination when switching tabs
        setBuyerOrdersPage(1);
        setSellerOrdersPage(1);
        fetchOrdersPage(1);
    }, [orderSubTab]);

    const fetchOrdersPage = async (page: number) => {
        if (selectedTab !== "orders" || !profileUid) return;
        console.log("fetchOrdersPage called. page:", page, "orderSubTab:", orderSubTab);
        setOrdersLoading(true);
        
        try {
            if (orderSubTab === "buyer") {
                await fetchBuyerOrdersPage(page);
            } else {
                await fetchSellerOrdersPage(page);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchBuyerOrdersPage = async (page: number) => {
        try {
            console.log("Fetching buyer orders page:", page, "for profileUid:", profileUid);
            
            // Get the cursor for this page
            const cursor = buyerOrdersCursors[page - 1];
            
            let buyerQuery = query(
                collection(db, "orders"),
                where("buyerId", "==", profileUid),
                orderBy("createdAt", "desc"),
                limit(ORDERS_PER_PAGE)
            );

            if (cursor) {
                buyerQuery = query(
                    collection(db, "orders"),
                    where("buyerId", "==", profileUid),
                    orderBy("createdAt", "desc"),
                    startAfter(cursor),
                    limit(ORDERS_PER_PAGE)
                );
            }

            let buyerSnap;
            try {
                buyerSnap = await getDocs(buyerQuery);
            } catch (indexError) {
                console.warn("Index error for buyer orders, trying without orderBy:", indexError);
                // Fallback query without orderBy if index doesn't exist
                buyerQuery = query(
                    collection(db, "orders"),
                    where("buyerId", "==", profileUid),
                    limit(ORDERS_PER_PAGE)
                );
                if (cursor) {
                    buyerQuery = query(
                        collection(db, "orders"),
                        where("buyerId", "==", profileUid),
                        startAfter(cursor),
                        limit(ORDERS_PER_PAGE)
                    );
                }
                buyerSnap = await getDocs(buyerQuery);
            }

            const newOrders = buyerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort by createdAt desc as a fallback if Firestore ordering failed
            newOrders.sort((a: any, b: any) => {
                const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                return bTime - aTime; // Latest first (descending)
            });
            
            console.log("Buyer orders found for page", page, ":", newOrders.length);
            
            setBuyerOrders(newOrders);
            
            // Store cursor for next page if we have more results
            if (buyerSnap.docs.length === ORDERS_PER_PAGE) {
                const lastDoc = buyerSnap.docs[buyerSnap.docs.length - 1];
                setBuyerOrdersCursors(prev => {
                    const newCursors = [...prev];
                    newCursors[page] = lastDoc;
                    return newCursors;
                });
            }

            // For total count estimation (this is approximate since we don't fetch all)
            if (page === 1) {
                // First time, try to get a rough count
                const countQuery = query(
                    collection(db, "orders"),
                    where("buyerId", "==", profileUid)
                );
                try {
                    const countSnap = await getDocs(countQuery);
                    setBuyerTotalCount(countSnap.size);
                } catch {
                    // If counting fails, estimate based on current page
                    setBuyerTotalCount(newOrders.length === ORDERS_PER_PAGE ? (page * ORDERS_PER_PAGE) + 1 : newOrders.length);
                }
            }
        } catch (error) {
            console.error("Error fetching buyer orders:", error);
            setBuyerOrders([]);
        }
    };

    const fetchSellerOrdersPage = async (page: number) => {
        try {
            console.log("Fetching seller orders page:", page, "for profileUid:", profileUid);
            
            // Get the cursor for this page
            const cursor = sellerOrdersCursors[page - 1];
            
            let sellerQuery = query(
                collection(db, "orders"),
                where("sellerId", "==", profileUid),
                orderBy("createdAt", "desc"),
                limit(ORDERS_PER_PAGE)
            );

            if (cursor) {
                sellerQuery = query(
                    collection(db, "orders"),
                    where("sellerId", "==", profileUid),
                    orderBy("createdAt", "desc"),
                    startAfter(cursor),
                    limit(ORDERS_PER_PAGE)
                );
            }

            let sellerSnap;
            try {
                sellerSnap = await getDocs(sellerQuery);
            } catch (indexError) {
                console.warn("Index error for seller orders, trying without orderBy:", indexError);
                // Fallback query without orderBy if index doesn't exist
                sellerQuery = query(
                    collection(db, "orders"),
                    where("sellerId", "==", profileUid),
                    limit(ORDERS_PER_PAGE)
                );
                if (cursor) {
                    sellerQuery = query(
                        collection(db, "orders"),
                        where("sellerId", "==", profileUid),
                        startAfter(cursor),
                        limit(ORDERS_PER_PAGE)
                    );
                }
                sellerSnap = await getDocs(sellerQuery);
            }

            const newOrders = sellerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort by createdAt desc as a fallback if Firestore ordering failed
            newOrders.sort((a: any, b: any) => {
                const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                return bTime - aTime; // Latest first (descending)
            });
            
            console.log("Seller orders found for page", page, ":", newOrders.length);
            
            setSellerOrders(newOrders);
            
            // Store cursor for next page if we have more results
            if (sellerSnap.docs.length === ORDERS_PER_PAGE) {
                const lastDoc = sellerSnap.docs[sellerSnap.docs.length - 1];
                setSellerOrdersCursors(prev => {
                    const newCursors = [...prev];
                    newCursors[page] = lastDoc;
                    return newCursors;
                });
            }

            // For total count estimation (this is approximate since we don't fetch all)
            if (page === 1) {
                // First time, try to get a rough count
                const countQuery = query(
                    collection(db, "orders"),
                    where("sellerId", "==", profileUid)
                );
                try {
                    const countSnap = await getDocs(countQuery);
                    setSellerTotalCount(countSnap.size);
                } catch {
                    // If counting fails, estimate based on current page
                    setSellerTotalCount(newOrders.length === ORDERS_PER_PAGE ? (page * ORDERS_PER_PAGE) + 1 : newOrders.length);
                }
            }
        } catch (error) {
            console.error("Error fetching seller orders:", error);
            setSellerOrders([]);
        }
    };

    // Reviews fetching - Optimized
    useEffect(() => {
        if (selectedTab !== "reviews" || !profileUid) return;
        setReviewsLoading(true);
        const fetchReviews = async () => {
            try {
                // For now, only fetch seller reviews as commented
                // In the future, you could add buyer reviews query as well
                const sellerSnap = await getDocs(
                    query(collection(db, "reviews"),
                        where("reviewedUserId", "==", profileUid),
                        where("role", "==", "seller"),
                        // Add ordering for better UX
                        // orderBy("createdAt", "desc"),
                        // limit(20)
                    )
                );
                setSellerReviews(sellerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching reviews:", error);
                setSellerReviews([]);
            } finally {
                setReviewsLoading(false);
            }
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

    // Pagination logic for listings
    const totalListings = listings.length;
    const totalPages = Math.ceil(totalListings / LISTINGS_PER_PAGE);
    const paginatedListings = listings.slice(
        (listingsPage - 1) * LISTINGS_PER_PAGE,
        listingsPage * LISTINGS_PER_PAGE
    );

    // Pagination logic for orders - server-side pagination
    const currentTotalCount = orderSubTab === "buyer" ? buyerTotalCount : sellerTotalCount;
    const totalOrderPages = Math.ceil(currentTotalCount / ORDERS_PER_PAGE);

    // Handler for orders pagination
    const handleOrdersPageChange = (page: number) => {
        if (orderSubTab === "buyer") {
            setBuyerOrdersPage(page);
        } else {
            setSellerOrdersPage(page);
        }
        fetchOrdersPage(page);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955' }}>Loading...</div>;
    if (!profileUid) return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955' }}>User not found.</div>;

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: '#ffffff' }}>
            <ResponsiveHeader />
            {/* Full width, no max-w */}
            <div className={`flex flex-col md:flex-row gap-0 ${isMobile ? 'py-4 px-4' : 'py-8 px-0 md:px-8'} w-full`}>
                {/* Sidebar */}
                <aside className={`w-full md:w-64 ${isMobile ? 'min-h-auto' : 'min-h-screen'} border-r rounded-3xl md:rounded-r-none md:rounded-l-3xl shadow-lg ${isMobile ? 'p-4' : 'p-6'} flex flex-row md:flex-col md:gap-4 gap-4 items-center md:items-start ${isMobile ? 'mb-4' : 'mb-6 md:mb-0'} relative transition-all`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    {/* Burger for mobile */}
                    <button
                        className={`md:hidden absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-10`}
                        onClick={() => setSidebarOpen(s => !s)}
                    >
                        {sidebarOpen ? <FiX size={isMobile ? 22 : 26} /> : <FiMenu size={isMobile ? 22 : 26} />}
                    </button>
                    {/* Sidebar Nav */}
                    <nav className={`flex-1 w-full flex ${sidebarOpen ? "flex" : "hidden"} md:flex flex-col ${isMobile ? 'gap-1' : 'gap-2'} ${isMobile ? 'mt-6' : 'mt-8 md:mt-0'}`}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`group flex items-center ${isMobile ? 'gap-2 px-3 py-2' : 'gap-3 px-5 py-3'} rounded-full font-semibold ${isMobile ? 'text-sm' : 'text-base'} transition-all relative overflow-hidden border`}
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
                                <span className={`transition-all ${isMobile ? 'text-sm' : ''}`} style={{
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
                <main className={`flex-1 min-w-0 w-full shadow-lg ${isMobile ? 'p-4' : 'p-4 md:p-10'} mx-auto border rounded-2xl`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    {/* PROFILE TAB */}
                    {selectedTab === "profile" && (
                        <div className="flex flex-col items-center w-full">
                            {/* Profile Picture */}
                            <div className={`${isMobile ? 'w-20 h-20' : 'w-28 h-28'} rounded-full border-4 shadow flex items-center justify-center overflow-hidden ${isMobile ? 'mb-3' : 'mb-4'} relative group`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: '#72b01d' }}>
                                {photoURL ? (
                                    <img src={photoURL} alt="Profile" className="object-cover w-full h-full" />
                                ) : (
                                    <>
                                        <span className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: '#454955' }}>
                                            {displayName ? displayName[0] : user?.email ? user.email[0] : ''}
                                        </span>
                                    </>
                                )}
                                {isOwner && editing && (
                                    <>
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className={`text-white font-semibold ${isMobile ? 'text-xs' : ''}`}>Change</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} disabled={uploadingPic} />
                                        </label>
                                        {uploadingPic && <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-black font-bold">{isMobile ? 'Loading...' : 'Uploading...'}</div>}
                                    </>
                                )}
                            </div>
                            {/* Name */}
                            <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black ${isMobile ? 'mb-1' : 'mb-2'} text-center flex items-center justify-center gap-2`} style={{ color: '#0d0a0b' }}>
                                {isOwner && editing ? (
                                    <input
                                        className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black text-center border rounded-xl ${isMobile ? 'px-2 py-1' : 'px-3 py-1'} w-full ${isMobile ? 'max-w-xs' : 'max-w-xs'} ${isMobile ? 'mb-1' : 'mb-2'}`}
                                        style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#0d0a0b' }}
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        maxLength={40}
                                    />
                                ) : (
                                    <>
                                        <span>{displayName || profileEmail}</span>
                                        {verifyForm.isVerified === VerificationStatus.COMPLETED && (
                                            <span className={`inline-flex items-center justify-center ml-2 rounded-full ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} style={{ backgroundColor: '#72b01d' }}>
                                                <svg viewBox="0 0 20 20" fill="white" className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}>
                                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div className={`w-full ${isMobile ? 'mb-4' : 'mb-6'} flex flex-col items-center`}>
                                {isOwner && editing ? (
                                    <textarea
                                        className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} border rounded-xl ${isMobile ? 'p-2' : 'p-3'} ${isMobile ? 'text-base' : 'text-lg'} text-center`}
                                        style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#454955' }}
                                        rows={isMobile ? 2 : 3}
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="Write something about yourself..."
                                        maxLength={300}
                                    />
                                ) : (
                                    <div className={`${isMobile ? 'text-base' : 'text-lg'} min-h-[48px] whitespace-pre-line text-center`} style={{ color: '#454955' }}>{desc || <span style={{ color: '#454955', opacity: 0.6 }}>No description yet.</span>}</div>
                                )}
                            </div>
                            {/* Edit/Save Buttons */}
                            {isOwner && (
                                <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
                                    {editing ? (
                                        <button
                                            className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-2'} rounded-full font-semibold mr-2 disabled:opacity-50 transition`}
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
                                            className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-2'} rounded-full font-semibold transition border`}
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
                            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} ${isMobile ? 'mb-3' : 'mb-4'}`}>
                                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`} style={{ color: '#0d0a0b' }}>{isOwner ? "Your Shops" : "Shops"}</h2>
                                {isOwner && (
                                    <Link
                                        to="/create-shop"
                                        className={`${isMobile ? 'px-4 py-2 text-xs' : 'px-5 py-2 text-sm'} rounded-full font-bold uppercase tracking-wide shadow transition`}
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
                                    <div className={`text-center ${isMobile ? 'text-sm' : ''}`} style={{ color: '#454955', opacity: 0.7 }}>You have not created any shops yet.</div>
                                </div>
                            ) : (
                                <div className={`grid grid-cols-1 ${isMobile ? '' : 'sm:grid-cols-2'} gap-4`}>
                                    {shops.map(shop => (
                                        <div
                                            key={shop.id}
                                            className={`border rounded-xl ${isMobile ? 'p-3' : 'p-4'} flex items-center ${isMobile ? 'gap-3' : 'gap-4'} transition`}
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
                                                className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'} flex-1`}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                {shop.logo ? (
                                                    <img src={shop.logo} alt={shop.name} className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} rounded-full object-cover border`} style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                ) : (
                                                    <div className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} rounded-full flex items-center justify-center ${isMobile ? 'text-lg' : 'text-2xl'} font-bold border`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', color: '#454955', borderColor: 'rgba(114, 176, 29, 0.3)' }}>{shop.name[0]}</div>
                                                )}
                                                <div>
                                                    <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>{shop.name}</div>
                                                    <div className="text-xs" style={{ color: '#454955' }}>@{shop.username}</div>
                                                </div>
                                            </Link>
                                            {isOwner && (
                                                <div className={`flex ${isMobile ? 'flex-col gap-1' : 'flex-col gap-2'} ml-2`}>
                                                    <button
                                                        onClick={() => navigate(`/edit-shop/${shop.id}`)}
                                                        className={`${isMobile ? 'px-2 py-1' : 'px-3 py-1'} rounded text-xs font-semibold transition border`}
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
                            <div className={`flex ${isMobile ? 'gap-3' : 'gap-6'} ${isMobile ? 'mb-4' : 'mb-6'} border-b`} style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                {ORDER_SUBTABS.map(subTab => (
                                    <button
                                        key={subTab.key}
                                        className={`${isMobile ? 'py-2 px-3' : 'py-3 px-6'} font-bold ${isMobile ? 'text-sm' : 'text-base'} border-b-2 transition-all`}
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
                                <div className={`${isMobile ? 'py-8' : 'py-10'} text-center ${isMobile ? 'text-sm' : ''}`} style={{ color: '#454955' }}>Loading orders...</div>
                            ) : (
                                <div>
                                    {/* As Buyer */}
                                    {orderSubTab === "buyer" && (
                                        <div>
                                            {buyerOrders.length === 0 ? (
                                                <div className={`${isMobile ? 'py-8' : 'py-10'} text-center ${isMobile ? 'text-sm' : ''}`} style={{ color: '#454955', opacity: 0.7 }}>No orders as buyer yet.</div>
                                            ) : (
                                                <>
                                                    <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                                                        {buyerOrders.map((order: any) => (
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
                                                                    <div className="text-sm mb-1" style={{ color: '#454955' }}>
                                                                        Status: <span className="font-semibold">
                                                                            {order.status === OrderStatus.CANCELLED && 'Order Cancelled'}
                                                                            {order.status === OrderStatus.REFUND_REQUESTED && 'Refund Requested'}
                                                                            {order.status === OrderStatus.REFUNDED && 'Order Refunded'}
                                                                            {order.status === OrderStatus.RECEIVED && 'Order Completed'}
                                                                            {order.status === OrderStatus.SHIPPED && 'Order Shipped'}
                                                                            {order.status === OrderStatus.PENDING && 'Order Pending'}
                                                                            {order.status === OrderStatus.CONFIRMED && 'Order Confirmed'}
                                                                            {order.status === OrderStatus.DELIVERED && 'Order Delivered'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs truncate" style={{ color: '#454955', opacity: 0.8 }}>Seller: {order.sellerName || order.sellerId}</div>
                                                                </div>
                                                                <div className="text-lg font-bold self-end whitespace-nowrap" style={{ color: '#3f7d20' }}>LKR {order.total?.toLocaleString()}</div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Buyer Orders Pagination */}
                                                    {totalOrderPages > 1 && (
                                                        <div className="mt-6 flex justify-center">
                                                            <Pagination
                                                                currentPage={buyerOrdersPage}
                                                                totalPages={totalOrderPages}
                                                                onPageChange={handleOrdersPageChange}
                                                                totalItems={buyerTotalCount}
                                                                startIndex={(buyerOrdersPage - 1) * ORDERS_PER_PAGE + 1}
                                                                endIndex={Math.min(buyerOrdersPage * ORDERS_PER_PAGE, buyerTotalCount)}
                                                                showInfo={true}
                                                                showJumpTo={totalOrderPages > 10}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {/* As Seller */}
                                    {orderSubTab === "seller" && (
                                        <div>
                                            {sellerOrders.length === 0 ? (
                                                <div className="py-10 text-center" style={{ color: '#454955', opacity: 0.7 }}>No orders as seller yet.</div>
                                            ) : (
                                                <>
                                                    <div className="space-y-4">
                                                        {sellerOrders.map((order: any) => (
                                                            <OrderSellerRow key={order.id} order={order} setSellerOrders={setSellerOrders} />
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Seller Orders Pagination */}
                                                    {totalOrderPages > 1 && (
                                                        <div className="mt-6 flex justify-center">
                                                            <Pagination
                                                                currentPage={sellerOrdersPage}
                                                                totalPages={totalOrderPages}
                                                                onPageChange={handleOrdersPageChange}
                                                                totalItems={sellerTotalCount}
                                                                startIndex={(sellerOrdersPage - 1) * ORDERS_PER_PAGE + 1}
                                                                endIndex={Math.min(sellerOrdersPage * ORDERS_PER_PAGE, sellerTotalCount)}
                                                                showInfo={true}
                                                                showJumpTo={totalOrderPages > 10}
                                                            />
                                                        </div>
                                                    )}
                                                </>
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
                            <h2 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>Your Seller Reviews</h2>
                            {reviewsLoading ? (
                                <div className={`text-center ${isMobile ? 'py-6' : 'py-10'}`} style={{ color: '#454955' }}>Loading reviews...</div>
                            ) : sellerReviews.length === 0 ? (
                                <div className={`text-center ${isMobile ? 'py-6' : 'py-10'}`} style={{ color: '#454955', opacity: 0.7 }}>No reviews as seller yet.</div>
                            ) : (
                                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                                    {sellerReviews.map(r => (
                                        <div key={r.id} className={`border rounded-xl shadow transition ${isMobile ? 'p-3' : 'p-5'}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }} onMouseEnter={(e) => {
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
                                                <span className={`font-bold ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#72b01d' }}>{r.rating}★</span>
                                                <span className="text-xs" style={{ color: '#454955', opacity: 0.8 }}>{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <div className={`${isMobile ? 'text-sm' : ''}`} style={{ color: '#0d0a0b' }}>{r.text}</div>
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
                            <div className={`flex items-center justify-between mb-4 ${isMobile ? 'flex-col gap-3' : ''}`}>
                                <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>Your Listings</h2>
                                <a
                                    href="/add-listing"
                                    className={`inline-block rounded-full font-semibold uppercase tracking-wide transition ${isMobile ? 'px-4 py-2 text-xs' : 'px-5 py-2 text-sm'}`}
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
                                <div className={`text-center ${isMobile ? 'py-6' : 'py-10'}`} style={{ color: '#454955' }}>Loading listings...</div>
                            ) : totalListings === 0 ? (
                                <div className={`text-center ${isMobile ? 'py-6' : 'py-10'}`} style={{ color: '#454955', opacity: 0.7 }}>No listings found.</div>
                            ) : (
                                <>
                                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
                                        {paginatedListings.map(listing => {
                                            const shop = shops.find(s => s.id === listing.shopId);
                                            return (
                                                <div
                                                    key={listing.id}
                                                    className={`border rounded-xl transition ${isMobile ? 'p-3' : 'p-4'}`}
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
                                                    <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                                                        <img
                                                            src={listing.images?.[0] || "/placeholder.png"}
                                                            alt={listing.name}
                                                            className={`object-cover rounded border ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                                                            style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className={`font-bold truncate ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>{listing.name}</h3>
                                                            <p className="text-xs truncate mb-1" style={{ color: '#454955', opacity: 0.8 }}>{shop ? shop.name : ''}</p>
                                                            <p className={`truncate ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>{listing.description}</p>
                                                            <p className={`font-bold mt-1 ${isMobile ? 'text-sm' : ''}`} style={{ color: '#3f7d20' }}>LKR {listing.price?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`mt-${isMobile ? '3' : '4'} flex justify-end gap-2`}>
                                                        <button
                                                            onClick={() => handleEditListing(listing.id)}
                                                            className={`rounded font-semibold transition border ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}
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
                                                            className={`rounded font-semibold transition border ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}
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
                                        <div className={`flex justify-center items-center mt-6 gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                                            <button
                                                className={`rounded font-semibold transition border ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1'}`}
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
                                                {isMobile ? '‹' : 'Prev'}
                                            </button>
                                            {[...Array(totalPages)].slice(0, isMobile ? 5 : totalPages).map((_, i) => (
                                                <button
                                                    key={i}
                                                    className={`rounded font-semibold transition border ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1'}`}
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
                                                className={`rounded font-semibold transition border ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1'}`}
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
                                                {isMobile ? '›' : 'Next'}
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
                            <div className={`flex items-center justify-between mb-4 ${isMobile ? 'flex-col gap-3' : ''}`}>
                                <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>Your Payments</h2>
                                {/* Debug/Test buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            resetPaymentSystem();
                                            window.location.reload();
                                        }}
                                        className={`bg-yellow-500 text-white rounded hover:bg-yellow-600 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-xs'}`}
                                    >
                                        Reset Payment System
                                    </button>
                                </div>
                            </div>

                            {/* Payment Schedule Information */}
                            {paymentSchedule && (
                                <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                                    {/* Next Payment Info */}
                                    <div className={`rounded-xl flex flex-col items-center justify-center ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                        <div className="text-xs mb-1" style={{ color: '#454955', opacity: 0.8 }}>Next Payment Date</div>
                                        <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#72b01d' }}>
                                            {formatPaymentDate(paymentSchedule.nextPaymentDate)}
                                        </div>
                                        <div className="text-xs mt-1" style={{ color: '#454955', opacity: 0.7 }}>
                                            {getDaysUntilNextPayment(paymentSchedule.nextPaymentDate)} days remaining
                                        </div>
                                    </div>

                                    {/* Current Period Earnings */}
                                    <div className={`rounded-xl flex flex-col items-center justify-center ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                        <div className="text-xs mb-1" style={{ color: '#454955', opacity: 0.8 }}>Pending Payment</div>
                                        <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#3f7d20' }}>
                                            LKR {calculatePeriodEarnings(payments).toLocaleString()}
                                        </div>
                                        <div className="text-xs mt-1 text-center" style={{ color: '#454955', opacity: 0.7 }}>
                                            From {formatPaymentDate(paymentSchedule.currentPeriod.startDate)} to {formatPaymentDate(paymentSchedule.currentPeriod.endDate)}
                                        </div>
                                    </div>

                                    {/* Last Payment Info */}
                                    <div className={`rounded-xl flex flex-col items-center justify-center ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                        <div className="text-xs mb-1" style={{ color: '#454955', opacity: 0.8 }}>Last Payment Date</div>
                                        <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#454955' }}>
                                            {formatPaymentDate(paymentSchedule.lastPaymentDate)}
                                        </div>
                                        <div className="text-xs mt-1 text-center" style={{ color: '#454955', opacity: 0.7 }}>
                                            {paymentSchedule.previousPeriod ? 
                                                `LKR ${calculatePeriodEarnings(getEligibleOrdersForPayment(allSellerOrders, paymentSchedule.previousPeriod)).toLocaleString()} paid` 
                                                : 'No previous payment'
                                            }
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Period Information */}
                            {paymentSchedule && (
                                <div className={`mb-6 rounded-xl ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', border: '1px solid rgba(114, 176, 29, 0.2)' }}>
                                    <h3 className={`font-bold mb-2 ${isMobile ? 'text-sm' : ''}`} style={{ color: '#0d0a0b' }}>Payment System Information</h3>
                                    <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>
                                        <p>• Payments are made every 14 days</p>
                                        <p>• We hold your earnings for a minimum of 14 days before payment</p>
                                        <p>• Only orders with payment method "PayNow" are eligible for payment</p>
                                        <p>• Orders with status "Received", "Shipped", or "Pending" are eligible for payment</p>
                                        <p>• COD (Cash on Delivery) orders are excluded from automated payments</p>
                                        <p>• Current payment period: <strong>{formatPaymentDate(paymentSchedule.currentPeriod.startDate)}</strong> to <strong>{formatPaymentDate(paymentSchedule.currentPeriod.endDate)}</strong></p>
                                    </div>
                                </div>
                            )}

                            {/* Payment Summary for Current Period */}
                            <div className="mb-6">
                                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>Orders Eligible for Next Payment</h3>
                                {payments.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border rounded-xl" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                            <thead style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                                <tr>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Order ID</th>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Date</th>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Status</th>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Payment Method</th>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Item Name</th>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Quantity</th>
                                                    <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Order Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments
                                                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                                                    .map(order => (
                                                        <tr key={order.id} className="transition" style={{ backgroundColor: '#ffffff' }} onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.05)';
                                                        }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                            }}>
                                                            <td className={`border-b text-left font-mono ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{isMobile ? order.id.slice(-8) : order.id}</td>
                                                            <td className={`border-b text-left ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                                {order.createdAt && new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td className={`border-b text-left ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                                <span className={`px-1 py-1 rounded font-semibold ${isMobile ? 'text-xs' : 'text-xs'} ${
                                                                    order.status === 'received' ? 'bg-green-100 text-green-800' :
                                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className={`border-b text-left ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                                <span className={`px-1 py-1 rounded font-semibold bg-green-100 text-green-800 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                                    {order.paymentMethod || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{isMobile ? (order.itemName || '-').slice(0, 15) + '...' : (order.itemName || '-')}</td>
                                                            <td className={`border-b text-left ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>{order.quantity || 1}</td>
                                                            <td className={`border-b text-left font-bold ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'}`} style={{ color: '#3f7d20', borderColor: 'rgba(114, 176, 29, 0.2)' }}>LKR {order.total?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                            <tfoot style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)' }}>
                                                <tr>
                                                    <td colSpan={6} className={`border-t text-right font-bold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                                        Total Payment:
                                                    </td>
                                                    <td className={`border-t text-left font-bold ${isMobile ? 'px-2 py-2 text-sm' : 'px-4 py-3 text-lg'}`} style={{ color: '#3f7d20', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                                        LKR {calculatePeriodEarnings(payments).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={`text-center ${isMobile ? 'py-4' : 'py-6'}`} style={{ color: '#454955', opacity: 0.7 }}>
                                        No eligible orders for the current payment period.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {selectedTab === "settings" && (
                        <div>
                            <h2 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>Settings</h2>
                            <form className="w-full space-y-8" onSubmit={e => { e.preventDefault(); }}>
                                {settingsLoading && <div style={{ color: '#72b01d' }}>Saving...</div>}
                                {settingsSuccess && <div style={{ color: '#3f7d20' }}>{settingsSuccess}</div>}
                                {settingsError && <div style={{ color: '#d32f2f' }}>{settingsError}</div>}

                                {/* Bank Account Details */}
                                <div className={`rounded-xl border w-full ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>Bank Account Details for Payouts</h3>
                                    <div className={`grid gap-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                                        <div>
                                            <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Bank Account Number</label>
                                            <input
                                                className={`border rounded w-full transition focus:outline-none focus:ring-2 ${isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'}`}
                                                style={{
                                                    backgroundColor: '#ffffff',
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
                                            <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Branch Name</label>
                                            <input
                                                className={`border rounded w-full transition focus:outline-none focus:ring-2 ${isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'}`}
                                                style={{
                                                    backgroundColor: '#ffffff',
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
                                            <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Bank Name</label>
                                            <input
                                                className={`border rounded w-full transition focus:outline-none focus:ring-2 ${isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'}`}
                                                style={{
                                                    backgroundColor: '#ffffff',
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
                                            <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Full Name as in Bank</label>
                                            <input
                                                className={`border rounded w-full transition focus:outline-none focus:ring-2 ${isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'}`}
                                                style={{
                                                    backgroundColor: '#ffffff',
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
                                <div className={`rounded-2xl border w-full shadow-sm flex flex-col ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <h3 className={`font-bold mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>Verified Seller Badge</h3>
                                    
                                    {/* Verified Status */}
                                    {verifyForm.isVerified === VerificationStatus.COMPLETED && (
                                        <div className={`w-full flex flex-col items-center gap-2 ${isMobile ? 'py-6' : 'py-8'}`}>
                                            <div className={`rounded-full mb-2 ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.15)' }}>
                                                <svg width={isMobile ? "28" : "36"} height={isMobile ? "28" : "36"} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#72b01d" fillOpacity="0.12" /><path d="M8 12.5l2.5 2.5 5-5" stroke="#3f7d20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                            <div className={`font-semibold text-center ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#3f7d20' }}>You are a verified seller!</div>
                                            <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955', opacity: 0.8 }}>Your account has been verified and you can sell on our platform.</div>
                                        </div>
                                    )}
                                    
                                    {/* Pending Review Status */}
                                    {verifyForm.isVerified === VerificationStatus.PENDING && (
                                        <div className={`w-full flex flex-col items-center gap-2 ${isMobile ? 'py-6' : 'py-8'}`}>
                                            <div className={`rounded-full mb-2 ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)' }}>
                                                <svg width={isMobile ? "28" : "36"} height={isMobile ? "28" : "36"} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15" fillOpacity="0.12" /><path d="M12 7v4m0 4h.01" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                            <div className={`font-semibold text-center ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#ff8f00' }}>Your documents are under review.</div>
                                            <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955', opacity: 0.8 }}>We will notify you when verification is complete.</div>
                                        </div>
                                    )}
                                    
                                    {/* Rejected Status */}
                                    {verifyForm.isVerified === VerificationStatus.REJECTED && (
                                        <>
                                            <div className={`w-full flex flex-col items-center gap-2 mb-6 ${isMobile ? 'py-4' : 'py-4'}`}>
                                                <div className={`rounded-full mb-2 ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(244, 67, 54, 0.15)' }}>
                                                    <svg width={isMobile ? "28" : "36"} height={isMobile ? "28" : "36"} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#f44336" fillOpacity="0.12" /><path d="M15 9l-6 6m0-6l6 6" stroke="#f44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                                <div className={`font-semibold text-center ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#d32f2f' }}>Verification was rejected.</div>
                                                <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955', opacity: 0.8 }}>Please resubmit your documents with the correct information.</div>
                                            </div>
                                            {/* Show form for resubmission */}
                                            <div className={`border-t ${isMobile ? 'pt-4' : 'pt-6'}`} style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                <h4 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>Resubmit Verification Documents</h4>
                                                {/* Form content will go here */}
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* No Data or Rejected - Show Form */}
                                    {(verifyForm.isVerified === VerificationStatus.NO_DATA || verifyForm.isVerified === VerificationStatus.REJECTED) && (
                                        <>
                                            {verifyForm.isVerified === VerificationStatus.NO_DATA && (
                                                <div className="mb-6">
                                                    <div className={`bg-blue-50 border border-blue-200 rounded-xl mb-4 ${isMobile ? 'p-3' : 'p-4'}`}>
                                                        <div className={`text-blue-700 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>📋 Complete your seller verification</div>
                                                        <div className={`text-blue-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>Submit your documents to become a verified seller and gain customer trust.</div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className={`mb-4 w-full ${isMobile ? 'max-w-full' : 'max-w-xl'}`}>
                                                <label className={`block font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Full Name as in ID</label>
                                                <input
                                                    className={`border rounded-lg w-full transition focus:outline-none focus:ring-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'}`}
                                                    style={{
                                                        backgroundColor: '#ffffff',
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
                                                    placeholder="Enter your full name as it appears on your ID"
                                                    value={verifyForm.fullName}
                                                    onChange={e => setVerifyForm(f => ({ ...f, fullName: e.target.value }))}
                                                />
                                            </div>
                                            <div className={`grid gap-4 w-full mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                                                <div>
                                                    <label className={`block font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>ID Front Side</label>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={e => setVerifyForm(f => ({ ...f, idFront: e.target.files?.[0] ?? null }))} 
                                                        className={`block w-full border rounded-lg ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
                                                        style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                    />
                                                    {(verifyForm.idFront || verifyForm.idFrontUrl) && (
                                                        <img src={verifyForm.idFront ? URL.createObjectURL(verifyForm.idFront) : verifyForm.idFrontUrl} alt="ID Front Preview" className={`mt-2 w-full h-auto rounded shadow border ${isMobile ? 'max-w-[100px]' : 'max-w-[120px]'}`} style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <label className={`block font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>ID Back Side</label>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={e => setVerifyForm(f => ({ ...f, idBack: e.target.files?.[0] ?? null }))} 
                                                        className={`block w-full border rounded-lg ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
                                                        style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                    />
                                                    {(verifyForm.idBack || verifyForm.idBackUrl) && (
                                                        <img src={verifyForm.idBack ? URL.createObjectURL(verifyForm.idBack) : verifyForm.idBackUrl} alt="ID Back Preview" className={`mt-2 w-full h-auto rounded shadow border ${isMobile ? 'max-w-[100px]' : 'max-w-[120px]'}`} style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <label className={`block font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Selfie with ID</label>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={e => setVerifyForm(f => ({ ...f, selfie: e.target.files?.[0] ?? null }))} 
                                                        className={`block w-full border rounded-lg ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
                                                        style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                                    />
                                                    {(verifyForm.selfie || verifyForm.selfieUrl) && (
                                                        <img src={verifyForm.selfie ? URL.createObjectURL(verifyForm.selfie) : verifyForm.selfieUrl} alt="Selfie Preview" className={`mt-2 w-full h-auto rounded shadow border ${isMobile ? 'max-w-[100px]' : 'max-w-[120px]'}`} style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`mb-6 w-full ${isMobile ? 'max-w-full' : 'max-w-xl'}`}>
                                                <label className={`block font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>Address</label>
                                                <textarea
                                                    className={`border rounded-lg w-full transition focus:outline-none focus:ring-2 resize-none ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'}`}
                                                    style={{
                                                        backgroundColor: '#ffffff',
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
                                                    rows={3}
                                                    placeholder="Enter your full address"
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
                                        className={`rounded-full font-bold transition ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base'}`}
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
            <Footer />
        </div>
    );
}
