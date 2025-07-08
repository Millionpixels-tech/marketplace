import { useState, useEffect } from "react";
import { auth, db } from "../../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Card } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import { 
  getReferralCodeFromUrl, 
  clearStoredReferralCode, 
  processReferralSignup,
  initializeUserReferral
} from "../../utils/referrals";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refCode } = useParams<{ refCode?: string }>();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Check for referral code on component mount
  useEffect(() => {
    // Check URL params first (from /ref/:refCode route)
    if (refCode) {
      setReferralCode(refCode);
      // Store in sessionStorage for later use during signup
      sessionStorage.setItem('referralCode', refCode);
    } else {
      // Check query params (?ref=code)
      const refCodeFromUrl = getReferralCodeFromUrl();
      if (refCodeFromUrl) {
        setReferralCode(refCodeFromUrl);
      }
    }
  }, [refCode]);

  // Process referral after successful signup
  const processReferralAfterSignup = async (userId: string, userEmail: string, signupMethod: 'email' | 'google', userName?: string) => {
    if (referralCode) {
      try {
        await processReferralSignup(referralCode, userId, userEmail, signupMethod, userName);
        clearStoredReferralCode();
        console.log('Referral processed successfully');
      } catch (error) {
        console.error('Error processing referral:', error);
        // Don't fail the signup if referral processing fails
      }
    }

    // Initialize referral system for the new user
    try {
      await initializeUserReferral(userId);
    } catch (error) {
      console.error('Error initializing user referral:', error);
      // Don't fail the signup if referral initialization fails
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const getFirebaseErrorMessage = (error: any) => {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked. Please allow popups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError("Please verify your email before signing in. Check your inbox for the verification link.");
          await auth.signOut();
          return;
        }
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: displayName.trim() || '',
          photoURL: userCredential.user.photoURL || '',
          createdAt: new Date(),
          isGoogleUser: false,
          emailVerified: userCredential.user.emailVerified,
          description: '',
          bankAccounts: []
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        
        // Process referral signup
        await processReferralAfterSignup(
          userCredential.user.uid,
          userCredential.user.email || '',
          'email',
          displayName.trim() || ''
        );
        
        await sendEmailVerification(userCredential.user);
        await auth.signOut();
        setMessage(`Verification email sent to ${email}. Please check your inbox and verify your email before signing in.`);
        setMode('login'); // Don't use switchMode here to preserve the message
        setPassword("");
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage(`Password reset link sent to ${email}. Check your inbox.`);
        switchMode('login');
      }
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      // For existing users who need to resend verification, we suggest they try to create an account again
      // or contact support. Firebase doesn't provide a direct way to resend verification for existing users.
      setMessage(`To resend verification for ${email}, try signing up again with the same email, or contact support if the issue persists.`);
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    clearMessages();
    if (newMode === 'reset') {
      setPassword("");
    }
    if (newMode !== 'signup') {
      setDisplayName("");
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'reset': return 'Reset Password';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'login': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'reset': return 'Send Reset Link';
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <SEOHead
        title={`${getTitle()} - Sri Lankan Marketplace`}
        description={mode === 'login' 
          ? "Sign in to your Sri Lankan Marketplace account to access your dashboard, manage listings, and connect with authentic Sri Lankan artisans."
          : mode === 'signup'
          ? "Create your Sri Lankan Marketplace account to start buying authentic Sri Lankan products or become a seller and showcase your crafts to the world."
          : "Reset your password to regain access to your Sri Lankan Marketplace account."
        }
        keywords={generateKeywords([
          mode === 'login' ? 'sign in' : mode === 'signup' ? 'create account' : 'reset password',
          'login',
          'register',
          'user account',
          'seller dashboard',
          'buyer account'
        ])}
        canonicalUrl={getCanonicalUrl('/auth')}
        noIndex={true}
      />
      
      <ResponsiveHeader />

      {/* Referral Banner */}
      {referralCode && (
        <div className="bg-green-600 text-white py-3 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm md:text-base">
              🎉 You're signing up through a referral! 
              <span className="font-semibold ml-1">
                Complete your registration to help your friend earn LKR 20!
              </span>
            </p>
          </div>
        </div>
      )}

      <main className="flex flex-1 items-center justify-center p-4 py-16 md:py-24">
        <div className="w-full max-w-sm">
          <Card className="p-6 shadow-lg bg-white">
            <h2 className="text-2xl font-bold text-center mb-6 text-[#0d0a0b]">
              {getTitle()}
            </h2>
            
            {/* Success Message */}
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-800 text-sm text-center">{message}</div>
                {message.includes("Verification email sent") && email && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <button
                      type="button"
                      onClick={resendVerificationEmail}
                      disabled={loading}
                      className="w-full py-2 text-sm font-semibold text-green-700 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
                    >
                      {loading ? "Sending..." : "Resend verification email"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm text-center">{error}</div>
                {error.includes("verify your email") && email && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <button
                      type="button"
                      onClick={resendVerificationEmail}
                      disabled={loading}
                      className="w-full py-2 text-sm font-semibold text-red-700 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                    >
                      {loading ? "Sending..." : "Resend verification email"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d]"
                />
              )}
              
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d]"
              />
              
              {mode !== 'reset' && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d]"
                />
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#72b01d] hover:bg-[#3f7d20] text-white rounded-lg font-semibold"
              >
                {loading ? "Loading..." : getButtonText()}
              </Button>
            </form>

            {mode !== 'reset' && (
              <>
                <div className="my-4 text-center text-gray-500 text-sm">or</div>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  className="w-full py-3 bg-white border border-gray-300 rounded-lg font-semibold flex items-center justify-center gap-3"
                  onClick={handleGoogle}
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.6 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.7-7.2 19.8-17H44.5z" />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}

            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              {mode === 'login' && (
                <>
                  <div>
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[#72b01d] hover:text-[#3f7d20] font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-[#72b01d] hover:text-[#3f7d20] font-semibold"
                    >
                      Sign Up
                    </button>
                  </div>
                </>
              )}
              
              {mode === 'signup' && (
                <div>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-[#72b01d] hover:text-[#3f7d20] font-semibold"
                  >
                    Sign In
                  </button>
                </div>
              )}
              
              {mode === 'reset' && (
                <div>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-[#72b01d] hover:text-[#3f7d20] font-semibold"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
