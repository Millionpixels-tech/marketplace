import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, limit, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import { hasAdminAccess } from "../../utils/adminConfig";
import { formatPrice } from "../../utils/formatters";
import { FiSearch, FiTrash2, FiUser, FiPackage, FiShoppingBag, FiAlertTriangle, FiExternalLink, FiCheckCircle, FiXCircle, FiEye, FiClock, FiDollarSign } from "react-icons/fi";
import { 
  type WithdrawalRequest 
} from "../../utils/referrals";

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

interface BuyerReport {
    id: string;
    orderId: string;
    sellerId: string;
    sellerName: string;
    buyerId: string;
    buyerName: string;
    buyerEmail: string;
    complaint: string;
    orderDetails: {
        itemName: string;
        itemPrice: number;
        total: number;
        status: string;
        paymentMethod: string;
    };
    reportedAt: any;
    status: string;
    adminNotes?: string;
}

interface VerificationRequest {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    fullName: string;
    submittedAt: any;
    isVerified: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'NO_DATA';
    verification: {
        isVerified: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'NO_DATA';
        fullName?: string;
        address?: string;
        idFrontUrl?: string;
        idBackUrl?: string;
        selfieUrl?: string;
        submittedAt?: any;
    };
    createdAt?: any;
}

type SearchType = 'users' | 'listings' | 'shops' | 'buyerReports' | 'verificationRequests' | 'withdrawalRequests';

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
    
    // Withdrawal processing state
    const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

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
            } else if (searchType === 'buyerReports') {
                results = await searchBuyerReports(searchQuery.trim());
            } else if (searchType === 'verificationRequests') {
                results = await searchVerificationRequests(searchQuery.trim());
            } else if (searchType === 'withdrawalRequests') {
                results = await searchWithdrawalRequests(searchQuery.trim());
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

    const searchBuyerReports = async (searchTerm: string): Promise<BuyerReport[]> => {
        const reports: BuyerReport[] = [];
        
        try {
            // If no search term, get all reports (limited)
            let reportQuery;
            if (!searchTerm) {
                reportQuery = query(
                    collection(db, "buyerReports"),
                    limit(50)
                );
            } else {
                // Search by orderId, buyerName, sellerName, or complaint keywords
                const allReportsQuery = query(collection(db, "buyerReports"), limit(200));
                const allReportsSnap = await getDocs(allReportsQuery);
                const searchTermLower = searchTerm.toLowerCase();
                
                allReportsSnap.docs.forEach(docRef => {
                    const reportData = docRef.data() as DocumentData;
                    if (docRef.id.toLowerCase().includes(searchTermLower) ||
                        reportData.orderId?.toLowerCase().includes(searchTermLower) ||
                        reportData.buyerName?.toLowerCase().includes(searchTermLower) ||
                        reportData.sellerName?.toLowerCase().includes(searchTermLower) ||
                        reportData.buyerEmail?.toLowerCase().includes(searchTermLower) ||
                        reportData.complaint?.toLowerCase().includes(searchTermLower) ||
                        reportData.orderDetails?.itemName?.toLowerCase().includes(searchTermLower)) {
                        
                        reports.push({ id: docRef.id, ...reportData } as BuyerReport);
                        
                        // Limit results
                        if (reports.length >= 50) return;
                    }
                });
                
                return reports;
            }
            
            const reportSnap = await getDocs(reportQuery);
            reportSnap.docs.forEach(docRef => {
                const reportData = docRef.data() as DocumentData;
                reports.push({ id: docRef.id, ...reportData } as BuyerReport);
            });
            
        } catch (error) {
            console.error("Error searching buyer reports:", error);
        }

        return reports;
    };

    const searchVerificationRequests = async (searchTerm: string = ""): Promise<VerificationRequest[]> => {
        const requests: VerificationRequest[] = [];
        
        try {
            // Query users collection where verification.isVerified is PENDING
            let usersQuery;
            if (!searchTerm) {
                // Load all users with pending verification
                usersQuery = query(
                    collection(db, "users"),
                    where("verification.isVerified", "==", "PENDING"),
                    limit(100)
                );
            } else {
                // Search all users and filter by search term and pending status
                const allUsersQuery = query(
                    collection(db, "users"),
                    limit(200)
                );
                const allUsersSnap = await getDocs(allUsersQuery);
                const searchTermLower = searchTerm.toLowerCase();
                
                allUsersSnap.docs.forEach(docRef => {
                    const userData = docRef.data() as DocumentData;
                    const hasVerificationPending = userData.verification?.isVerified === 'PENDING';
                    
                    if (hasVerificationPending && (
                        docRef.id.toLowerCase().includes(searchTermLower) ||
                        userData.email?.toLowerCase().includes(searchTermLower) ||
                        userData.displayName?.toLowerCase().includes(searchTermLower) ||
                        userData.uid?.toLowerCase().includes(searchTermLower) ||
                        userData.verification?.fullName?.toLowerCase().includes(searchTermLower)
                    )) {
                        requests.push({
                            id: docRef.id,
                            userId: userData.uid || docRef.id,
                            userEmail: userData.email || '',
                            userName: userData.displayName || userData.verification?.fullName || 'Unknown User',
                            fullName: userData.verification?.fullName || userData.displayName || '',
                            submittedAt: userData.verification?.submittedAt || userData.createdAt,
                            isVerified: userData.verification?.isVerified || 'NO_DATA',
                            verification: userData.verification || {},
                            createdAt: userData.createdAt
                        } as VerificationRequest);
                        
                        // Limit results
                        if (requests.length >= 100) return;
                    }
                });
                
                return requests;
            }
            
            const usersSnap = await getDocs(usersQuery);
            
            usersSnap.docs.forEach(docRef => {
                const userData = docRef.data() as DocumentData;
                
                requests.push({
                    id: docRef.id,
                    userId: userData.uid || docRef.id,
                    userEmail: userData.email || '',
                    userName: userData.displayName || userData.verification?.fullName || 'Unknown User',
                    fullName: userData.verification?.fullName || userData.displayName || '',
                    submittedAt: userData.verification?.submittedAt || userData.createdAt,
                    isVerified: userData.verification?.isVerified || 'NO_DATA',
                    verification: userData.verification || {},
                    createdAt: userData.createdAt
                } as VerificationRequest);
            });
            
        } catch (error) {
            console.error("Error searching verification requests:", error);
        }

        return requests.sort((a, b) => {
            // Sort by submission date, newest first
            if (a.submittedAt && b.submittedAt) {
                return b.submittedAt.seconds - a.submittedAt.seconds;
            }
            return 0;
        });
    };

    const searchWithdrawalRequests = async (searchTerm: string = ""): Promise<WithdrawalRequest[]> => {
        const withdrawals: WithdrawalRequest[] = [];
        
        try {
            let withdrawalsQuery;
            if (!searchTerm) {
                // Get all withdrawal requests
                withdrawalsQuery = query(collection(db, "withdrawalRequests"));
            } else {
                // Search by user ID or email (we'll need to get user data)
                withdrawalsQuery = query(collection(db, "withdrawalRequests"));
            }
            
            const withdrawalsSnap = await getDocs(withdrawalsQuery);
            
            for (const docRef of withdrawalsSnap.docs) {
                const withdrawalData = docRef.data() as DocumentData;
                const withdrawal = { id: docRef.id, ...withdrawalData } as WithdrawalRequest & { userEmail?: string; userDisplayName?: string };
                
                // Get user data to include email and display name
                const userDoc = await getDoc(doc(db, 'users', withdrawal.userId));
                let userEmail = 'Unknown';
                let userDisplayName = 'Unknown User';
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userEmail = userData.email || 'Unknown';
                    userDisplayName = userData.displayName || 'Unknown User';
                }
                
                // Add user data to withdrawal object
                withdrawal.userEmail = userEmail;
                withdrawal.userDisplayName = userDisplayName;
                
                // If searching, filter by user email or ID
                if (searchTerm) {
                    const searchTermLower = searchTerm.toLowerCase();
                    
                    if (withdrawal.userId.toLowerCase().includes(searchTermLower) ||
                        userEmail.toLowerCase().includes(searchTermLower) ||
                        userDisplayName.toLowerCase().includes(searchTermLower)) {
                        withdrawals.push(withdrawal);
                    }
                } else {
                    withdrawals.push(withdrawal);
                }
            }
        } catch (error) {
            console.error("Error searching withdrawal requests:", error);
        }

        return withdrawals.sort((a, b) => {
            // Sort by request date, newest first
            if (a.requestedAt && b.requestedAt) {
                return b.requestedAt.seconds - a.requestedAt.seconds;
            }
            return 0;
        });
    };

    // Load pending verification requests automatically when tab is selected
    useEffect(() => {
        if (searchType === 'verificationRequests') {
            setSearching(true);
            setHasSearched(true);
            searchVerificationRequests().then(results => {
                setSearchResults(results);
                setSearching(false);
            }).catch(error => {
                console.error("Error loading verification requests:", error);
                setSearching(false);
            });
        } else if (searchType === 'withdrawalRequests') {
            setSearching(true);
            setHasSearched(true);
            searchWithdrawalRequests().then(results => {
                setSearchResults(results);
                setSearching(false);
            }).catch(error => {
                console.error("Error loading withdrawal requests:", error);
                setSearching(false);
            });
        }
    }, [searchType]);

    const handleVerificationAction = async (userId: string, action: 'approve' | 'reject', notes?: string) => {
        try {

            
            // Find the user document
            const userQuery = query(
                collection(db, 'users'),
                where('uid', '==', userId)
            );
            const userSnap = await getDocs(userQuery);
            
            if (userSnap.empty) {
                // Try to find by document ID if uid search fails
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    await updateDoc(userDocRef, {
                        'verification.isVerified': action === 'approve' ? 'COMPLETED' : 'REJECTED',
                        'verification.reviewedAt': serverTimestamp(),
                        'verification.reviewedBy': user?.email || 'admin',
                        'verification.adminNotes': notes || '',
                        'verified': action === 'approve' // Also set the top-level verified field
                    });
                } else {
                    throw new Error('User not found');
                }
            } else {
                const userDoc = userSnap.docs[0];
                await updateDoc(userDoc.ref, {
                    'verification.isVerified': action === 'approve' ? 'COMPLETED' : 'REJECTED',
                    'verification.reviewedAt': serverTimestamp(),
                    'verification.reviewedBy': user?.email || 'admin',
                    'verification.adminNotes': notes || '',
                    'verified': action === 'approve' // Also set the top-level verified field
                });
            }



            // Refresh the search results
            if (searchType === 'verificationRequests') {
                const updatedResults = await searchVerificationRequests(searchQuery);
                setSearchResults(updatedResults);
            }

        } catch (error) {
            console.error('Error updating verification request:', error);
            alert(`Error ${action === 'approve' ? 'approving' : 'rejecting'} verification request. Please try again.`);
        }
    };

    const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject' | 'paid', notes?: string) => {
        try {
            setProcessingWithdrawal(withdrawalId);
            console.log(`Processing withdrawal action: ${action} for ID: ${withdrawalId}`);
            
            const withdrawalRef = doc(db, 'withdrawalRequests', withdrawalId);
            const withdrawalSnap = await getDoc(withdrawalRef);
            
            if (!withdrawalSnap.exists()) {
                throw new Error('Withdrawal request not found');
            }

            const withdrawalData = withdrawalSnap.data();
            console.log('Current withdrawal data:', withdrawalData);
            
            // Update withdrawal status
            await updateDoc(withdrawalRef, {
                status: action,
                reviewedAt: serverTimestamp(),
                reviewedBy: user?.email || 'admin',
                adminNotes: notes || '',
                ...(action === 'paid' && { paidAt: serverTimestamp() })
            });

            console.log(`Withdrawal status updated to: ${action}`);

            // If marked as paid, update user's total withdrawn
            if (action === 'paid') {
                const userRef = doc(db, 'referrals', withdrawalData.userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    await updateDoc(userRef, {
                        totalWithdrawn: (userData.totalWithdrawn || 0) + withdrawalData.amount,
                        updatedAt: serverTimestamp()
                    });
                    console.log(`Updated user totalWithdrawn: ${(userData.totalWithdrawn || 0) + withdrawalData.amount}`);
                }
            }
            
            // If rejected, restore the available balance
            if (action === 'reject') {
                const userRef = doc(db, 'referrals', withdrawalData.userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    await updateDoc(userRef, {
                        availableBalance: (userSnap.data().availableBalance || 0) + withdrawalData.amount,
                        updatedAt: serverTimestamp()
                    });
                    console.log(`Restored user availableBalance: ${(userSnap.data().availableBalance || 0) + withdrawalData.amount}`);
                }
            }

            // Refresh the search results
            if (searchType === 'withdrawalRequests') {
                console.log('Refreshing withdrawal requests...');
                const updatedResults = await searchWithdrawalRequests(searchQuery);
                console.log('Updated results:', updatedResults);
                setSearchResults(updatedResults);
            }

        } catch (error) {
            console.error('Error updating withdrawal request:', error);
            alert(`Error ${action === 'approve' ? 'approving' : action === 'reject' ? 'rejecting' : 'marking as paid'} withdrawal request. Please try again.`);
        } finally {
            setProcessingWithdrawal(null);
        }
    };

    const openDeleteModal = (type: SearchType, item: any) => {
        let itemName = "";
        if (type === 'users') {
            itemName = item.email || item.displayName || "Unknown User";
        } else if (type === 'listings') {
            itemName = item.name || "Unknown Listing";
        } else if (type === 'shops') {
            itemName = item.name || "Unknown Shop";
        } else if (type === 'buyerReports') {
            itemName = `Report for Order ${item.orderId} by ${item.sellerName}`;
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
                

                
                // Delete all listings

                const listingsQuery = query(collection(db, "listings"), where("shopId", "==", shopId));
                const listingsSnap = await getDocs(listingsQuery);

                
                const deleteListingsPromises = listingsSnap.docs.map(docRef => {

                    return deleteDoc(docRef.ref);
                });
                
                // Delete all reviews

                const reviewsQuery = query(collection(db, "reviews"), where("shopId", "==", shopId));
                const reviewsSnap = await getDocs(reviewsQuery);

                
                const deleteReviewsPromises = reviewsSnap.docs.map(docRef => {

                    return deleteDoc(docRef.ref);
                });
                
                // Execute all deletions in parallel

                await Promise.all([...deleteListingsPromises, ...deleteReviewsPromises]);
                
                // Delete shop last

                await deleteDoc(doc(db, "shops", shopId));
                

                setSearchResults(prev => prev.filter(item => item.id !== shopId));
            } else if (deleteModal.type === 'users') {
                // Note: In a real app, you'd want to be very careful about deleting users
                // as it may have cascading effects. For now, we'll just delete the user document.
                await deleteDoc(doc(db, "users", deleteModal.item.id));
                setSearchResults(prev => prev.filter(item => item.id !== deleteModal.item.id));
            } else if (deleteModal.type === 'buyerReports') {
                // Delete buyer report
                await deleteDoc(doc(db, "buyerReports", deleteModal.item.id));
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
                        Search and manage users, listings, shops, buyer reports, and user verification requests
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
                            { type: 'shops' as SearchType, label: 'Shops', icon: FiShoppingBag },
                            { type: 'buyerReports' as SearchType, label: 'Buyer Reports', icon: FiAlertTriangle },
                            { type: 'verificationRequests' as SearchType, label: 'User Verification', icon: FiCheckCircle },
                            { type: 'withdrawalRequests' as SearchType, label: 'Withdrawal Requests', icon: FiDollarSign }
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
                    {searchType !== 'verificationRequests' && (
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
                    )}
                    
                    {searchType === 'verificationRequests' && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-600">
                                All users with pending verification status are automatically loaded. These users have submitted identity documents for review.
                            </p>
                        </div>
                    )}
                </div>

                {/* Search Results */}
                {(hasSearched || searchType === 'verificationRequests' || searchType === 'withdrawalRequests') && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b" style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                            <h2 className="text-xl font-bold" style={{ color: '#0d0a0b' }}>
                                {searchType === 'verificationRequests' ? 'Pending Verification Requests' : 
                                 searchType === 'withdrawalRequests' ? 'Withdrawal Requests' : 'Search Results'} ({searchResults.length})
                            </h2>
                            {searchType === 'verificationRequests' && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Review submitted identity documents (ID front/back, selfie) and approve or reject user verification requests. Click the eye icon to view documents.
                                </p>
                            )}
                            {searchType === 'withdrawalRequests' && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Review and manage user withdrawal requests. Approve pending requests, then mark as paid once the transfer is complete.
                                </p>
                            )}
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
                                            {searchType === 'buyerReports' && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Order ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Buyer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Seller</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Item</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Actions</th>
                                                </>
                                            )}
                                            {searchType === 'verificationRequests' && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>User ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>User Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Submitted</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Documents</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Actions</th>
                                                </>
                                            )}
                                            {searchType === 'withdrawalRequests' && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Requested</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>Bank Details</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[180px]" style={{ color: '#0d0a0b' }}>Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                        {searchResults.map((item) => {
                                            return (
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
                                                {searchType === 'buyerReports' && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <a 
                                                                href={`/order/${item.orderId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium hover:underline flex items-center gap-1"
                                                                style={{ color: '#72b01d' }}
                                                            >
                                                                {item.orderId}
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                <div className="font-medium">{item.buyerName || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-500">{item.buyerEmail}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium" style={{ color: '#454955' }}>
                                                                {item.sellerName || 'Unknown'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                <div className="font-medium">{item.orderDetails?.itemName || 'Unknown Item'}</div>
                                                                <div className="text-xs text-gray-500">{formatPrice(item.orderDetails?.total)}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                item.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                                                item.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {item.status || 'pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs text-gray-500">
                                                                {item.reportedAt ? new Date(item.reportedAt.seconds ? item.reportedAt.seconds * 1000 : item.reportedAt).toLocaleDateString() : 'Unknown'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const complaintText = `Report ID: ${item.id}\nOrder ID: ${item.orderId}\nBuyer: ${item.buyerName} (${item.buyerEmail})\nSeller: ${item.sellerName}\nItem: ${item.orderDetails?.itemName}\nComplaint: ${item.complaint}`;
                                                                        alert(complaintText);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 transition duration-200 text-xs px-2 py-1 border border-blue-200 rounded"
                                                                >
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    onClick={() => openDeleteModal('buyerReports', item)}
                                                                    className="text-red-600 hover:text-red-800 transition duration-200"
                                                                >
                                                                    <FiTrash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {searchType === 'verificationRequests' && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-mono" style={{ color: '#454955' }}>
                                                                {item.userId}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium" style={{ color: '#454955' }}>
                                                                {item.userName || 'Unknown User'}
                                                            </div>
                                                            {item.fullName && item.fullName !== item.userName && (
                                                                <div className="text-xs text-gray-500">
                                                                    {item.fullName}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                {item.userEmail}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                                                item.isVerified === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                item.isVerified === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                item.isVerified === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                <FiClock className="w-3 h-3 mr-1" />
                                                                {item.isVerified || 'PENDING'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs text-gray-500">
                                                                {item.submittedAt ? new Date(item.submittedAt.seconds ? item.submittedAt.seconds * 1000 : item.submittedAt).toLocaleDateString() : 'Unknown'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                {item.verification?.idFrontUrl && (
                                                                    <a 
                                                                        href={item.verification.idFrontUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                                        title="View ID Front"
                                                                    >
                                                                        <FiEye className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {item.verification?.idBackUrl && (
                                                                    <a 
                                                                        href={item.verification.idBackUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                                        title="View ID Back"
                                                                    >
                                                                        <FiEye className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {item.verification?.selfieUrl && (
                                                                    <a 
                                                                        href={item.verification.selfieUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                                        title="View Selfie"
                                                                    >
                                                                        <FiEye className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {!item.verification?.idFrontUrl && !item.verification?.idBackUrl && !item.verification?.selfieUrl && (
                                                                    <span className="text-xs text-gray-400">No documents</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                {item.isVerified === 'PENDING' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleVerificationAction(item.userId, 'approve')}
                                                                            className="text-green-600 hover:text-green-800 transition duration-200"
                                                                            title="Approve Verification"
                                                                        >
                                                                            <FiCheckCircle className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleVerificationAction(item.userId, 'reject')}
                                                                            className="text-red-600 hover:text-red-800 transition duration-200"
                                                                            title="Reject Verification"
                                                                        >
                                                                            <FiXCircle className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {item.isVerified !== 'PENDING' && (
                                                                    <span className="text-xs text-gray-500">
                                                                        {item.isVerified === 'COMPLETED' ? 'Approved' : 'Rejected'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {searchType === 'withdrawalRequests' && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium" style={{ color: '#0d0a0b' }}>
                                                                {item.userDisplayName || item.userEmail || 'Unknown User'}
                                                            </div>
                                                            <div className="text-xs" style={{ color: '#454955' }}>
                                                                {item.userEmail || 'Unknown Email'}
                                                            </div>
                                                            <div className="text-xs" style={{ color: '#454955' }}>
                                                                User ID: {item.userId}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium" style={{ color: '#3f7d20' }}>
                                                                LKR {item.amount?.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                {item.requestedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                item.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                                item.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {item.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm" style={{ color: '#454955' }}>
                                                                {item.bankAccount?.fullName || 'N/A'}
                                                            </div>
                                                            <div className="text-xs" style={{ color: '#454955' }}>
                                                                {item.bankAccount?.accountNumber || 'N/A'}
                                                            </div>
                                                            <div className="text-xs" style={{ color: '#454955' }}>
                                                                {item.bankAccount?.bankName || 'N/A'}
                                                            </div>
                                                            {item.bankAccount?.branch && (
                                                                <div className="text-xs" style={{ color: '#454955' }}>
                                                                    Branch: {item.bankAccount.branch}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 flex-wrap">
                                                                {item.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleWithdrawalAction(item.id, 'approve')}
                                                                            disabled={processingWithdrawal === item.id}
                                                                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition duration-200 rounded-md text-xs font-medium disabled:opacity-50"
                                                                            title="Approve Withdrawal"
                                                                        >
                                                                            <FiCheckCircle className="w-3 h-3" />
                                                                            {processingWithdrawal === item.id ? 'Processing...' : 'Approve'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleWithdrawalAction(item.id, 'paid')}
                                                                            disabled={processingWithdrawal === item.id}
                                                                            className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-800 transition duration-200 rounded-md text-xs font-medium disabled:opacity-50"
                                                                            title="Mark as Paid"
                                                                        >
                                                                            <FiDollarSign className="w-3 h-3" />
                                                                            {processingWithdrawal === item.id ? 'Processing...' : 'Mark Paid'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleWithdrawalAction(item.id, 'reject')}
                                                                            disabled={processingWithdrawal === item.id}
                                                                            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition duration-200 rounded-md text-xs font-medium disabled:opacity-50"
                                                                            title="Reject Withdrawal"
                                                                        >
                                                                            <FiXCircle className="w-3 h-3" />
                                                                            {processingWithdrawal === item.id ? 'Processing...' : 'Reject'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {item.status === 'approved' && (
                                                                    <button
                                                                        onClick={() => handleWithdrawalAction(item.id, 'paid')}
                                                                        disabled={processingWithdrawal === item.id}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-800 transition duration-200 rounded-md text-xs font-medium disabled:opacity-50"
                                                                        title="Mark as Paid"
                                                                    >
                                                                        <FiDollarSign className="w-3 h-3" />
                                                                        {processingWithdrawal === item.id ? 'Processing...' : 'Mark Paid'}
                                                                    </button>
                                                                )}
                                                                {(item.status === 'paid' || item.status === 'rejected') && (
                                                                    <span className="text-xs text-gray-500 px-2 py-1">
                                                                        {item.status === 'paid' ? 'Completed' : 'Rejected'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                            );
                                        })}
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
