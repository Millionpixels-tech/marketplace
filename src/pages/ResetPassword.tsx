import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../utils/firebase";
import Header from "../components/UI/Header";

export default function ResetPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen flex items-center justify-center bg-[#f3eff5] px-4">
                <div className="bg-[#f3eff5] rounded-2xl shadow-lg p-8 w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-[#0d0a0b]">Reset Password</h2>
                    {sent ? (
                        <div className="text-[#3f7d20] text-center mb-4">
                            If an account exists for <b>{email}</b>, a password reset link has been sent.
                        </div>
                    ) : (
                        <form className="flex flex-col gap-5" onSubmit={handleReset}>
                            <input
                                type="email"
                                className="bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d] px-5 py-3 rounded-2xl font-medium transition text-[#0d0a0b] placeholder:text-[#45495588] shadow-sm"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                            {error && <div className="text-red-500 text-center text-sm font-medium">{error}</div>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#72b01d] text-white rounded-2xl py-3 text-lg font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] transition disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    )}
                    <div className="text-center mt-6">
                        <a href="/auth" className="text-sm text-[#454955] hover:text-[#3f7d20] font-medium transition">Back to Login</a>
                    </div>
                </div>
            </div>
        </>
    );
}
