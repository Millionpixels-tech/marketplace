import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../utils/firebase";
import Header from "../../components/UI/Header";
import Footer from "../../components/UI/Footer";
import { Button, Input, Card } from "../../components/UI";

export default function ResetPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getFirebaseErrorMessage = (error: any) => {
        const errorCode = error.code;
        
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/too-many-requests':
                return 'Too many requests. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            default:
                return 'Failed to send reset email. Please try again.';
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center p-4 py-16 md:py-24">
                <div className="w-full max-w-sm">
                    <Card className="p-6 shadow-lg bg-white">
                        <h2 className="text-2xl font-bold mb-6 text-center text-[#0d0a0b]">Reset Password</h2>
                        
                        {sent ? (
                            <div className="text-center">
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="text-green-800 text-sm">
                                        If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                                    </div>
                                </div>
                                <Button
                                    onClick={() => window.location.href = '/auth'}
                                    className="w-full py-3 bg-[#72b01d] hover:bg-[#3f7d20] text-white rounded-lg font-semibold"
                                >
                                    Back to Sign In
                                </Button>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="text-red-800 text-sm text-center">{error}</div>
                                    </div>
                                )}
                                
                                <form onSubmit={handleReset} className="space-y-4">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d]"
                                    />
                                    
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-[#72b01d] hover:bg-[#3f7d20] text-white rounded-lg font-semibold"
                                    >
                                        {loading ? "Loading..." : "Send Reset Link"}
                                    </Button>
                                </form>
                                
                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => window.location.href = '/auth'}
                                        className="text-sm text-[#72b01d] hover:text-[#3f7d20] font-semibold"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
