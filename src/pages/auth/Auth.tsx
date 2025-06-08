import { useState, useEffect } from "react";
import { auth } from "../../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Header, Button, Input, Card } from "../../components/UI";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(`/dashboard/${user.uid}`);
    }
  }, [user, navigate]);

  const handleAuth = async () => {
    setErr("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        await createUserWithEmailAndPassword(auth, email, pw);
      }
    } catch (e: any) {
      setErr(e.message || "Authentication failed");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setErr("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setErr(e.message || "Google sign in failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <SEOHead
        title={isLogin ? "Sign In - Sri Lankan Marketplace" : "Create Account - Sri Lankan Marketplace"}
        description={isLogin 
          ? "Sign in to your Sri Lankan Marketplace account to access your dashboard, manage listings, and connect with authentic Sri Lankan artisans."
          : "Create your Sri Lankan Marketplace account to start buying authentic Sri Lankan products or become a seller and showcase your crafts to the world."
        }
        keywords={generateKeywords([
          isLogin ? 'sign in' : 'create account',
          'login',
          'register',
          'user account',
          'seller dashboard',
          'buyer account'
        ])}
        canonicalUrl={getCanonicalUrl('/auth')}
        noIndex={true}
      />
      {/* Minimal Header */}
      <Header />

      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-sm px-6 py-10 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-2 text-[#0d0a0b]">
            {isLogin ? "Sign in to your account" : "Create an account"}
          </h2>
          {err && (
            <div className="text-red-500 text-center text-sm font-medium py-1">{err}</div>
          )}
          <form
            className="flex flex-col gap-5"
            onSubmit={e => { e.preventDefault(); handleAuth(); }}
            autoComplete="off"
          >
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="px-5 py-3 rounded-2xl font-medium shadow-sm"
            />
            <Input
              type="password"
              placeholder="Password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
              className="px-5 py-3 rounded-2xl font-medium shadow-sm"
            />
            {isLogin && (
              <div className="text-right -mt-4 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // You can show a modal or redirect to a dedicated reset page
                    window.location.href = '/reset-password';
                  }}
                  className="text-sm text-[#3f7d20] hover:text-[#72b01d] font-semibold transition border-0 p-0 bg-transparent"
                >
                  Forgot password?
                </Button>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="rounded-2xl py-3 text-lg uppercase tracking-wide shadow-sm"
            >
              {isLogin ? "Sign In" : "Register"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              className="flex items-center justify-center gap-3 rounded-2xl py-3 text-lg font-semibold shadow-sm"
              onClick={handleGoogle}
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.6 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.7-7.2 19.8-17H44.5z" /><path fill="#34A853" d="M6.3 14.7l7 5.1C15.4 17 19.4 14 24 14c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 16.7 4 10.1 8.7 6.3 14.7z" /><path fill="#FBBC05" d="M24 44c5.4 0 10.2-1.8 13.9-5l-6.4-5.2C29.5 35.1 26.9 36 24 36c-5.8 0-10.6-2.9-13.4-7.2l-7 5.4C10.1 39.3 16.7 44 24 44z" /><path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.6 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.7-7.2 19.8-17H44.5z" opacity=".15" /></g></svg>
              Continue with Google
            </Button>
          </form>
          <div className="text-center text-sm text-[#454955]">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLogin(false)}
                  className="font-semibold text-[#3f7d20] hover:text-[#72b01d] transition border-0 p-0 bg-transparent"
                >
                  Register
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLogin(true)}
                  className="font-semibold text-[#3f7d20] hover:text-[#72b01d] transition border-0 p-0 bg-transparent"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
