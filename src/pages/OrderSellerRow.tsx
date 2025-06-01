import { useState } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

export default function OrderSellerRow({ order, setSellerOrders }: { order: any, setSellerOrders: any }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center gap-4" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
                <img
                    src={order.itemImage || '/placeholder.png'}
                    alt={order.itemName}
                    className="w-16 h-16 object-cover rounded-lg border"
                />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg mb-1 truncate">{order.itemName}</div>
                    <div className="text-gray-700 text-sm mb-1">Status: <span className="font-semibold">{order.status}</span></div>
                    <div className="text-gray-600 text-xs truncate">Buyer: {order.buyerName || order.buyerId}</div>
                </div>
                <div className="ml-2 flex flex-col items-end">
                    <span className="text-lg font-bold text-black whitespace-nowrap">LKR {order.total?.toLocaleString()}</span>
                    <button
                        className="text-xs text-black underline mt-1"
                        onClick={e => { e.stopPropagation(); setExpanded(exp => !exp); }}
                    >
                        {expanded ? "Hide" : "Show"} Summary
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 text-sm">
                    <div className="mb-2 font-bold">Order Summary</div>
                    <div className="flex flex-col gap-1">
                        <div><span className="font-semibold">Order ID:</span> {order.id}</div>
                        <div><span className="font-semibold">Item:</span> {order.itemName}</div>
                        <div><span className="font-semibold">Buyer:</span> {order.buyerName || order.buyerId}</div>
                        <div><span className="font-semibold">Quantity:</span> {order.quantity}</div>
                        <div><span className="font-semibold">Price:</span> LKR {order.price?.toLocaleString()}</div>
                        <div><span className="font-semibold">Shipping:</span> LKR {order.shipping?.toLocaleString()}</div>
                        <div><span className="font-semibold">Total:</span> LKR {order.total?.toLocaleString()}</div>
                        <div><span className="font-semibold">Status:</span> {order.status === 'REFUND_REQUESTED' ? <span className="text-yellow-700 font-bold">Refund Requested</span> : order.status}</div>
                        {order.paymentMethod && <div><span className="font-semibold">Payment:</span> {order.paymentMethod}</div>}
                        {order.createdAt && <div><span className="font-semibold">Created:</span> {new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : Date.now()).toLocaleString()}</div>}
                    </div>
                    {order.status === 'REFUND_REQUESTED' && (
                        <button
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition text-sm"
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
                    <div className="text-xs text-gray-500 py-2">
                        {order.status === 'CANCELLED' && 'Order Cancelled'}
                        {order.status === 'REFUND_REQUESTED' && 'Refund Requested - Awaiting your action'}
                        {order.status === 'REFUNDED' && 'Order Refunded'}
                        {order.status === 'RECEIVED' && 'Order Completed'}
                    </div>
                ) : order.status === 'SHIPPED' ? (
                    <div className="text-xs text-gray-500 py-2">Order Shipped. Waiting for buyer response.</div>
                ) : (
                    <>
                        <button
                            className="px-2 py-1 text-xs rounded bg-green-600 text-white border border-green-700 hover:bg-green-700"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateDoc(doc(db, "orders", order.id), { status: "SHIPPED" });
                                setSellerOrders((prev: any[]) => prev.map(o => o.id === order.id ? { ...o, status: "SHIPPED" } : o));
                            }}
                        >
                            Mark as Shipped
                        </button>
                        <button
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white border border-red-700 hover:bg-red-700"
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
