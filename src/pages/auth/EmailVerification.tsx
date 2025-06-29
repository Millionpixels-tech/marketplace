import { useState, useEffect } from "react";
import { auth } from "../../utils/firebase";
import { sendEmailVerification } from "firebase/auth";
import type { User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";

const EmailVerification = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    if (currentUser.emailVerified) {
      navigate("/dashboard");
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      await sendEmailVerification(user);
      setMessage("Verification email sent! Please check your inbox and spam folder.");
    } catch (error: any) {
      setMessage(error.message || "Failed to send verification email");
    }
    
    setLoading(false);
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        navigate("/dashboard");
      } else {
        setMessage("Email not yet verified. Please check your email and click the verification link.");
      }
    } catch (error: any) {
      setMessage(error.message || "Failed to check verification status");
    }
    setLoading(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <SEOHead
        title="Email Verification - Sri Lankan Marketplace"
        description="Verify your email address to complete your account setup and access all features of the Sri Lankan Marketplace."
        noIndex={true}
      />
      <ResponsiveHeader />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Card className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0d0a0b] mb-2 sm:mb-3 leading-tight">
                Verify Your Email
              </h2>
              <p className="text-sm sm:text-base text-[#454955] font-medium mb-4">
                We've sent a verification link to:<br />
                <span className="font-bold text-[#0d0a0b] break-all">{user.email}</span>
              </p>
            </div>

          {message && (
            <div className={`px-4 py-4 sm:px-6 sm:py-5 rounded-xl text-sm sm:text-base mb-6 sm:mb-8 ${
              message.includes("sent") || message.includes("Verification email sent") 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className={`w-5 h-5 mt-0.5 ${message.includes("sent") ? "text-green-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d={message.includes("sent") ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium">{message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="space-y-3">
              <div className="flex items-center text-sm sm:text-base text-blue-700">
                <span className="text-lg mr-3">📧</span>
                <span>Check your inbox and spam folder</span>
              </div>
              <div className="flex items-center text-sm sm:text-base text-blue-700">
                <span className="text-lg mr-3">🔗</span>
                <span>Click the verification link in the email</span>
              </div>
              <div className="flex items-center text-sm sm:text-base text-blue-700">
                <span className="text-lg mr-3">↩️</span>
                <span>Return here and click "I've verified my email"</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleRefreshStatus}
              disabled={loading}
              className="w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}
            >
              I've verified my email
            </Button>

            <Button
              variant="secondary"
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-md hover:shadow-lg border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              Resend verification email
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                auth.signOut();
                navigate("/auth");
              }}
              className="w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-[#72b01d] text-[#3f7d20] hover:bg-[#72b01d] hover:text-white transition-all duration-200"
            >
              Sign in with different account
            </Button>
          </div>
        </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EmailVerification;
