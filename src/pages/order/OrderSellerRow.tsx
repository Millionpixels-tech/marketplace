import { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { OrderStatus } from "../../types/enums";

// Function to print delivery label
const printDeliveryLabel = async (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print the delivery label');
        return;
    }

    // Fetch shop information for FROM address
    let shopInfo = null;
    if (order.sellerShopId) {
        try {
            const shopDoc = await getDoc(doc(db, "shops", order.sellerShopId));
            if (shopDoc.exists()) {
                shopInfo = shopDoc.data();
            }
        } catch (error) {
            console.error('Error fetching shop info:', error);
        }
    }

    const labelHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Delivery Label - Order ${order.id}</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #000;
                }
                .label-container {
                    width: 4in;
                    height: 3in;
                    background: white;
                    border: 2px solid #000;
                    padding: 12px;
                    margin: 0 auto;
                    position: relative;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 6px;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 2px;
                }
                .website {
                    font-size: 10px;
                    font-weight: bold;
                    color: #000;
                }
                .main-content {
                    display: flex;
                    gap: 8px;
                    height: calc(100% - 55px);
                }
                .left-column {
                    flex: 3;
                }
                .right-column {
                    flex: 2;
                    border-left: 1px solid #000;
                    padding-left: 8px;
                }
                .section {
                    margin-bottom: 8px;
                }
                .section-title {
                    font-weight: bold;
                    font-size: 9px;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                    border-bottom: 1px solid #000;
                    padding-bottom: 1px;
                }
                .content {
                    font-size: 8px;
                    line-height: 1.2;
                }
                .content strong {
                    font-weight: bold;
                }
                .order-info {
                    position: absolute;
                    bottom: 6px;
                    right: 12px;
                    font-size: 7px;
                    text-align: right;
                }
                .payment-highlight {
                    background: #f0f0f0;
                    padding: 2px 4px;
                    margin-top: 2px;
                    font-weight: bold;
                    border: 1px solid #000;
                    text-align: center;
                    font-size: 7px;
                }
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0;
                        background: white;
                    }
                    .label-container { 
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="label-container">
                <div class="header">
                    <h1>DELIVERY LABEL</h1>
                    <div class="website">sina.lk</div>
                </div>
                
                <div class="main-content">
                    <div class="left-column">
                        <div class="section">
                            <div class="section-title">From (Seller)</div>
                            <div class="content">
                                <strong>${order.sellerShopName || 'Shop'}</strong><br>
                                ${shopInfo?.address ? `${shopInfo.address}` : 'Sri Lankan Shop'}<br>
                                ${shopInfo?.mobile ? `Phone: +94${shopInfo.mobile}` : ''}
                            </div>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">To (Buyer)</div>
                            <div class="content">
                                <strong>${order.buyerInfo?.firstName || ''} ${order.buyerInfo?.lastName || ''}</strong><br>
                                ${order.buyerInfo?.address || ''}<br>
                                ${order.buyerInfo?.city || ''}<br>
                                Phone: ${order.buyerInfo?.phone || ''}
                            </div>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">Item Details</div>
                            <div class="content">
                                <strong>${order.itemName || ''}</strong><br>
                                Qty: ${order.quantity || 1} | Total: LKR ${order.total?.toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="right-column">
                        <div class="section">
                            <div class="section-title">Payment</div>
                            <div class="content">
                                ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                  order.paymentMethod === 'bankTransfer' ? 'Bank Transfer' : 
                                  'Online Payment'}
                                ${order.paymentMethod === 'cod' ? 
                                    `<div class="payment-highlight">COLLECT<br>LKR ${order.total?.toLocaleString() || '0'}</div>` : 
                                    order.paymentMethod === 'bankTransfer' ? 
                                        '<div style="font-weight: bold; margin-top: 4px; font-size: 8px;">BANK TRANSFER<br>VERIFY PAYMENT</div>' :
                                        '<div style="font-weight: bold; margin-top: 4px; font-size: 8px;">PAID</div>'
                                }
                            </div>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">Order Info</div>
                            <div class="content">
                                Order: ${order.id}<br>
                                Date: ${new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();
};

export default function OrderSellerRow({ order, setSellerOrders }: { order: any, setSellerOrders: any }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-white border border-[#45495522] rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:shadow transition cursor-pointer">
            <div className="flex items-center gap-4" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
                <img
                    src={order.itemImage || '/placeholder.png'}
                    alt={order.itemName}
                    className="w-16 h-16 object-cover rounded-lg border border-[#45495522] shadow-sm"
                />
                <div className="flex-1 min-w-0">                        <div className="font-bold text-lg mb-1 truncate text-[#0d0a0b]">{order.itemName}</div>
                        <div className="text-[#454955] text-sm mb-1">
                        Status: <span className="font-semibold">
                            {order.status === OrderStatus.PENDING_PAYMENT && (
                                <span className="text-orange-600">Awaiting Payment</span>
                            )}
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
                    <div className="text-[#454955] text-xs truncate">Buyer: {order.buyerName || order.buyerId}</div>
                </div>
                <div className="ml-2 flex flex-col items-end">
                    <span className="text-lg font-bold text-[#0d0a0b] whitespace-nowrap">LKR {order.total?.toLocaleString()}</span>
                    <button
                        className="text-xs text-[#3f7d20] hover:text-[#72b01d] mt-1"
                        onClick={e => { e.stopPropagation(); setExpanded(exp => !exp); }}
                    >
                        {expanded ? "Hide" : "Show"} Summary
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="mt-3 bg-white border border-[#45495522] rounded-2xl p-4 text-sm shadow-sm">
                    <div className="mb-2 font-bold text-[#0d0a0b]">Order Summary</div>
                    <div className="flex flex-col gap-1 text-[#454955]">
                        <div><span className="font-semibold text-[#3f7d20]">Order ID:</span> {order.id}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Item:</span> {order.itemName}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Buyer:</span> {order.buyerName || order.buyerId}</div>
                        {order.buyerInfo && (
                            <>
                                <div><span className="font-semibold text-[#3f7d20]">Buyer Phone:</span> {order.buyerInfo.phone}</div>
                                <div><span className="font-semibold text-[#3f7d20]">Buyer Address:</span> {order.buyerInfo.address}, {order.buyerInfo.city}</div>
                            </>
                        )}
                        {order.buyerNotes && (
                            <div className="mt-2">
                                <span className="font-semibold text-[#3f7d20]">Buyer Notes:</span> 
                                <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                                    {order.buyerNotes}
                                </div>
                            </div>
                        )}
                        <div><span className="font-semibold text-[#3f7d20]">Quantity:</span> {order.quantity}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Price:</span> LKR {order.price?.toLocaleString()}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Shipping:</span> LKR {order.shipping?.toLocaleString()}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Total:</span> LKR {order.total?.toLocaleString()}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Status:</span> 
                            {order.status === OrderStatus.PENDING_PAYMENT && (
                                <span className="text-orange-600 font-bold">Awaiting Payment</span>
                            )}
                            {order.status === OrderStatus.CANCELLED && 'Order Cancelled'}
                            {order.status === OrderStatus.REFUND_REQUESTED && <span className="text-[#72b01d] font-bold">Refund Requested</span>}
                            {order.status === OrderStatus.REFUNDED && 'Order Refunded'}
                            {order.status === OrderStatus.RECEIVED && 'Order Completed'}
                            {order.status === OrderStatus.SHIPPED && 'Order Shipped'}
                            {order.status === OrderStatus.PENDING && 'Order Pending'}
                            {order.status === OrderStatus.CONFIRMED && 'Order Confirmed'}
                            {order.status === OrderStatus.DELIVERED && 'Order Delivered'}
                        </div>
                        {order.paymentMethod && (
                            <div>
                                <span className="font-semibold text-[#3f7d20]">Payment Method:</span> 
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                 order.paymentMethod === 'bankTransfer' ? 'Bank Transfer' :
                                 order.paymentMethod === 'paynow' ? 'Online Payment' :
                                 order.paymentMethod}
                            </div>
                        )}
                        
                        {/* Payment Slip Information for Bank Transfer Orders */}
                        {order.paymentMethod === 'bankTransfer' && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="font-semibold text-blue-800 mb-2 text-sm">
                                    💰 Bank Transfer Order
                                </div>
                                {order.status === OrderStatus.PENDING_PAYMENT ? (
                                    <div className="text-sm text-blue-700">
                                        <div className="mb-2">
                                            ⏳ Waiting for customer to make bank transfer and upload payment slip.
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            Customer will transfer <strong>LKR {order.total?.toLocaleString()}</strong> to your bank account.
                                        </div>
                                    </div>
                                ) : order.paymentSlipUrl ? (
                                    <div className="text-sm text-green-700">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span>✅ Payment slip uploaded!</span>
                                            <a
                                                href={order.paymentSlipUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                📄 View Slip
                                            </a>
                                        </div>
                                        {order.paymentSlipUploadedAt && (
                                            <div className="text-xs text-green-600">
                                                Uploaded: {new Date(order.paymentSlipUploadedAt.seconds ? order.paymentSlipUploadedAt.toDate() : order.paymentSlipUploadedAt).toLocaleString()}
                                            </div>
                                        )}
                                        <div className="text-xs text-green-600 mt-1">
                                            Please verify the payment in your bank account before shipping.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-blue-700">
                                        Bank transfer payment expected. No payment slip uploaded yet.
                                    </div>
                                )}
                            </div>
                        )}
                        {order.createdAt && <div><span className="font-semibold text-[#3f7d20]">Created:</span> {new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : Date.now()).toLocaleString()}</div>}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                        {/* Print Delivery Label Button - Available for all active orders */}
                        {order.buyerInfo && ![OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order.status) && (
                            <button
                                className="px-4 py-2 bg-[#454955] text-white rounded-lg font-bold hover:bg-[#0d0a0b] transition text-sm shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    printDeliveryLabel(order);
                                }}
                            >
                                Print Delivery Label
                            </button>
                        )}
                        
                        {/* Refund Button */}
                        {order.status === OrderStatus.REFUND_REQUESTED && (
                            <button
                                className="px-4 py-2 bg-[#72b01d] text-white rounded-lg font-bold hover:bg-[#3f7d20] transition text-sm shadow-sm"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await updateDoc(doc(db, "orders", order.id), { status: OrderStatus.REFUNDED });
                                    setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: OrderStatus.REFUNDED } : o));
                                }}
                            >
                                Refund Buyer
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="flex gap-2 mt-2">
                {[OrderStatus.CANCELLED, OrderStatus.REFUND_REQUESTED, OrderStatus.REFUNDED, OrderStatus.RECEIVED].includes(order.status) ? (
                    <div className="text-xs text-[#454955] py-2 italic">
                        {order.status === OrderStatus.CANCELLED && 'Order Cancelled'}
                        {order.status === OrderStatus.REFUND_REQUESTED && 'Refund Requested - Awaiting your action'}
                        {order.status === OrderStatus.REFUNDED && 'Order Refunded'}
                        {order.status === OrderStatus.RECEIVED && 'Order Completed'}
                    </div>
                ) : order.status === OrderStatus.PENDING_PAYMENT ? (
                    <div className="text-xs text-orange-600 py-2 italic">
                        💰 Awaiting customer payment. Customer needs to upload payment slip.
                    </div>
                ) : order.status === OrderStatus.SHIPPED ? (
                    <div className="text-xs text-[#454955] py-2 italic">Order Shipped. Waiting for buyer response.</div>
                ) : (
                    <>
                        <button
                            className="px-3 py-1.5 text-xs rounded-lg bg-[#72b01d] text-white border-none hover:bg-[#3f7d20] transition shadow-sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateDoc(doc(db, "orders", order.id), { status: OrderStatus.SHIPPED });
                                setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: OrderStatus.SHIPPED } : o));
                            }}
                        >
                            Mark as Shipped
                        </button>
                        <button
                            className="px-3 py-1.5 text-xs rounded-lg bg-[#454955] text-white border-none hover:bg-[#0d0a0b] transition shadow-sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateDoc(doc(db, "orders", order.id), { status: OrderStatus.REFUNDED });
                                setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: OrderStatus.REFUNDED } : o));
                            }}
                        >
                            Cancel & Refund
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
