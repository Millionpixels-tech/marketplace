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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
                    {sent ? (
                        <div className="text-green-600 text-center mb-4">
                            If an account exists for <b>{email}</b>, a password reset link has been sent.
                        </div>
                    ) : (
                        <form className="flex flex-col gap-5" onSubmit={handleReset}>
                            <input
                                type="email"
                                className="bg-gray-100 focus:bg-white focus:ring-2 focus:ring-black px-5 py-3 rounded-xl font-medium transition text-black placeholder:text-gray-400"
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
                                className="bg-black text-white rounded-xl py-3 text-lg font-bold uppercase tracking-wide shadow hover:bg-black/90 transition disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    )}
                    <div className="text-center mt-6">
                        <a href="/auth" className="text-sm underline text-gray-600 hover:text-black">Back to Login</a>
                    </div>
                </div>
            </div>
        </>
    );
}
