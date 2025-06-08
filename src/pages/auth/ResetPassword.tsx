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
            <div className="min-h-screen flex items-center justify-center bg-white px-4">
                <Card className="p-8 w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-[#0d0a0b]">Reset Password</h2>
                    {sent ? (
                        <div className="text-[#3f7d20] text-center mb-4">
                            If an account exists for <b>{email}</b>, a password reset link has been sent.
                        </div>
                    ) : (
                        <form className="flex flex-col gap-5" onSubmit={handleReset}>
                            <Input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                            {error && <div className="text-red-500 text-center text-sm font-medium">{error}</div>}
                            <Button
                                type="submit"
                                disabled={loading}
                                loading={loading}
                                className="rounded-2xl py-3 text-lg font-bold uppercase tracking-wide"
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    )}
                    <div className="text-center mt-6">
                        <a href="/auth" className="text-sm text-[#454955] hover:text-[#3f7d20] font-medium transition">Back to Login</a>
                    </div>
                </Card>
            </div>
            <Footer />
        </>
    );
}
