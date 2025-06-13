import { useEffect, useState } from "react";
import { db } from "../../../utils/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useResponsive } from "../../../hooks/useResponsive";
import { OrderStatus } from "../../../types/enums";

interface EarningsPageProps {
    profileUid: string | null;
}

export default function EarningsPage({ profileUid }: EarningsPageProps) {
    const { isMobile } = useResponsive();
    
    // Earnings state
    const [earnings, setEarnings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Date range state
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1); // Default to last month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Calculate total earnings from orders
    const calculateTotalEarnings = (orders: any[]) => {
        return orders.reduce((total, order) => {
            return total + (order.total || 0);
        }, 0);
    };

    // Fetch earnings data with date range filter
    const fetchEarningsData = async () => {
        if (!profileUid) return;
        
        setLoading(true);
        try {
            console.log("Fetching earnings for profileUid:", profileUid);
            console.log("Date range:", startDate, "to", endDate);
            
            // Convert dates to Firestore timestamps
            const startTimestamp = new Date(startDate + 'T00:00:00');
            const endTimestamp = new Date(endDate + 'T23:59:59');
            
            console.log("Timestamp range:", startTimestamp, "to", endTimestamp);

            // Query orders with date range filter
            const q = query(
                collection(db, "orders"),
                where("sellerId", "==", profileUid),
                where("createdAt", ">=", startTimestamp),
                where("createdAt", "<=", endTimestamp),
                orderBy("createdAt", "desc")
            );
            
            const snapshot = await getDocs(q);
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            
            console.log("Orders fetched:", orders.length);
            
            // Filter for completed orders only (orders that should count as earnings)
            const completedOrders = orders.filter((order: any) => 
                order.status === OrderStatus.RECEIVED || 
                order.status === OrderStatus.DELIVERED || 
                order.status === OrderStatus.SHIPPED ||
                order.status === OrderStatus.CONFIRMED
            );
            
            console.log("Completed orders:", completedOrders.length);
            if (completedOrders.length > 0) {
                console.log("Sample order:", completedOrders[0]);
            }
            
            setEarnings(completedOrders);
        } catch (err) {
            console.error("Error loading earnings:", err);
            setEarnings([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when profileUid or date range changes
    useEffect(() => {
        fetchEarningsData();
    }, [profileUid, startDate, endDate]);

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 ${isMobile ? 'flex-col gap-4' : ''}`}>
                <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>Your Earnings</h2>
                
                {/* Date Range Selector */}
                <div className={`flex items-center gap-3 ${isMobile ? 'flex-col w-full' : ''}`}>
                    <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                        <label className="text-sm font-medium text-gray-600">From:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`border border-gray-300 rounded px-3 py-1 text-sm ${isMobile ? 'flex-1' : ''}`}
                            max={endDate}
                        />
                    </div>
                    <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                        <label className="text-sm font-medium text-gray-600">To:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`border border-gray-300 rounded px-3 py-1 text-sm ${isMobile ? 'flex-1' : ''}`}
                            min={startDate}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-600">Loading earnings data...</div>
                </div>
            ) : (
                <>
                    {/* Earnings Summary */}
                    <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                        {/* Total Earnings */}
                        <div className={`rounded-xl flex flex-col items-center justify-center ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <div className="text-sm mb-2 font-medium" style={{ color: '#454955', opacity: 0.8 }}>Total Earnings</div>
                            <div className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`} style={{ color: '#3f7d20' }}>
                                LKR {calculateTotalEarnings(earnings).toLocaleString()}
                            </div>
                            <div className="text-xs mt-1 text-center" style={{ color: '#454955', opacity: 0.7 }}>
                                From {formatDate(startDate)} to {formatDate(endDate)}
                            </div>
                        </div>

                        {/* Number of Orders */}
                        <div className={`rounded-xl flex flex-col items-center justify-center ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <div className="text-sm mb-2 font-medium" style={{ color: '#454955', opacity: 0.8 }}>Completed Orders</div>
                            <div className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`} style={{ color: '#72b01d' }}>
                                {earnings.length}
                            </div>
                            <div className="text-xs mt-1 text-center" style={{ color: '#454955', opacity: 0.7 }}>
                                Orders in selected period
                            </div>
                        </div>

                        {/* Average Order Value */}
                        <div className={`rounded-xl flex flex-col items-center justify-center ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <div className="text-sm mb-2 font-medium" style={{ color: '#454955', opacity: 0.8 }}>Average Order Value</div>
                            <div className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`} style={{ color: '#454955' }}>
                                LKR {earnings.length > 0 ? Math.round(calculateTotalEarnings(earnings) / earnings.length).toLocaleString() : '0'}
                            </div>
                            <div className="text-xs mt-1 text-center" style={{ color: '#454955', opacity: 0.7 }}>
                                Per completed order
                            </div>
                        </div>
                    </div>

                    {/* Earnings Information */}
                    <div className={`mb-6 rounded-xl ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', border: '1px solid rgba(114, 176, 29, 0.2)' }}>
                        <h3 className={`font-bold mb-3 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>Earnings Information</h3>
                        <div className={`space-y-2 ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                            <p>• Earnings are calculated from completed orders (Confirmed, Shipped, Delivered, Received status)</p>
                            <p>• Select a custom date range to view earnings for specific periods</p>
                            <p>• All amounts are in Sri Lankan Rupees (LKR)</p>
                            <p>• Cancelled, pending, or refunded orders are not included in earnings calculations</p>
                        </div>
                    </div>

                    {/* Earnings Details Table */}
                    <div className="mb-6">
                        <h3 className={`font-bold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>Earnings Details</h3>
                        {earnings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border rounded-xl" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                    <thead style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                        <tr>
                                            <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Order ID</th>
                                            <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Date</th>
                                            <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Status</th>
                                            <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Item Name</th>
                                            <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Quantity</th>
                                            <th className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Order Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings
                                            .sort((a, b) => {
                                                const aTime = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
                                                const bTime = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
                                                return bTime - aTime;
                                            })
                                            .map(order => (
                                                <tr key={order.id} className="transition hover:bg-gray-50">
                                                    <td className={`border-b text-left font-mono ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                        {isMobile ? order.id.slice(-8) : order.id}
                                                    </td>
                                                    <td className={`border-b text-left ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                        {order.createdAt && new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className={`border-b text-left ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                        <span className={`px-2 py-1 rounded font-semibold text-xs ${
                                                            order.status === OrderStatus.RECEIVED ? 'bg-green-100 text-green-800' :
                                                            order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-800' :
                                                            order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-800' :
                                                            order.status === OrderStatus.CONFIRMED ? 'bg-cyan-100 text-cyan-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className={`border-b text-left font-semibold ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                        {isMobile ? (order.itemName || '-').slice(0, 15) + (order.itemName?.length > 15 ? '...' : '') : (order.itemName || '-')}
                                                    </td>
                                                    <td className={`border-b text-left ${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'}`} style={{ color: '#454955', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                        {order.quantity || 1}
                                                    </td>
                                                    <td className={`border-b text-left font-bold ${isMobile ? 'px-2 py-2 text-sm' : 'px-4 py-3 text-base'}`} style={{ color: '#3f7d20', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                                                        LKR {order.total?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                    <tfoot style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)' }}>
                                        <tr>
                                            <td colSpan={5} className={`border-t text-right font-bold ${isMobile ? 'px-2 py-3 text-sm' : 'px-4 py-4 text-base'}`} style={{ color: '#0d0a0b', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                                Total Earnings:
                                            </td>
                                            <td className={`border-t text-left font-bold ${isMobile ? 'px-2 py-3 text-base' : 'px-4 py-4 text-lg'}`} style={{ color: '#3f7d20', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                                                LKR {calculateTotalEarnings(earnings).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`} style={{ color: '#454955', opacity: 0.7 }}>
                                <div className="mb-2">No earnings found for the selected date range.</div>
                                <div className="text-sm">Try selecting a different date range or check if you have any completed orders.</div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
