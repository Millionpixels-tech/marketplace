import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";

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
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg mb-1 truncate text-[#0d0a0b]">{order.itemName}</div>
                    <div className="text-[#454955] text-sm mb-1">Status: <span className="font-semibold">{order.status}</span></div>
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
                        <div><span className="font-semibold text-[#3f7d20]">Quantity:</span> {order.quantity}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Price:</span> LKR {order.price?.toLocaleString()}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Shipping:</span> LKR {order.shipping?.toLocaleString()}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Total:</span> LKR {order.total?.toLocaleString()}</div>
                        <div><span className="font-semibold text-[#3f7d20]">Status:</span> {order.status === 'REFUND_REQUESTED' ? <span className="text-[#72b01d] font-bold">Refund Requested</span> : order.status}</div>
                        {order.paymentMethod && <div><span className="font-semibold text-[#3f7d20]">Payment:</span> {order.paymentMethod}</div>}
                        {order.createdAt && <div><span className="font-semibold text-[#3f7d20]">Created:</span> {new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : Date.now()).toLocaleString()}</div>}
                    </div>
                    {order.status === 'REFUND_REQUESTED' && (
                        <button
                            className="mt-4 px-4 py-2 bg-[#72b01d] text-white rounded-lg font-bold hover:bg-[#3f7d20] transition text-sm shadow-sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateDoc(doc(db, "orders", order.id), { status: "REFUNDED" });
                                setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: "REFUNDED" } : o));
                            }}
                        >
                            Refund Buyer
                        </button>
                    )}
                </div>
            )}
            <div className="flex gap-2 mt-2">
                {['CANCELLED', 'REFUND_REQUESTED', 'REFUNDED', 'RECEIVED'].includes(order.status) ? (
                    <div className="text-xs text-[#454955] py-2 italic">
                        {order.status === 'CANCELLED' && 'Order Cancelled'}
                        {order.status === 'REFUND_REQUESTED' && 'Refund Requested - Awaiting your action'}
                        {order.status === 'REFUNDED' && 'Order Refunded'}
                        {order.status === 'RECEIVED' && 'Order Completed'}
                    </div>
                ) : order.status === 'SHIPPED' ? (
                    <div className="text-xs text-[#454955] py-2 italic">Order Shipped. Waiting for buyer response.</div>
                ) : (
                    <>
                        <button
                            className="px-3 py-1.5 text-xs rounded-lg bg-[#72b01d] text-white border-none hover:bg-[#3f7d20] transition shadow-sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateDoc(doc(db, "orders", order.id), { status: "SHIPPED" });
                                setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: "SHIPPED" } : o));
                            }}
                        >
                            Mark as Shipped
                        </button>
                        <button
                            className="px-3 py-1.5 text-xs rounded-lg bg-[#454955] text-white border-none hover:bg-[#0d0a0b] transition shadow-sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateDoc(doc(db, "orders", order.id), { status: "REFUNDED" });
                                setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: "REFUNDED" } : o));
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
