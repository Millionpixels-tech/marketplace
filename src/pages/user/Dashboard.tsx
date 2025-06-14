
import { useEffect, useState } from "react";
import OrderSellerRow from "../order/OrderSellerRow";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc, orderBy, limit, startAfter } from "firebase/firestore";
import { FiUser, FiShoppingBag, FiList, FiStar, FiMenu, FiX, FiPackage, FiBox } from "react-icons/fi";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { Pagination } from "../../components/UI";
import { VerificationStatus, OrderStatus } from "../../types/enums";
import type { VerificationStatus as VerificationStatusType } from "../../types/enums";
import { useResponsive } from "../../hooks/useResponsive";
import { ConfirmDialog } from "../../components/UI";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

// Import separate earnings page
import EarningsPage from "./dashboard/EarningsPage";
import StockManagement from "./dashboard/StockManagement";

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

interface BankAccount {
    id: string;
    accountNumber: string;
    branch: string;
    bankName: string;
    fullName: string;
    isDefault: boolean;
    createdAt: Date;
}

const TABS = [
    { key: "profile", label: "Profile", icon: <FiUser /> },
    { key: "shops", label: "Shops", icon: <FiShoppingBag /> },
    { key: "orders", label: "Orders", icon: <FiPackage /> },
    { key: "listings", label: "Listings", icon: <FiList /> },
    { key: "earnings", label: "Earnings", icon: <FiStar /> },
    { key: "stock", label: "Stock", icon: <FiBox /> },
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
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [isAddingBank, setIsAddingBank] = useState(false);
    const [editingBankId, setEditingBankId] = useState<string | null>(null);
    const [verifyForm, setVerifyForm] = useState<VerifyForm>({ fullName: '', idFront: null, idBack: null, selfie: null, address: '', idFrontUrl: '', idBackUrl: '', selfieUrl: '', isVerified: VerificationStatus.NO_DATA });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    // Custom confirmation dialog hook
    const { isOpen, confirmDialog, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();

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

    // Bank Account Management Functions
    const generateBankAccountId = () => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    };

    const addBankAccount = async () => {
        if (!user || !bankForm.accountNumber || !bankForm.bankName || !bankForm.fullName) {
            setSettingsError('Please fill in all required bank account fields');
            return;
        }

        try {
            setSettingsLoading(true);
            setSettingsError(null);

            const newAccount: BankAccount = {
                id: generateBankAccountId(),
                accountNumber: bankForm.accountNumber,
                branch: bankForm.branch,
                bankName: bankForm.bankName,
                fullName: bankForm.fullName,
                isDefault: bankAccounts.length === 0, // First account is default
                createdAt: new Date()
            };

            const updatedAccounts = [...bankAccounts, newAccount];
            setBankAccounts(updatedAccounts);

            // Save to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                bankAccounts: updatedAccounts
            });

            // Clear form
            setBankForm({ accountNumber: '', branch: '', bankName: '', fullName: '' });
            setIsAddingBank(false);
            setSettingsSuccess('Bank account added successfully!');
        } catch (e: any) {
            setSettingsError(e.message || 'Failed to add bank account');
        } finally {
            setSettingsLoading(false);
        }
    };

    const editBankAccount = async (accountId: string) => {
        if (!user || !bankForm.accountNumber || !bankForm.bankName || !bankForm.fullName) {
            setSettingsError('Please fill in all required bank account fields');
            return;
        }

        try {
            setSettingsLoading(true);
            setSettingsError(null);

            const updatedAccounts = bankAccounts.map(account => 
                account.id === accountId 
                    ? { ...account, accountNumber: bankForm.accountNumber, branch: bankForm.branch, bankName: bankForm.bankName, fullName: bankForm.fullName }
                    : account
            );

            setBankAccounts(updatedAccounts);

            // Save to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                bankAccounts: updatedAccounts
            });

            // Clear form
            setBankForm({ accountNumber: '', branch: '', bankName: '', fullName: '' });
            setEditingBankId(null);
            setSettingsSuccess('Bank account updated successfully!');
        } catch (e: any) {
            setSettingsError(e.message || 'Failed to update bank account');
        } finally {
            setSettingsLoading(false);
        }
    };

    const deleteBankAccount = async (accountId: string) => {
        console.log(`Deleting bank account with ID: ${accountId}`);
        if (!user) return;

        try {
            setSettingsLoading(true);
            setSettingsError(null);

            // Check if there are any active listings with bank transfer enabled
            const listingsQuery = query(
                collection(db, "listings"),
                where("owner", "==", user.uid),
                where("bankTransfer", "==", true)
            );
            
            const listingsSnapshot = await getDocs(listingsQuery);
            
            if (!listingsSnapshot.empty) {
                const listingNames = listingsSnapshot.docs
                    .map(doc => doc.data().name || 'Unnamed listing')
                    .slice(0, 3); // Show first 3 listings
                
                const listingText = listingNames.length > 3 
                    ? `${listingNames.join(', ')} and ${listingsSnapshot.docs.length - 3} more`
                    : listingNames.join(', ');
                
                setSettingsError(
                    `Cannot delete bank account. The following listing(s) have bank transfer enabled: ${listingText}. Please disable bank transfer on all listings before deleting this account.`
                );
                setSettingsLoading(false);
                return;
            }

            // Confirm before deletion
            const confirmed = await showConfirmDialog({
                title: "Delete Bank Account",
                message: "Are you sure you want to delete this bank account? This action cannot be undone.",
                confirmText: "Delete",
                cancelText: "Cancel",
                type: "danger"
            });
            
            if (!confirmed) {
                setSettingsLoading(false);
                return;
            }

            const updatedAccounts = bankAccounts.filter(account => account.id !== accountId);
            
            // If deleted account was default and there are other accounts, make the first one default
            if (updatedAccounts.length > 0) {
                const deletedAccount = bankAccounts.find(account => account.id === accountId);
                if (deletedAccount?.isDefault) {
                    updatedAccounts[0].isDefault = true;
                }
            }

            setBankAccounts(updatedAccounts);

            // Save to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                bankAccounts: updatedAccounts
            });

            setSettingsSuccess('Bank account deleted successfully!');
        } catch (e: any) {
            console.error('Bank account deletion error:', e);
            setSettingsError(e.message || 'Failed to delete bank account');
        } finally {
            setSettingsLoading(false);
        }
    };

    const setDefaultBankAccount = async (accountId: string) => {
        if (!user) return;

        try {
            setSettingsLoading(true);
            setSettingsError(null);

            const updatedAccounts = bankAccounts.map(account => ({
                ...account,
                isDefault: account.id === accountId
            }));

            setBankAccounts(updatedAccounts);

            // Save to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                bankAccounts: updatedAccounts
            });

            setSettingsSuccess('Default bank account updated!');
        } catch (e: any) {
            setSettingsError(e.message || 'Failed to update default bank account');
        } finally {
            setSettingsLoading(false);
        }
    };

    const startEditingBank = (account: BankAccount) => {
        setBankForm({
            accountNumber: account.accountNumber,
            branch: account.branch,
            bankName: account.bankName,
            fullName: account.fullName
        });
        setEditingBankId(account.id);
        setIsAddingBank(false);
    };

    const cancelBankEdit = () => {
        setBankForm({ accountNumber: '', branch: '', bankName: '', fullName: '' });
        setEditingBankId(null);
        setIsAddingBank(false);
    };

    // Dashboard state
    const [selectedTab, setSelectedTab] = useState<"profile" | "shops" | "orders" | "listings" | "earnings" | "stock" | "settings">("profile");

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [listings, setListings] = useState<any[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [listingsPage, setListingsPage] = useState(1);
    const [listingsCursors, setListingsCursors] = useState<any[]>([null]); // Array of cursors for each page
    const [listingsTotalCount, setListingsTotalCount] = useState(0);
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
                    // Load bank details (legacy single account)
                    if (data.bankDetails) setBankForm(data.bankDetails);
                    // Load bank accounts (new multiple accounts)
                    if (data.bankAccounts) {
                        setBankAccounts(data.bankAccounts);
                    } else if (data.bankDetails) {
                        // Migrate legacy single bank account to new format
                        const legacyAccount: BankAccount = {
                            id: generateBankAccountId(),
                            ...data.bankDetails,
                            isDefault: true,
                            createdAt: new Date()
                        };
                        setBankAccounts([legacyAccount]);
                    }
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

    // Listings fetching - Server-side pagination
    const fetchListings = async (page: number) => {
        if (selectedTab !== "listings" || !profileUid) return;
        setListingsLoading(true);
        try {
            // First get the total count for accurate pagination
            if (page === 1) {
                const countQuery = query(
                    collection(db, "listings"),
                    where("owner", "==", profileUid)
                );
                const countSnapshot = await getDocs(countQuery);
                setListingsTotalCount(countSnapshot.size);
            }

            // Build paginated listings query - directly query by owner
            let listingsQuery;
            
            if (page === 1) {
                // First page - use document ID for ordering (always exists)
                listingsQuery = query(
                    collection(db, "listings"), 
                    where("owner", "==", profileUid),
                    orderBy("__name__", "desc"),
                    limit(LISTINGS_PER_PAGE)
                );
            } else {
                // Subsequent pages - use cursor with document ID ordering
                const cursor = listingsCursors[page - 2]; // previous page's last doc
                if (!cursor) {
                    setListingsLoading(false);
                    return;
                }
                listingsQuery = query(
                    collection(db, "listings"), 
                    where("owner", "==", profileUid),
                    orderBy("__name__", "desc"),
                    startAfter(cursor),
                    limit(LISTINGS_PER_PAGE)
                );
            }

            const listingsSnapshot = await getDocs(listingsQuery);
            const newListings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setListings(newListings);
            setListingsPage(page);
            
            // Update cursors for pagination
            if (listingsSnapshot.docs.length > 0) {
                const newCursors = [...listingsCursors];
                newCursors[page - 1] = listingsSnapshot.docs[listingsSnapshot.docs.length - 1];
                setListingsCursors(newCursors);
            }
            
        } catch (err) {
            console.error("Error loading listings:", err);
            setListings([]);
        } finally {
            setListingsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTab === "listings") {
            setListingsCursors([null]); // Reset cursors
            fetchListings(1); // Always start from page 1 when tab changes
        }
    }, [selectedTab, profileUid]);

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

    const handleEditListing = (listingId: string) => {
        navigate(`/listing/${listingId}/edit`);
    };

    const handleDeleteListing = async (listingId: string) => {
        const confirmed = await showConfirmDialog({
            title: "Delete Listing",
            message: "Are you sure you want to delete this listing?",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });
        if (!confirmed) return;
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

    // Pagination logic for listings - server-side pagination
    const totalPages = Math.ceil(listingsTotalCount / LISTINGS_PER_PAGE);
    const paginatedListings = listings; // Already paginated from server

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <ResponsiveHeader />
            
            {/* Dashboard Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Dashboard Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                            <p className="text-gray-600">Manage your account, shops, orders and more</p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Welcome back, {displayName || user?.email?.split('@')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-green-600">
                                {TABS.find(tab => tab.key === selectedTab)?.icon}
                            </span>
                            <span className="font-medium text-gray-900">
                                {TABS.find(tab => tab.key === selectedTab)?.label}
                            </span>
                        </div>
                        {sidebarOpen ? <FiX size={20} className="text-gray-500" /> : <FiMenu size={20} className="text-gray-500" />}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className={`lg:w-72 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                            {/* Profile Header in Sidebar */}
                            <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                        {photoURL ? (
                                            <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-white">
                                                {displayName ? displayName[0] : user?.email ? user.email[0] : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{displayName || user?.email?.split('@')[0]}</h3>
                                        <p className="text-green-100 text-sm truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Navigation */}
                            <nav className="p-2">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => { 
                                            setSelectedTab(tab.key as any); 
                                            setSidebarOpen(false); 
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg font-medium transition-all duration-200 text-left group ${
                                            selectedTab === tab.key
                                                ? 'bg-green-50 text-green-700 shadow-sm border border-green-200'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className={`transition-colors group-hover:scale-110 transform duration-200 ${
                                            selectedTab === tab.key ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                            {tab.icon}
                                        </span>
                                        <span className="text-sm font-medium">{tab.label}</span>
                                        {selectedTab === tab.key && (
                                            <div className="ml-auto w-2 h-2 bg-green-600 rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Tab Header */}
                            <div className="border-b border-gray-200 px-6 py-5 bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-green-600">
                                        {TABS.find(tab => tab.key === selectedTab)?.icon}
                                    </span>
                                    <h2 className="text-xl font-semibold text-gray-900 capitalize">
                                        {selectedTab.replace(/([A-Z])/g, ' $1').trim()}
                                    </h2>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                    {/* PROFILE TAB */}
                    {selectedTab === "profile" && (
                        <div className="max-w-4xl mx-auto">
                            {/* Profile Card */}
                            <div className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl ${isMobile ? 'p-4' : 'p-8'} mb-6 border border-green-100`}>
                                <div className="text-center">
                                    {/* Profile Picture */}
                                    <div className={`relative inline-block ${isMobile ? 'mb-4' : 'mb-6'}`}>
                                        <div className={`${isMobile ? 'w-20 h-20' : 'w-32 h-32'} rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative group`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                            {photoURL ? (
                                                <img src={photoURL} alt="Profile" className="object-cover w-full h-full" />
                                            ) : (
                                                <span className={`${isMobile ? 'text-2xl' : 'text-5xl'} font-bold text-green-600`}>
                                                    {displayName ? displayName[0] : user?.email ? user.email[0] : ''}
                                                </span>
                                            )}
                                            {isOwner && editing && (
                                                <>
                                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                                        <span className={`text-white font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>Change</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} disabled={uploadingPic} />
                                                    </label>
                                                    {uploadingPic && (
                                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-green-600 font-bold rounded-full">
                                                            <div className={`animate-spin rounded-full ${isMobile ? 'h-5 w-5' : 'h-8 w-8'} border-b-2 border-green-600`}></div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {verifyForm.isVerified === VerificationStatus.COMPLETED && (
                                            <div className={`absolute ${isMobile ? '-bottom-1 -right-1' : '-bottom-2 -right-2'} bg-green-500 rounded-full ${isMobile ? 'p-1' : 'p-2'} border-4 border-white shadow-lg`}>
                                                <svg viewBox="0 0 20 20" fill="white" className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}>
                                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className={`${isMobile ? 'mb-3' : 'mb-4'} px-2`}>
                                        {isOwner && editing ? (
                                            <input
                                                className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-center border-2 border-green-200 rounded-xl ${isMobile ? 'px-3 py-2' : 'px-4 py-2'} w-full max-w-sm mx-auto bg-white/80 backdrop-blur focus:border-green-500 focus:outline-none transition-colors`}
                                                value={displayName}
                                                onChange={e => setDisplayName(e.target.value)}
                                                maxLength={40}
                                                placeholder="Enter your name"
                                            />
                                        ) : (
                                            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 flex items-center justify-center gap-3 break-words`}>
                                                {displayName || profileEmail}
                                            </h1>
                                        )}
                                        <p className={`text-gray-600 mt-2 ${isMobile ? 'text-sm' : ''} break-all`}>{profileEmail}</p>
                                    </div>

                                    {/* Description */}
                                    <div className={`${isMobile ? 'mb-4' : 'mb-6'} px-2`}>
                                        {isOwner && editing ? (
                                            <textarea
                                                className={`w-full max-w-lg mx-auto border-2 border-green-200 rounded-xl ${isMobile ? 'p-3' : 'p-4'} bg-white/80 backdrop-blur focus:border-green-500 focus:outline-none transition-colors resize-none ${isMobile ? 'text-sm' : ''}`}
                                                rows={isMobile ? 2 : 3}
                                                value={desc}
                                                onChange={e => setDesc(e.target.value)}
                                                placeholder="Write something about yourself..."
                                                maxLength={300}
                                            />
                                        ) : (
                                            <p className={`text-gray-700 max-w-lg mx-auto leading-relaxed ${isMobile ? 'text-sm' : ''} break-words`}>
                                                {desc || <span className="text-gray-500 italic">No description yet.</span>}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {isOwner && (
                                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-center gap-3'} px-2`}>
                                            {editing ? (
                                                <>
                                                    <button
                                                        className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                    >
                                                        {saving ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <div className={`animate-spin rounded-full ${isMobile ? 'h-3 w-3' : 'h-4 w-4'} border-b-2 border-white`}></div>
                                                                Saving...
                                                            </span>
                                                        ) : (
                                                            'Save Changes'
                                                        )}
                                                    </button>
                                                    <button
                                                        className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors`}
                                                        onClick={() => setEditing(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-white hover:bg-gray-50 text-green-600 font-semibold rounded-xl transition-colors border-2 border-green-200 hover:border-green-300 shadow-lg`}
                                                    onClick={() => setEditing(true)}
                                                >
                                                    Edit Profile
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHOPS TAB */}
                    {selectedTab === "shops" && (
                        <div>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {isOwner ? "Your Shops" : "Shops"}
                                    </h2>
                                    <p className="text-gray-600">Manage your online storefronts</p>
                                </div>
                                {isOwner && (
                                    <Link
                                        to="/create-shop"
                                        className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Create New Shop
                                    </Link>
                                )}
                            </div>

                            {shops.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                        <FiShoppingBag className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                        Create your first shop to start selling products on our marketplace.
                                    </p>
                                    {isOwner && (
                                        <Link
                                            to="/create-shop"
                                            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {shops.map(shop => (
                                        <div
                                            key={shop.id}
                                            className="bg-white rounded-2xl border border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg group overflow-hidden flex flex-col"
                                        >
                                            {/* Shop Header */}
                                            <div className="p-6 pb-4 flex-1 flex flex-col">
                                                <Link
                                                    to={`/shop/${shop.username}`}
                                                    className="block text-decoration-none"
                                                >
                                                    <div className="flex items-center gap-4 mb-4">
                                                        {shop.logo ? (
                                                            <img 
                                                                src={shop.logo} 
                                                                alt={shop.name} 
                                                                className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 group-hover:border-green-300 transition-colors" 
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-green-100 to-green-200 text-green-700 border-2 border-gray-200 group-hover:border-green-300 transition-colors">
                                                                {shop.name[0]}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors truncate">
                                                                {shop.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">@{shop.username}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                                
                                                {/* Always reserve space for description (2 lines) */}
                                                <div className="h-10 mb-4">
                                                    <p className="text-gray-600 text-sm line-clamp-2 h-full">
                                                        {shop.description || ""}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Shop Actions - Always at bottom */}
                                            {isOwner && (
                                                <div className="px-6 pb-6 mt-auto">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => navigate(`/edit-shop/${shop.id}`)}
                                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                        >
                                                            Edit Shop
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const confirmed = await showConfirmDialog({
                                                                    title: "Delete Shop",
                                                                    message: "Are you sure you want to delete this shop? This action cannot be undone.",
                                                                    confirmText: "Delete",
                                                                    cancelText: "Cancel",
                                                                    type: "danger"
                                                                });
                                                                if (!confirmed) return;
                                                                try {
                                                                    await deleteDoc(doc(db, "shops", shop.id));
                                                                    setShops(prev => prev.filter(s => s.id !== shop.id));
                                                                } catch (err) {
                                                                    alert("Failed to delete shop. Try again.");
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
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
                            {/* Header */}
                            <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
                                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>Orders</h2>
                                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Track your buying and selling activities</p>
                            </div>

                            {/* Sub-tabs */}
                            <div className={`border-b border-gray-200 ${isMobile ? 'mb-6' : 'mb-8'}`}>
                                <nav className={`flex ${isMobile ? 'space-x-4' : 'space-x-8'}`}>
                                    {ORDER_SUBTABS.map(subTab => (
                                        <button
                                            key={subTab.key}
                                            className={`${isMobile ? 'py-3 px-1' : 'py-4 px-1'} border-b-2 font-medium ${isMobile ? 'text-sm' : 'text-sm'} transition-colors ${
                                                orderSubTab === subTab.key
                                                    ? 'border-green-500 text-green-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                            onClick={() => setOrderSubTab(subTab.key as "buyer" | "seller")}
                                        >
                                            {subTab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {ordersLoading ? (
                                <div className={`flex items-center justify-center ${isMobile ? 'py-12' : 'py-16'}`}>
                                    <div className={`animate-spin rounded-full ${isMobile ? 'h-8 w-8' : 'h-12 w-12'} border-b-2 border-green-600`}></div>
                                    <span className={`ml-3 text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Loading orders...</span>
                                </div>
                            ) : (
                                <div>
                                    {/* As Buyer */}
                                    {orderSubTab === "buyer" && (
                                        <div>
                                            {buyerOrders.length === 0 ? (
                                                <div className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
                                                    <div className={`mx-auto ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-gray-100 rounded-full flex items-center justify-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                                                        <FiList className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400`} />
                                                    </div>
                                                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>No orders yet</h3>
                                                    <p className={`text-gray-600 ${isMobile ? 'mb-4 max-w-xs text-sm' : 'mb-6 max-w-sm'} mx-auto px-4`}>
                                                        When you purchase items, they'll appear here.
                                                    </p>
                                                    <Link
                                                        to="/search"
                                                        className={`inline-flex items-center ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors`}
                                                    >
                                                        Start Shopping
                                                    </Link>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`space-y-${isMobile ? '3' : '4'}`}>
                                                        {buyerOrders.map((order: any) => (
                                                            <Link
                                                                to={`/order/${order.id}`}
                                                                key={order.id}
                                                                className={`block bg-white border border-gray-200 rounded-xl ${isMobile ? 'p-4' : 'p-6'} hover:border-green-300 hover:shadow-md transition-all duration-200 group`}
                                                            >
                                                                <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                                                                    <img
                                                                        src={order.itemImage || '/placeholder.png'}
                                                                        alt={order.itemName}
                                                                        className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} object-cover rounded-lg border border-gray-200 flex-shrink-0`}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} text-gray-900 group-hover:text-green-600 transition-colors truncate mb-1`}>
                                                                            {order.itemName}
                                                                        </h3>
                                                                        <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-4'} ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                                                            <span>
                                                                                Status: <span className={`font-medium ${
                                                                                    order.status === OrderStatus.PENDING_PAYMENT ? 'text-orange-600' :
                                                                                    order.status === OrderStatus.CANCELLED ? 'text-red-600' :
                                                                                    order.status === OrderStatus.REFUND_REQUESTED ? 'text-yellow-600' :
                                                                                    order.status === OrderStatus.REFUNDED ? 'text-red-600' :
                                                                                    order.status === OrderStatus.RECEIVED ? 'text-green-600' :
                                                                                    order.status === OrderStatus.SHIPPED ? 'text-blue-600' :
                                                                                    order.status === OrderStatus.DELIVERED ? 'text-green-600' :
                                                                                    'text-gray-600'
                                                                                }`}>
                                                                                    {order.status === OrderStatus.PENDING_PAYMENT && 'Awaiting Payment'}
                                                                                    {order.status === OrderStatus.CANCELLED && 'Order Cancelled'}
                                                                                    {order.status === OrderStatus.REFUND_REQUESTED && 'Refund Requested'}
                                                                                    {order.status === OrderStatus.REFUNDED && 'Order Refunded'}
                                                                                    {order.status === OrderStatus.RECEIVED && 'Order Completed'}
                                                                                    {order.status === OrderStatus.SHIPPED && 'Order Shipped'}
                                                                                    {order.status === OrderStatus.PENDING && 'Order Pending'}
                                                                                    {order.status === OrderStatus.CONFIRMED && 'Order Confirmed'}
                                                                                    {order.status === OrderStatus.DELIVERED && 'Order Delivered'}
                                                                                </span>
                                                                            </span>
                                                                            {!isMobile && <span>•</span>}
                                                                            <span className="truncate">Seller: {order.sellerName || order.sellerId}</span>
                                                                        </div>
                                                                        {isMobile && (
                                                                            <div className="mt-2">
                                                                                <div className="text-lg font-bold text-green-600">
                                                                                    LKR {order.total?.toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {!isMobile && (
                                                                        <div className="text-right flex-shrink-0">
                                                                            <div className="text-xl font-bold text-green-600">
                                                                                LKR {order.total?.toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Buyer Orders Pagination */}
                                                    {totalOrderPages > 1 && (
                                                        <div className="mt-8 flex justify-center">
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
                                                <div className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
                                                    <div className={`mx-auto ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-gray-100 rounded-full flex items-center justify-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                                                        <FiShoppingBag className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400`} />
                                                    </div>
                                                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>No sales yet</h3>
                                                    <p className={`text-gray-600 ${isMobile ? 'mb-4 max-w-xs text-sm' : 'mb-6 max-w-sm'} mx-auto px-4`}>
                                                        When customers purchase your items, orders will appear here.
                                                    </p>
                                                    <Link
                                                        to="/add-listing"
                                                        className={`inline-flex items-center ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors`}
                                                    >
                                                        Create Listing
                                                    </Link>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`space-y-${isMobile ? '3' : '4'}`}>
                                                        {sellerOrders.map((order: any) => (
                                                            <OrderSellerRow key={order.id} order={order} setSellerOrders={setSellerOrders} />
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Seller Orders Pagination */}
                                                    {totalOrderPages > 1 && (
                                                        <div className="mt-8 flex justify-center">
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
                            ) : listingsTotalCount === 0 ? (
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
                                                onClick={() => fetchListings(Math.max(listingsPage - 1, 1))}
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
                                                    onClick={() => fetchListings(i + 1)}
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
                                                onClick={() => fetchListings(Math.min(listingsPage + 1, totalPages))}
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
                    {/* EARNINGS TAB */}
                    {selectedTab === "earnings" && (
                        <EarningsPage profileUid={profileUid} />
                    )}

                    {/* STOCK MANAGEMENT TAB */}
                    {selectedTab === "stock" && (
                        <StockManagement profileUid={profileUid} />
                    )}

                    {/* SETTINGS TAB */}
                    {selectedTab === "settings" && (
                        <div>
                            <h2 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>Settings</h2>
                            <form className="w-full space-y-8" onSubmit={e => { e.preventDefault(); }}>
                                {settingsLoading && <div style={{ color: '#72b01d' }}>Saving...</div>}
                                {settingsSuccess && <div style={{ color: '#3f7d20' }}>{settingsSuccess}</div>}
                                {settingsError && <div style={{ color: '#d32f2f' }}>{settingsError}</div>}

                                {/* Bank Account Management */}
                                <div className={`rounded-xl border w-full ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>Bank Accounts for Payouts</h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingBank(true);
                                                setEditingBankId(null);
                                                setBankForm({ accountNumber: '', branch: '', bankName: '', fullName: '' });
                                            }}
                                            className={`rounded-lg font-semibold transition ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'}`}
                                            style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#3f7d20';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#72b01d';
                                            }}
                                        >
                                            + Add Bank Account
                                        </button>
                                    </div>

                                    {/* Bank Accounts List */}
                                    {bankAccounts.length > 0 && (
                                        <div className="space-y-3 mb-4">
                                            {bankAccounts.map((account) => (
                                                <div key={account.id} className={`p-4 rounded-lg border ${account.isDefault ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#0d0a0b' }}>
                                                                    {account.bankName}
                                                                </h4>
                                                                {account.isDefault && (
                                                                    <span className={`px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>
                                                                <div><span className="font-medium">Account:</span> {account.accountNumber}</div>
                                                                <div><span className="font-medium">Branch:</span> {account.branch}</div>
                                                                <div><span className="font-medium">Name:</span> {account.fullName}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 ml-4">
                                                            {!account.isDefault && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDefaultBankAccount(account.id)}
                                                                    className={`px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 transition ${isMobile ? 'text-xs' : 'text-sm'}`}
                                                                    disabled={settingsLoading}
                                                                >
                                                                    Set Default
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditingBank(account)}
                                                                className={`px-3 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition ${isMobile ? 'text-xs' : 'text-sm'}`}
                                                                disabled={settingsLoading}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteBankAccount(account.id)}
                                                                className={`px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 transition ${isMobile ? 'text-xs' : 'text-sm'}`}
                                                                disabled={settingsLoading}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add/Edit Bank Account Form */}
                                    {(isAddingBank || editingBankId) && (
                                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 mb-4">
                                            <h4 className={`font-semibold mb-3 ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#0d0a0b' }}>
                                                {editingBankId ? 'Edit Bank Account' : 'Add New Bank Account'}
                                            </h4>
                                            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                <div>
                                                    <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>
                                                        Bank Account Number *
                                                    </label>
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
                                                        placeholder="Enter account number"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>
                                                        Branch Name
                                                    </label>
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
                                                        placeholder="Enter branch name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>
                                                        Bank Name *
                                                    </label>
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
                                                        placeholder="Enter bank name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block font-semibold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955' }}>
                                                        Full Name as in Bank *
                                                    </label>
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
                                                        placeholder="Enter full name as in bank"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={editingBankId ? () => editBankAccount(editingBankId) : addBankAccount}
                                                    disabled={settingsLoading || !bankForm.accountNumber || !bankForm.bankName || !bankForm.fullName}
                                                    className={`px-4 py-2 rounded font-semibold transition ${isMobile ? 'text-xs' : 'text-sm'}`}
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
                                                >
                                                    {settingsLoading ? 'Saving...' : (editingBankId ? 'Update Account' : 'Add Account')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelBankEdit}
                                                    className={`px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition ${isMobile ? 'text-xs' : 'text-sm'}`}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {bankAccounts.length === 0 && !isAddingBank && (
                                        <div className="text-center py-8" style={{ color: '#454955' }}>
                                            <div className="mb-2">No bank accounts added yet</div>
                                            <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Add a bank account to receive payouts from your sales</div>
                                        </div>
                                    )}
                                </div>

                                {/* Seller Verification */}
                                <div className={`rounded-2xl border w-full shadow-sm flex flex-col ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <h3 className={`font-bold mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>Verified User Badge</h3>
                                    
                                    {/* Verified Status */}
                                    {verifyForm.isVerified === VerificationStatus.COMPLETED && (
                                        <div className={`w-full flex flex-col items-center gap-2 ${isMobile ? 'py-6' : 'py-8'}`}>
                                            <div className={`rounded-full mb-2 ${isMobile ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.15)' }}>
                                                <svg width={isMobile ? "28" : "36"} height={isMobile ? "28" : "36"} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#72b01d" fillOpacity="0.12" /><path d="M8 12.5l2.5 2.5 5-5" stroke="#3f7d20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                            <div className={`font-semibold text-center ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#3f7d20' }}>You are a verified user!</div>
                                            <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#454955', opacity: 0.8 }}>Your account has been verified and it will cause to gain more trust from buyers and sellers.</div>
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
                                                        <div className={`text-blue-700 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>📋 Complete your user verification</div>
                                                        <div className={`text-blue-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>Submit your documents to become a verified user and gain other users trust.</div>
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
                        </div>                            )}

                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <Footer />
            <ConfirmDialog
                isOpen={isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                type={confirmDialog.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
