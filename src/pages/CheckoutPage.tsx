import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

declare global {
    interface Window {
        payhere: any;
    }
}

export default function CheckoutPage() {
    const [searchParams] = useSearchParams();
    const [payhereReady, setPayhereReady] = useState(false);

    const itemName = searchParams.get("itemName") || "Unknown Item";
    const itemId = searchParams.get("itemId");
    const price = parseFloat(searchParams.get("price") || "0");
    const quantity = parseInt(searchParams.get("quantity") || "1");
    const total = parseFloat(searchParams.get("total") || "0");
    const image = searchParams.get("image");
    const shopName = searchParams.get("shopName");

    const merchant_id = "1227627"; // Replace with your PayHere sandbox ID
    const return_url = "http://localhost:3000/payment-success";
    const cancel_url = "http://localhost:3000/payment-cancel";
    const notify_url = "http://localhost:3000/api/payhere-notify";

    // Load PayHere SDK
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sandbox.payhere.lk/payhere.js";
        script.async = true;
        script.onload = () => setPayhereReady(true);
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePay = () => {
        if (!window.payhere || !payhereReady) {
            alert("Payment SDK is still loading. Please wait a moment.");
            return;
        }

        window.payhere.startPayment({
            sandbox: true,
            merchant_id,
            return_url,
            cancel_url,
            notify_url,
            order_id: `${itemId}-${Date.now()}`,
            items: itemName,
            amount: total,
            currency: "LKR",
            first_name: "Test",
            last_name: "User",
            email: "test@example.com",
            phone: "0771234567",
            address: "No. 1, Galle Road",
            city: "Colombo",
            country: "Sri Lanka",
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Checkout</h2>
                <div className="flex gap-4 items-center mb-4">
                    <img src={image || "/placeholder.png"} alt={itemName} className="w-24 h-24 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{itemName}</h3>
                        <p className="text-sm text-gray-600 truncate">From {shopName}</p>
                        <p className="text-sm text-gray-600">Qty: {quantity}</p>
                    </div>
                </div>
                <div className="text-right text-lg font-semibold mb-6">Total: LKR {total.toLocaleString()}</div>
                <button
                    onClick={handlePay}
                    disabled={!payhereReady}
                    className={`w-full py-3 rounded-xl font-bold text-lg uppercase tracking-wide shadow transition ${payhereReady
                        ? "bg-black text-white hover:bg-black/90"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                >
                    {payhereReady ? "Pay with PayHere" : "Loading..."}
                </button>
            </div>
        </div>
    );
}
