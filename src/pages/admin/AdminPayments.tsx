import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Header from "../../components/UI/Header";
import { hasAdminAccess } from "../../utils/adminConfig";
import { 
    calculatePaymentSchedule, 
    getEligibleOrdersForPayment, 
    calculatePeriodEarnings, 
    formatPaymentDate, 
    getDaysUntilNextPayment,
    initializePaymentSystem,
    type PaymentSchedule
} from "../../utils/paymentSchedule";

// Admin password stored as enum/constant
// const ADMIN_PASSWORD = "7788"; // Replaced with adminConfig import

interface SellerPaymentData {
    sellerId: string;
    sellerEmail: string;
    eligibleOrders: any[];
    totalEarnings: number;
    orderCount: number;
}

interface OrderModalData {
    seller: SellerPaymentData | null;
    isOpen: boolean;
}

export default function AdminPayments() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [loading, setLoading] = useState(false);
    const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null);
    const [sellerPayments, setSellerPayments] = useState<SellerPaymentData[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const sellersPerPage = 10;
    
    // Modal state
    const [orderModal, setOrderModal] = useState<OrderModalData>({
        seller: null,
        isOpen: false
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
            loadPaymentData();
        } else {
            setAuthError("Invalid password");
        }
    };

    const loadPaymentData = async () => {
        setLoading(true);
        try {
            // Initialize payment system
            initializePaymentSystem();
            
            // Calculate payment schedule
            const schedule = calculatePaymentSchedule();
            setPaymentSchedule(schedule);

            // Get all orders for the current payment period
            const ordersQuery = query(
                collection(db, "orders"),
                orderBy("createdAt", "desc")
            );
            
            const ordersSnap = await getDocs(ordersQuery);
            const allOrders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

            // Group orders by seller and calculate payments
            const sellerOrdersMap = new Map<string, any[]>();
            
            allOrders.forEach(order => {
                if (order.sellerId) {
                    if (!sellerOrdersMap.has(order.sellerId)) {
                        sellerOrdersMap.set(order.sellerId, []);
                    }
                    sellerOrdersMap.get(order.sellerId)!.push(order);
                }
            });

            // Calculate eligible orders and earnings for each seller
            const sellerPaymentData: SellerPaymentData[] = [];
            
            for (const [sellerId, orders] of sellerOrdersMap) {
                const eligibleOrders = getEligibleOrdersForPayment(orders, schedule.currentPeriod);
                
                if (eligibleOrders.length > 0) {
                    // Get seller email from users collection
                    const userQuery = query(
                        collection(db, "users"),
                        where("__name__", "==", sellerId)
                    );
                    const userSnap = await getDocs(userQuery);
                    const sellerEmail = userSnap.docs[0]?.data()?.email || "Unknown";

                    sellerPaymentData.push({
                        sellerId,
                        sellerEmail,
                        eligibleOrders,
                        totalEarnings: calculatePeriodEarnings(eligibleOrders),
                        orderCount: eligibleOrders.length
                    });
                }
            }

            // Sort by total earnings (highest first)
            sellerPaymentData.sort((a, b) => b.totalEarnings - a.totalEarnings);
            setSellerPayments(sellerPaymentData);

        } catch (error) {
            console.error("Error loading payment data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(sellerPayments.length / sellersPerPage);
    const startIndex = (currentPage - 1) * sellersPerPage;
    const endIndex = startIndex + sellersPerPage;
    const paginatedSellers = sellerPayments.slice(startIndex, endIndex);

    // Modal handlers
    const openOrderModal = (seller: SellerPaymentData) => {
        setOrderModal({
            seller,
            isOpen: true
        });
    };

    const closeOrderModal = () => {
        setOrderModal({
            seller: null,
            isOpen: false
        });
    };

    // Format order status for display
    const formatOrderStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            case 'received': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get page numbers to show (limit to show max 5 pages at a time)
    const getPageNumbers = () => {
        const maxPagesToShow = 5;
        const halfMax = Math.floor(maxPagesToShow / 2);
        
        if (totalPages <= maxPagesToShow) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        
        let startPage = Math.max(1, currentPage - halfMax);
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };

    if (!user) {
        return <div>Please log in to access this page.</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-md mx-auto pt-20">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: '#0d0a0b' }}>
                            Admin Payment Dashboard
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
            <Header />
            <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                        Admin Payment Dashboard
                    </h1>
                    <p className="text-sm" style={{ color: '#454955' }}>
                        Overview of seller payments for the current payment period
                    </p>
                </div>

                {/* Payment Schedule Overview */}
                {paymentSchedule && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <h3 className="text-sm font-medium mb-2" style={{ color: '#454955' }}>Next Payment Date</h3>
                            <p className="text-2xl font-bold" style={{ color: '#72b01d' }}>
                                {formatPaymentDate(paymentSchedule.nextPaymentDate)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#454955', opacity: 0.7 }}>
                                {getDaysUntilNextPayment(paymentSchedule.nextPaymentDate)} days remaining
                            </p>
                        </div>
                        
                        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <h3 className="text-sm font-medium mb-2" style={{ color: '#454955' }}>Total Sellers</h3>
                            <p className="text-2xl font-bold" style={{ color: '#3f7d20' }}>
                                {sellerPayments.length}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#454955', opacity: 0.7 }}>
                                With eligible orders
                            </p>
                        </div>
                        
                        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <h3 className="text-sm font-medium mb-2" style={{ color: '#454955' }}>Total Payment Amount</h3>
                            <p className="text-2xl font-bold" style={{ color: '#3f7d20' }}>
                                LKR {sellerPayments.reduce((total, seller) => total + seller.totalEarnings, 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#454955', opacity: 0.7 }}>
                                {sellerPayments.reduce((total, seller) => total + seller.orderCount, 0)} orders total
                            </p>
                        </div>
                    </div>
                )}

                {/* Payment Period Info */}
                {paymentSchedule && (
                    <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', border: '1px solid rgba(114, 176, 29, 0.2)' }}>
                        <h3 className="font-bold mb-2" style={{ color: '#0d0a0b' }}>Current Payment Period</h3>
                        <p className="text-sm" style={{ color: '#454955' }}>
                            <strong>Period:</strong> {formatPaymentDate(paymentSchedule.currentPeriod.startDate)} to {formatPaymentDate(paymentSchedule.currentPeriod.endDate)}
                        </p>
                        <p className="text-sm" style={{ color: '#454955' }}>
                            <strong>Payment Date:</strong> {formatPaymentDate(paymentSchedule.currentPeriod.paymentDate)}
                        </p>
                        <p className="text-sm" style={{ color: '#454955' }}>
                            <strong>Eligible:</strong> PayNow orders with status 'Received', 'Shipped', or 'Pending' created within the period
                        </p>
                    </div>
                )}

                {/* Sellers Payment Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b" style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                        <h2 className="text-xl font-bold" style={{ color: '#0d0a0b' }}>
                            Seller Payment Overview
                        </h2>
                    </div>
                    
                    {loading ? (
                        <div className="p-8 text-center" style={{ color: '#454955' }}>
                            Loading payment data...
                        </div>
                    ) : sellerPayments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>
                                            Seller
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>
                                            Orders
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>
                                            Total Earnings
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#0d0a0b' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                    {paginatedSellers.map((seller) => (
                                        <tr key={seller.sellerId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium" style={{ color: '#0d0a0b' }}>
                                                        {seller.sellerEmail}
                                                    </div>
                                                    <div className="text-xs font-mono" style={{ color: '#454955', opacity: 0.7 }}>
                                                        ID: {seller.sellerId.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm" style={{ color: '#454955' }}>
                                                    {seller.orderCount} orders
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold" style={{ color: '#3f7d20' }}>
                                                    LKR {seller.totalEarnings.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => openOrderModal(seller)}
                                                    className="px-3 py-1 rounded-md font-medium text-white transition duration-200"
                                                    style={{ backgroundColor: '#72b01d' }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center" style={{ color: '#454955' }}>
                            No sellers have eligible orders for the current payment period.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sellerPayments.length > sellersPerPage && (
                    <div className="mt-6">
                        <div className="text-center mb-4">
                            <p className="text-sm" style={{ color: '#454955' }}>
                                Showing {startIndex + 1} to {Math.min(endIndex, sellerPayments.length)} of {sellerPayments.length} sellers
                            </p>
                        </div>
                        
                        <div className="flex justify-center items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ 
                                    backgroundColor: currentPage === 1 ? '#e5e7eb' : '#72b01d',
                                    color: currentPage === 1 ? '#9ca3af' : 'white'
                                }}
                            >
                                Previous
                            </button>
                            
                            <div className="flex space-x-1">
                                {currentPage > 3 && totalPages > 5 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            className="px-3 py-2 rounded-md text-sm font-medium"
                                            style={{
                                                backgroundColor: 'white',
                                                color: '#454955',
                                                border: '1px solid rgba(114, 176, 29, 0.3)'
                                            }}
                                        >
                                            1
                                        </button>
                                        {currentPage > 4 && <span className="px-2 py-2 text-sm" style={{ color: '#454955' }}>...</span>}
                                    </>
                                )}
                                
                                {getPageNumbers().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className="px-3 py-2 rounded-md text-sm font-medium"
                                        style={{
                                            backgroundColor: currentPage === page ? '#72b01d' : 'white',
                                            color: currentPage === page ? 'white' : '#454955',
                                            border: currentPage === page ? 'none' : '1px solid rgba(114, 176, 29, 0.3)'
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                                
                                {currentPage < totalPages - 2 && totalPages > 5 && (
                                    <>
                                        {currentPage < totalPages - 3 && <span className="px-2 py-2 text-sm" style={{ color: '#454955' }}>...</span>}
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="px-3 py-2 rounded-md text-sm font-medium"
                                            style={{
                                                backgroundColor: 'white',
                                                color: '#454955',
                                                border: '1px solid rgba(114, 176, 29, 0.3)'
                                            }}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ 
                                    backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#72b01d',
                                    color: currentPage === totalPages ? '#9ca3af' : 'white'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {orderModal.isOpen && orderModal.seller && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[85vh] overflow-hidden">
                            <div className="p-6 border-b" style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold" style={{ color: '#0d0a0b' }}>
                                            Order Details - {orderModal.seller.sellerEmail}
                                        </h2>
                                        <p className="text-sm mt-1" style={{ color: '#454955' }}>
                                            {orderModal.seller.orderCount} eligible orders • 
                                            LKR {orderModal.seller.totalEarnings.toLocaleString()} total earnings
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeOrderModal}
                                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="border-b-2" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/3" style={{ color: '#0d0a0b' }}>
                                                    Order ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: '#0d0a0b' }}>
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: '#0d0a0b' }}>
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: '#0d0a0b' }}>
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: '#0d0a0b' }}>
                                                    Payment Method
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'rgba(114, 176, 29, 0.1)' }}>
                                            {orderModal.seller.eligibleOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-mono break-all" style={{ color: '#454955' }}>
                                                            {order.id}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                            {formatOrderStatus(order.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-medium" style={{ color: '#3f7d20' }}>
                                                            LKR {order.total?.toLocaleString() || order.totalAmount?.toLocaleString() || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm" style={{ color: '#454955' }}>
                                                            {order.createdAt?.toDate ? 
                                                                new Date(order.createdAt.toDate()).toLocaleDateString() : 
                                                                'N/A'
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm" style={{ color: '#454955' }}>
                                                            {order.paymentMethod || 'N/A'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t flex justify-end" style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                <button
                                    onClick={closeOrderModal}
                                    className="px-4 py-2 rounded-lg font-medium text-white transition duration-200"
                                    style={{ backgroundColor: '#72b01d' }}
                                >
                                    Close
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
